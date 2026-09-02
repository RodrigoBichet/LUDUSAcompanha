// =============================================================================
// sessionsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das sessões de jogo.
// Recebe o JSON do SDK Unity, valida e salva no MongoDB.
// Se a sessão contém screenshots, salva os arquivos em disco e
// armazena apenas o caminho no banco — nunca o base64.
// =============================================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Session = require("../models/Session");
const Student = require("../models/Student");
const Game = require("../models/Game");
const {
    ErroValidacaoTelemetria,
    validarSessaoTelemetria,
} = require("../services/telemetryValidator");
const {
    normalizarSessaoTelemetria,
} = require("../services/telemetryNormalizer");
const {
    validarLoteTelemetria,
} = require("../services/batchTelemetryValidator");
const {
    adaptarRelatorioMonitorLegado,
} = require("../services/legacyMonitorAdapter");
const { buscarAlunoComAcesso } = require("../services/schoolAccess");
const { removerSessoesPorFiltro } = require("../utils/removerSessoes");

// Pasta onde os screenshots das fases serão salvos
// Fica em backend/uploads/screenshots/ — servida como static pelo Express
const PASTA_SCREENSHOTS = path.join(__dirname, "../../uploads/screenshots");

// -------------------------------------------------------------------------
// processarScreenshots
// Função auxiliar chamada dentro do criarSessao.
// Percorre o array de screenshots recebido do SDK, salva cada imagem
// como arquivo JPEG em disco e substitui o base64 pelo caminho do arquivo.
// Retorna um novo array já sem o campo screenshotBase64.
// -------------------------------------------------------------------------

const processarScreenshots = (screenshots, sessionId) => {
    // Garante que a pasta de destino existe antes de tentar salvar
    if (!fs.existsSync(PASTA_SCREENSHOTS)) {
        fs.mkdirSync(PASTA_SCREENSHOTS, { recursive: true });
    }

    const sessionIdSeguro = String(sessionId).replace(/[^A-Za-z0-9._-]/g, "_");

    return screenshots.map((screenshot) => {
        // Referências já existentes são preservadas. O Unity legado envia
        // screenshotBase64, que é convertido para um caminho local abaixo.
        if (!screenshot.screenshotBase64) {
            return {
                faseIndex: screenshot.faseIndex,
                phaseId: screenshot.phaseId,
                timestamp: screenshot.timestamp,
                caminho: screenshot.caminho || null,
            };
        }

        // Nome do arquivo: sessionId_faseN.jpg — garante unicidade
        const nomeArquivo = `${sessionIdSeguro}_fase${screenshot.faseIndex}.jpg`;
        const caminhoCompleto = path.join(PASTA_SCREENSHOTS, nomeArquivo);

        // Decodifica o base64 e salva como arquivo binário
        const buffer = Buffer.from(screenshot.screenshotBase64, "base64");
        fs.writeFileSync(caminhoCompleto, buffer);

        console.log(`[LUDUS] Screenshot salvo: ${nomeArquivo}`);

        // Retorna o objeto sem o base64 — só com o caminho público
        return {
            faseIndex: screenshot.faseIndex,
            phaseId: screenshot.phaseId,
            timestamp: screenshot.timestamp,
            caminho: `/uploads/screenshots/${nomeArquivo}`,
        };
    });
};

const validarENormalizarSessao = (dadosBrutos) => {
    const resultadoValidacao = validarSessaoTelemetria(dadosBrutos);
    return normalizarSessaoTelemetria(
        resultadoValidacao.dados,
        resultadoValidacao.tipo,
    );
};

const salvarSessaoNormalizada = async (
    dados,
    { resetarCapturaSolicitada = false } = {},
) => {
    const sessaoExistente = await buscarSessaoDuplicadaImportada(dados);

    if (sessaoExistente) {
        const erro = new Error("Sessão já registrada com este sessionId");
        erro.status = 409;
        throw erro;
    }

    const temScreenshots =
        Array.isArray(dados.screenshots) && dados.screenshots.length > 0;
    const temCapturasBase64 = temScreenshots && dados.screenshots.some(
        (screenshot) => Boolean(screenshot.screenshotBase64),
    );

    if (temScreenshots) {
        dados.screenshots = processarScreenshots(
            dados.screenshots,
            dados.sessionId,
        );
    }

    const sessao = new Session(dados);
    await sessao.save();

    if (resetarCapturaSolicitada && temCapturasBase64) {
        try {
            await Student.findOneAndUpdate(
                { _id: dados.studentId, capturaSolicitada: true },
                {
                    capturaSolicitada: false,
                    capturaSolicitadaOrigem: null,
                },
            );
        } catch (erroReset) {
            console.warn(
                "[LUDUS] Não foi possível resetar capturaSolicitada:",
                erroReset.message,
            );
        }
    }

    return sessao;
};

const criarSessionIdDeImportacao = (sourceSessionId, studentId) => {
    const hash = crypto
        .createHash("sha256")
        .update(`${sourceSessionId}:${studentId}`)
        .digest("hex");

    return `import-${hash}`;
};

const buscarSessaoDuplicadaImportada = (dados) => {
    const filtros = [{ sessionId: dados.sessionId }];

    if (dados.ingestionMethod === "file-import" && dados.sourceSessionId) {
        filtros.push({
            studentId: dados.studentId,
            sourceSessionId: dados.sourceSessionId,
        });
        // Compatibilidade com importações realizadas antes de sourceSessionId
        // existir no modelo: o sessionId original era salvo diretamente.
        filtros.push({
            studentId: dados.studentId,
            sessionId: dados.sourceSessionId,
            ingestionMethod: "file-import",
        });
    }

    return Session.findOne({ $or: filtros });
};

// A importação é uma evidência de que este aluno participou do jogo indicado
// pelo próprio JSON. O vínculo é feito sem criar outro perfil, inclusive para
// alunos que já pertencem a uma turma.
const registrarJogoEAssociarAluno = async ({
    usuarioId,
    aluno,
    dados,
    nomeJogoDetectado,
}) => {
    const scopeKey = `user:${usuarioId}`;
    const jogo = await Game.findOneAndUpdate(
        { scopeKey, gameId: dados.gameId },
        {
            $setOnInsert: {
                gameId: dados.gameId,
                name: nomeJogoDetectado || dados.gameId,
                sourceType: "external-json",
                scopeType: "personal",
                scopeKey,
                ownerUserId: usuarioId,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await Student.updateOne(
        { _id: aluno._id },
        { $addToSet: { assignedGameIds: dados.gameId } },
    );

    return jogo;
};

const buscarAlunoParaImportacao = async (studentId, usuarioId) => {
    if (!mongoose.isValidObjectId(studentId)) {
        throw new ErroValidacaoTelemetria(
            "studentId inválido na rota de importação.",
        );
    }

    const aluno = await buscarAlunoComAcesso(usuarioId, studentId);

    if (!aluno) {
        const erro = new Error("Aluno não encontrado");
        erro.status = 404;
        throw erro;
    }

    return aluno;
};

const prepararDadosImportacao = ({
    dadosBrutos,
    aluno,
    gameIdSelecionado = "",
}) => {

    if (!dadosBrutos || typeof dadosBrutos !== "object") {
        throw new ErroValidacaoTelemetria(
            "Envie o JSON da sessão no campo sessao.",
        );
    }

    const studentIdPendenteDeImportacao = "000000000000000000000000";

    if (
        dadosBrutos.studentId &&
        dadosBrutos.studentId !== studentIdPendenteDeImportacao &&
        String(dadosBrutos.studentId) !== String(aluno._id)
    ) {
        throw new ErroValidacaoTelemetria(
            "O studentId do JSON não corresponde ao aluno selecionado.",
        );
    }

    const dadosAdaptados = adaptarRelatorioMonitorLegado(dadosBrutos);
    const gameIdNormalizado = String(gameIdSelecionado || "").trim();
    const nomeJogoDetectado = String(
        dadosBrutos.app || dadosAdaptados.gameId,
    ).trim();

    if (gameIdNormalizado && !/^[a-z0-9][a-z0-9-]{0,99}$/.test(gameIdNormalizado)) {
        throw new ErroValidacaoTelemetria("gameId inválido no contexto da importação.");
    }

    if (gameIdNormalizado && gameIdNormalizado !== dadosAdaptados.gameId) {
        const erro = new Error(
            `Este JSON pertence ao jogo \"${nomeJogoDetectado}\", não ao jogo selecionado.`,
        );
        erro.status = 409;
        erro.codigo = "JOGO_INCOMPATIVEL";
        erro.jogoDetectado = {
            gameId: dadosAdaptados.gameId,
            nome: nomeJogoDetectado || dadosAdaptados.gameId,
        };
        throw erro;
    }

    const dadosParaImportar = {
        ...dadosAdaptados,
        studentId: String(aluno._id),
    };

    if (dadosParaImportar.schemaVersion) {
        dadosParaImportar.ingestionMethod = "file-import";
    }

    const dados = validarENormalizarSessao(dadosParaImportar);
    dados.playerId = aluno.name;
    dados.ingestionMethod = "file-import";
    dados.sourceSessionId = dadosAdaptados.sessionId;
    dados.sourceGameId = dadosAdaptados.gameId;
    dados.sessionId = criarSessionIdDeImportacao(
        dados.sourceSessionId,
        aluno._id,
    );

    return { aluno, dados, nomeJogoDetectado };
};

const prepararImportacao = async (req) => {
    const aluno = await buscarAlunoParaImportacao(
        req.params.studentId,
        req.usuarioId,
    );

    return prepararDadosImportacao({
        dadosBrutos: req.body?.sessao,
        aluno,
        gameIdSelecionado: req.body?.gameId,
    });
};

const normalizarNomeParaComparacao = (valor) =>
    String(valor || "")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLocaleLowerCase("pt-BR")
        .replace(/\s+/g, " ")
        .trim();

const prepararLoteImportacao = async (req) => {
    const lote = validarLoteTelemetria(req.body?.lote);
    const aluno = await buscarAlunoParaImportacao(
        req.params.studentId,
        req.usuarioId,
    );
    const itens = lote.sessions.map((sessao) =>
        prepararDadosImportacao({ dadosBrutos: sessao, aluno }),
    );
    const nomeCoincide =
        normalizarNomeParaComparacao(lote.participant.displayName) ===
        normalizarNomeParaComparacao(aluno.name);

    return { lote, aluno, itens, nomeCoincide };
};

const resumirImportacao = (dados, jaRegistrada) => ({
    sessionId: dados.sessionId,
    gameId: dados.gameId,
    gameVersion: dados.gameVersion || null,
    captureMode: dados.captureMode,
    source: dados.source,
    durationMs: dados.durationMs || 0,
    capabilities: dados.capabilities,
    totalClicks: dados.metrics?.totalClicks ?? dados.clicks?.length ?? 0,
    totalEventos: dados.gameEvents?.length || 0,
    totalScreenshots: dados.screenshots?.length || 0,
    jaRegistrada,
});

const resumirLoteImportacao = async ({ lote, aluno, itens, nomeCoincide }) => {
    const sessoes = await Promise.all(
        itens.map(async ({ dados }) =>
            resumirImportacao(
                dados,
                Boolean(await buscarSessaoDuplicadaImportada(dados)),
            ),
        ),
    );
    const jogos = new Map();

    for (const sessao of sessoes) {
        const atual = jogos.get(sessao.gameId) || {
            gameId: sessao.gameId,
            totalSessoes: 0,
            jaRegistradas: 0,
        };
        atual.totalSessoes += 1;
        if (sessao.jaRegistrada) atual.jaRegistradas += 1;
        jogos.set(sessao.gameId, atual);
    }

    return {
        tipo: "lote-observacional",
        batchId: lote.batchId,
        createdAt: lote.createdAt,
        participante: {
            participantRef: lote.participant.participantRef,
            nomeInformado: lote.participant.displayName,
            alunoSelecionado: aluno.name,
            nomeCoincide,
            requerConfirmacao: !nomeCoincide,
        },
        totalSessoes: sessoes.length,
        totalImportaveis: sessoes.filter((sessao) => !sessao.jaRegistrada)
            .length,
        totalJaRegistradas: sessoes.filter((sessao) => sessao.jaRegistrada)
            .length,
        jogos: [...jogos.values()],
        sessoes,
    };
};

// -------------------------------------------------------------------------
// criarSessao — POST /api/sessions
// Recebe o JSON da sessão gerado pelo LudusExporter e salva no banco.
// -------------------------------------------------------------------------

const criarSessao = async (req, res) => {
    try {
        let dados;

        try {
            dados = validarENormalizarSessao(req.body);
        } catch (erroValidacao) {
            if (!(erroValidacao instanceof ErroValidacaoTelemetria)) {
                throw erroValidacao;
            }

            return res.status(400).json({
                sucesso: false,
                mensagem: erroValidacao.message,
                detalhes: erroValidacao.detalhes,
            });
        }

        const aluno = await Student.findById(dados.studentId);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado para esta sessão",
            });
        }

        dados.playerId = aluno.name;

        const sessao = await salvarSessaoNormalizada(dados, {
            resetarCapturaSolicitada: true,
        });

        console.log(
            `[LUDUS] Sessão recebida: ${sessao.sessionId} | Player: ${sessao.playerId}`,
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Sessão registrada com sucesso!",
            sessionId: sessao.sessionId,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao salvar sessão:", erro.message);
        if (erro.status) {
            return res.status(erro.status).json({
                sucesso: false,
                mensagem: erro.message,
            });
        }
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao salvar sessão",
        });
    }
};

// -------------------------------------------------------------------------
// previewImportacao — POST /api/sessions/import/:studentId/preview
// Valida e normaliza um JSON sem gravar dados no MongoDB.
// -------------------------------------------------------------------------

const previewImportacao = async (req, res) => {
    try {
        const { dados } = await prepararImportacao(req);
        const jaRegistrada = Boolean(
            await buscarSessaoDuplicadaImportada(dados),
        );

        return res.json({
            sucesso: true,
            mensagem: "Sessão validada para importação.",
            preview: resumirImportacao(dados, jaRegistrada),
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
                codigo: erro.codigo || null,
                jogoDetectado: erro.jogoDetectado || null,
            });
        }

        console.error("[LUDUS] Erro ao pré-visualizar importação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao pré-visualizar importação",
        });
    }
};

// -------------------------------------------------------------------------
// confirmarImportacao — POST /api/sessions/import/:studentId/confirm
// Persiste uma sessão já revisada no fluxo de importação autenticado.
// -------------------------------------------------------------------------

const confirmarImportacao = async (req, res) => {
    try {
        const { aluno, dados, nomeJogoDetectado } = await prepararImportacao(req);
        const jogo = await registrarJogoEAssociarAluno({
            usuarioId: req.usuarioId,
            aluno,
            dados,
            nomeJogoDetectado,
        });
        const sessao = await salvarSessaoNormalizada(dados);

        console.log(
            `[LUDUS] Sessão importada: ${sessao.sessionId} | Player: ${sessao.playerId}`,
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Sessão importada com sucesso!",
            sessionId: sessao.sessionId,
            jogo: {
                gameId: jogo.gameId,
                name: jogo.name,
            },
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
                codigo: erro.codigo || null,
                jogoDetectado: erro.jogoDetectado || null,
            });
        }

        console.error("[LUDUS] Erro ao confirmar importação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao confirmar importação",
        });
    }
};

// -------------------------------------------------------------------------
// previewImportacaoLote — POST /api/sessions/import-batch/:studentId/preview
// Valida o envelope e todas as sessões sem persistir qualquer dado.
// -------------------------------------------------------------------------

const previewImportacaoLote = async (req, res) => {
    try {
        const preparado = await prepararLoteImportacao(req);
        const preview = await resumirLoteImportacao(preparado);

        return res.json({
            sucesso: true,
            mensagem: "Lote validado para importação.",
            preview,
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
            });
        }

        console.error("[LUDUS] Erro ao pré-visualizar lote:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao pré-visualizar lote",
        });
    }
};

// -------------------------------------------------------------------------
// confirmarImportacaoLote — POST /api/sessions/import-batch/:studentId/confirm
// Revalida todo o lote e importa somente após a confirmação autenticada.
// -------------------------------------------------------------------------

const confirmarImportacaoLote = async (req, res) => {
    try {
        const preparado = await prepararLoteImportacao(req);

        if (
            !preparado.nomeCoincide &&
            req.body?.confirmarNomeDiferente !== true
        ) {
            return res.status(409).json({
                sucesso: false,
                codigo: "PARTICIPANTE_DIVERGENTE",
                mensagem:
                    "O nome do participante no lote difere do aluno selecionado. Confirme conscientemente antes de importar.",
                participante: {
                    nomeInformado: preparado.lote.participant.displayName,
                    alunoSelecionado: preparado.aluno.name,
                },
            });
        }

        const resultados = [];

        for (const { dados, nomeJogoDetectado } of preparado.itens) {
            if (await buscarSessaoDuplicadaImportada(dados)) {
                resultados.push({
                    sourceSessionId: dados.sourceSessionId,
                    gameId: dados.gameId,
                    status: "ja-registrada",
                });
                continue;
            }

            try {
                await registrarJogoEAssociarAluno({
                    usuarioId: req.usuarioId,
                    aluno: preparado.aluno,
                    dados,
                    nomeJogoDetectado,
                });
                const sessao = await salvarSessaoNormalizada(dados);
                resultados.push({
                    sourceSessionId: dados.sourceSessionId,
                    sessionId: sessao.sessionId,
                    gameId: sessao.gameId,
                    status: "importada",
                });
            } catch (erroItem) {
                resultados.push({
                    sourceSessionId: dados.sourceSessionId,
                    gameId: dados.gameId,
                    status:
                        erroItem.status === 409 ? "ja-registrada" : "erro",
                    mensagem:
                        erroItem.status === 409
                            ? undefined
                            : "Não foi possível persistir esta sessão.",
                });
            }
        }

        const totalImportadas = resultados.filter(
            (item) => item.status === "importada",
        ).length;
        const totalJaRegistradas = resultados.filter(
            (item) => item.status === "ja-registrada",
        ).length;
        const totalErros = resultados.filter(
            (item) => item.status === "erro",
        ).length;
        const statusHttp =
            totalErros > 0 ? 207 : totalImportadas > 0 ? 201 : 200;

        return res.status(statusHttp).json({
            sucesso: totalErros === 0,
            mensagem:
                totalErros > 0
                    ? "O lote foi processado com itens que precisam de atenção."
                    : totalImportadas > 0
                      ? "Lote importado com sucesso."
                      : "Todas as sessões deste lote já estavam registradas.",
            batchId: preparado.lote.batchId,
            totalImportadas,
            totalJaRegistradas,
            totalErros,
            resultados,
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
            });
        }

        console.error("[LUDUS] Erro ao importar lote:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao importar lote",
        });
    }
};

// -------------------------------------------------------------------------
// listarSessoes — GET /api/sessions
// -------------------------------------------------------------------------

const listarSessoes = async (req, res) => {
    try {
        const sessoes = await Session.find()
            .select(
                "sessionId gameId platform startedAt endedAt durationMs metrics gameEvents screenshots schemaVersion captureMode source sourceVersion ingestionMethod capabilities viewport",
            )

            .sort({ createdAt: -1 })
            .limit(50);

        return res.json({
            sucesso: true,
            total: sessoes.length,
            sessoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar sessões:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar sessões",
        });
    }
};

// -------------------------------------------------------------------------
// buscarSessao — GET /api/sessions/:sessionId
// -------------------------------------------------------------------------

const buscarSessao = async (req, res) => {
    try {
        const sessao = await Session.findOne({
            sessionId: req.params.sessionId,
        });

        if (!sessao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada",
            });
        }

        const aluno = await buscarAlunoComAcesso(
            req.usuarioId,
            sessao.studentId,
        );
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada",
            });
        }

        return res.json({ sucesso: true, sessao });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar sessão:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar sessão",
        });
    }
};

// -------------------------------------------------------------------------
// removerSessaoImportada — DELETE /api/sessions/:sessionId
// Remove somente sessões criadas pelo fluxo autenticado de importação JSON.
// Sessões enviadas diretamente pelo jogo e alunos protegidos são preservados.
// -------------------------------------------------------------------------

const removerSessaoImportada = async (req, res) => {
    try {
        const sessao = await Session.findOne({
            sessionId: req.params.sessionId,
        }).select("_id studentId ingestionMethod");

        if (!sessao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada.",
            });
        }

        const aluno = await buscarAlunoComAcesso(
            req.usuarioId,
            sessao.studentId,
        );
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada.",
            });
        }

        if (aluno.deletionProtected) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "As sessões deste aluno estão protegidas contra exclusão.",
            });
        }

        if (sessao.ingestionMethod !== "file-import") {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Somente sessões adicionadas por importação de JSON podem ser removidas por esta ação.",
            });
        }

        const resultado = await removerSessoesPorFiltro({ _id: sessao._id });

        if (resultado.sessoesRemovidas !== 1) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada.",
            });
        }

        console.log(
            `[LUDUS] Sessão importada removida: ${req.params.sessionId} | Imagens: ${resultado.arquivosRemovidos}`,
        );

        return res.json({
            sucesso: true,
            mensagem: "Sessão importada removida com sucesso.",
            arquivosRemovidos: resultado.arquivosRemovidos,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao remover sessão importada:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao remover sessão importada.",
        });
    }
};

// -------------------------------------------------------------------------
// sessoesPorAluno — GET /api/sessions/student/:studentId
// -------------------------------------------------------------------------

const sessoesPorAluno = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { gameId } = req.query;

        const aluno = await buscarAlunoComAcesso(req.usuarioId, studentId);
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        const filtro = { studentId };

        if (gameId && gameId !== "todos") {
            filtro.gameId = gameId;
        }

        const sessoes = await Session.find(filtro)
            .select(
                "sessionId gameId platform startedAt endedAt durationMs metrics gameEvents screenshots schemaVersion captureMode source sourceVersion ingestionMethod capabilities viewport",
            )

            .sort({ startedAt: -1 });

        return res.json({
            sucesso: true,
            gameId: gameId || "todos",
            total: sessoes.length,
            sessoes,
        });
    } catch (erro) {
        console.error(
            "[LUDUS] Erro ao buscar sessões por jogador:",
            erro.message,
        );
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno",
        });
    }
};

module.exports = {
    prepararDadosImportacao,
    buscarSessaoDuplicadaImportada,
    registrarJogoEAssociarAluno,
    salvarSessaoNormalizada,
    criarSessao,
    previewImportacao,
    confirmarImportacao,
    previewImportacaoLote,
    confirmarImportacaoLote,
    listarSessoes,
    buscarSessao,
    removerSessaoImportada,
    sessoesPorAluno,
};
