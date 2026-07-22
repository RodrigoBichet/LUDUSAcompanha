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
    adaptarRelatorioMonitorLegado,
} = require("../services/legacyMonitorAdapter");
const { buscarAlunoComAcesso } = require("../services/schoolAccess");

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

const usuarioPodeImportarParaAluno = async (usuarioId, aluno) => {
    const alunoComAcesso = await buscarAlunoComAcesso(usuarioId, aluno._id);
    return Boolean(alunoComAcesso);
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

const prepararImportacao = async (req) => {
    const dadosBrutos = req.body?.sessao;

    if (!dadosBrutos || typeof dadosBrutos !== "object") {
        throw new ErroValidacaoTelemetria(
            "Envie o JSON da sessão no campo sessao.",
        );
    }

    if (
        dadosBrutos.studentId &&
        String(dadosBrutos.studentId) !== String(req.params.studentId)
    ) {
        throw new ErroValidacaoTelemetria(
            "O studentId do JSON não corresponde ao aluno selecionado.",
        );
    }

    if (!mongoose.isValidObjectId(req.params.studentId)) {
        throw new ErroValidacaoTelemetria("studentId inválido na rota de importação.");
    }

    const aluno = await Student.findById(req.params.studentId);

    if (!aluno) {
        const erro = new Error("Aluno não encontrado");
        erro.status = 404;
        throw erro;
    }

    const autorizado = await usuarioPodeImportarParaAluno(
        req.usuarioId,
        aluno,
    );

    if (!autorizado) {
        const erro = new Error("Sem permissão para importar sessões deste aluno");
        erro.status = 403;
        throw erro;
    }

    const dadosAdaptados = adaptarRelatorioMonitorLegado(dadosBrutos);
    const gameIdSelecionado = String(req.body?.gameId || "").trim();
    const nomeJogoDetectado = String(
        dadosBrutos.app || dadosAdaptados.gameId,
    ).trim();

    if (gameIdSelecionado && !/^[a-z0-9][a-z0-9-]{0,99}$/.test(gameIdSelecionado)) {
        throw new ErroValidacaoTelemetria("gameId inválido no contexto da importação.");
    }

    if (gameIdSelecionado && gameIdSelecionado !== dadosAdaptados.gameId) {
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
    criarSessao,
    previewImportacao,
    confirmarImportacao,
    listarSessoes,
    buscarSessao,
    sessoesPorAluno,
};
