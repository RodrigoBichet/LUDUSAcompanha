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
const {
    prepararSessaoParaExportacao,
    prepararPacoteDeExecucao,
} = require("../services/sessionExporter");

// Pasta onde as capturas visuais das sessões serão salvas.
// Fica em backend/uploads/screenshots/ — servida como static pelo Express
const PASTA_SCREENSHOTS = path.join(__dirname, "../../uploads/screenshots");
const MAX_SCREENSHOTS_POR_SESSAO = 20;
const MAX_BYTES_POR_SCREENSHOT = 2 * 1024 * 1024;
const MAX_BYTES_SCREENSHOTS_POR_SESSAO = 8 * 1024 * 1024;
const MAX_CARACTERES_BASE64 = 2800000;
const PADRAO_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const PADRAO_CAMINHO_SCREENSHOT =
    /^\/uploads\/screenshots\/[A-Za-z0-9._-]+$/;
const PADRAO_CHAVE_CHECKPOINT = /^[a-f0-9]{64}$/u;

const criarErroScreenshot = (mensagem) =>
    new ErroValidacaoTelemetria(mensagem, ["screenshots"]);

const normalizarSessionIdParaArquivo = (sessionId) =>
    String(sessionId).replace(/[^A-Za-z0-9._-]/g, "_");

const removerArquivosCriados = (arquivos) => {
    for (const arquivo of arquivos) {
        try {
            if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
        } catch (erro) {
            console.warn(
                "[LUDUS] Não foi possível limpar screenshot parcial:",
                erro.message,
            );
        }
    }
};

const decodificarJpegBase64 = (valor) => {
    if (
        typeof valor !== "string" ||
        valor.length < 4 ||
        valor.length > MAX_CARACTERES_BASE64 ||
        valor.length % 4 !== 0 ||
        !PADRAO_BASE64.test(valor)
    ) {
        throw criarErroScreenshot(
            "Uma captura visual possui conteúdo Base64 inválido.",
        );
    }

    const buffer = Buffer.from(valor, "base64");
    const entradaCanonica = valor.replace(/=+$/u, "");
    const bufferCanonico = buffer.toString("base64").replace(/=+$/u, "");

    if (entradaCanonica !== bufferCanonico) {
        throw criarErroScreenshot(
            "Uma captura visual possui conteúdo Base64 inválido.",
        );
    }

    if (buffer.length > MAX_BYTES_POR_SCREENSHOT) {
        throw criarErroScreenshot(
            "Cada captura visual deve possuir no máximo 2 MB.",
        );
    }

    const iniciaComoJpeg =
        buffer.length >= 5 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;
    const terminaComoJpeg =
        buffer.length >= 2 &&
        buffer[buffer.length - 2] === 0xff &&
        buffer[buffer.length - 1] === 0xd9;

    if (!iniciaComoJpeg || !terminaComoJpeg) {
        throw criarErroScreenshot(
            "A captura visual não possui uma assinatura JPEG reconhecida.",
        );
    }

    return buffer;
};

const validarScreenshotsRecebidos = (dados) => {
    const screenshots = dados.screenshots || [];

    if (!Array.isArray(screenshots)) {
        throw criarErroScreenshot("screenshots deve ser uma lista.");
    }

    if (screenshots.length > MAX_SCREENSHOTS_POR_SESSAO) {
        throw criarErroScreenshot(
            `Uma sessão pode conter no máximo ${MAX_SCREENSHOTS_POR_SESSAO} capturas visuais.`,
        );
    }

    let totalBytes = 0;
    const sessionIdSeguro = normalizarSessionIdParaArquivo(dados.sessionId);

    for (const screenshot of screenshots) {
        if (!screenshot || typeof screenshot !== "object") {
            throw criarErroScreenshot("Uma captura visual é inválida.");
        }

        if (
            !Number.isInteger(screenshot.timestamp) ||
            screenshot.timestamp < 0 ||
            (Number.isInteger(dados.durationMs) &&
                screenshot.timestamp > dados.durationMs)
        ) {
            throw criarErroScreenshot(
                "Uma captura visual possui timestamp inválido.",
            );
        }

        if (
            screenshot.faseIndex !== undefined &&
            (!Number.isInteger(screenshot.faseIndex) ||
                screenshot.faseIndex < 0)
        ) {
            throw criarErroScreenshot(
                "Uma captura visual possui índice de fase inválido.",
            );
        }

        if (
            screenshot.mimeType !== undefined &&
            screenshot.mimeType !== "image/jpeg"
        ) {
            throw criarErroScreenshot(
                "A primeira versão de capturas visuais aceita somente JPEG.",
            );
        }

        if (screenshot.screenshotBase64) {
            totalBytes += decodificarJpegBase64(
                screenshot.screenshotBase64,
            ).length;
            continue;
        }

        if (
            typeof screenshot.caminho !== "string" ||
            !PADRAO_CAMINHO_SCREENSHOT.test(screenshot.caminho) ||
            !path
                .basename(screenshot.caminho)
                .startsWith(`${sessionIdSeguro}_`)
        ) {
            throw criarErroScreenshot(
                "A referência de uma captura visual não pertence a esta sessão.",
            );
        }
    }

    if (totalBytes > MAX_BYTES_SCREENSHOTS_POR_SESSAO) {
        throw criarErroScreenshot(
            "As capturas visuais da sessão ultrapassam o limite total de 8 MB.",
        );
    }
};

// -------------------------------------------------------------------------
// processarScreenshots
// Função auxiliar chamada dentro do criarSessao.
// Percorre o array de screenshots recebido do SDK, salva cada imagem
// como arquivo JPEG em disco e substitui o base64 pelo caminho do arquivo.
// Retorna um novo array já sem o campo screenshotBase64.
// -------------------------------------------------------------------------

const processarScreenshots = (screenshots, sessionId) => {
    const sessionIdSeguro = normalizarSessionIdParaArquivo(sessionId);
    const arquivosCriados = [];
    const capturasProcessadas = [];

    try {
        for (const [indice, screenshot] of screenshots.entries()) {
            const capturaPersistida = {
                faseIndex: screenshot.faseIndex,
                phaseId: screenshot.phaseId,
                contextInstanceId: screenshot.contextInstanceId,
                timestamp: screenshot.timestamp,
                mimeType: screenshot.mimeType || "image/jpeg",
                widthPx: screenshot.widthPx,
                heightPx: screenshot.heightPx,
                caminho: screenshot.caminho || null,
            };

            // Referências locais já existentes são preservadas. O Unity envia
            // screenshotBase64, convertido abaixo para um arquivo persistente.
            if (!screenshot.screenshotBase64) {
                if (
                    !path
                        .basename(screenshot.caminho)
                        .startsWith(`${sessionIdSeguro}_`)
                ) {
                    throw criarErroScreenshot(
                        "A referência de uma captura visual não pertence à sessão persistida.",
                    );
                }
                capturasProcessadas.push(capturaPersistida);
                continue;
            }

            if (!fs.existsSync(PASTA_SCREENSHOTS)) {
                fs.mkdirSync(PASTA_SCREENSHOTS, { recursive: true });
            }

            const buffer = decodificarJpegBase64(
                screenshot.screenshotBase64,
            );
            const sufixo = crypto.randomBytes(6).toString("hex");
            const nomeArquivo =
                `${sessionIdSeguro}_captura${indice}_${screenshot.timestamp}_${sufixo}.jpg`;
            const caminhoCompleto = path.join(PASTA_SCREENSHOTS, nomeArquivo);

            fs.writeFileSync(caminhoCompleto, buffer, { flag: "wx" });
            arquivosCriados.push(caminhoCompleto);
            capturaPersistida.caminho =
                `/uploads/screenshots/${nomeArquivo}`;
            capturasProcessadas.push(capturaPersistida);

            console.log(`[LUDUS] Screenshot salvo: ${nomeArquivo}`);
        }

        return { capturasProcessadas, arquivosCriados };
    } catch (erro) {
        removerArquivosCriados(arquivosCriados);
        throw erro;
    }
};

const validarENormalizarSessao = (dadosBrutos) => {
    const resultadoValidacao = validarSessaoTelemetria(dadosBrutos);
    const dadosNormalizados = normalizarSessaoTelemetria(
        resultadoValidacao.dados,
        resultadoValidacao.tipo,
    );

    validarScreenshotsRecebidos(dadosNormalizados);
    return dadosNormalizados;
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

    let arquivosCriados = [];

    if (temScreenshots) {
        const resultadoScreenshots = processarScreenshots(
            dados.screenshots,
            dados.sessionId,
        );
        dados.screenshots = resultadoScreenshots.capturasProcessadas;
        arquivosCriados = resultadoScreenshots.arquivosCriados;
    }

    let sessao;

    try {
        sessao = new Session(dados);
        await sessao.save();
    } catch (erro) {
        removerArquivosCriados(arquivosCriados);
        throw erro;
    }

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

const obterChaveCheckpoint = (req) =>
    String(req.get("X-LUDUS-Checkpoint-Key") || "").trim().toLowerCase();

const criarHashCheckpoint = (chave) =>
    crypto.createHash("sha256").update(chave).digest("hex");

const chaveCheckpointConfere = (chave, hashArmazenado) => {
    if (
        !PADRAO_CHAVE_CHECKPOINT.test(chave) ||
        typeof hashArmazenado !== "string" ||
        hashArmazenado.length !== 64
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(criarHashCheckpoint(chave), "hex"),
        Buffer.from(hashArmazenado, "hex"),
    );
};

const criarErroHttp = (mensagem, status) => {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
};

const validarIdentidadeCheckpoint = (existente, dados) => {
    const mesmaIdentidade =
        String(existente.studentId) === String(dados.studentId) &&
        existente.gameId === dados.gameId &&
        existente.runId === dados.runId;

    if (!mesmaIdentidade) {
        throw criarErroHttp(
            "O checkpoint não corresponde à sessão registrada.",
            409,
        );
    }
};

const salvarOuAtualizarCheckpoint = async (dados, chave) => {
    if (!PADRAO_CHAVE_CHECKPOINT.test(chave)) {
        throw criarErroHttp("Chave de checkpoint inválida.", 403);
    }
    if (dados.status !== "in_progress") {
        throw criarErroHttp(
            "Somente sessões em andamento podem ser salvas como checkpoint.",
            400,
        );
    }
    if (dados.screenshots?.length > 0) {
        throw criarErroHttp(
            "Checkpoints não devem transportar capturas visuais.",
            400,
        );
    }

    const existente = await Session.findOne({
        sessionId: dados.sessionId,
    }).select("+checkpointKeyHash");

    if (!existente) {
        const checkpoint = new Session({
            ...dados,
            checkpointKeyHash: criarHashCheckpoint(chave),
        });
        await checkpoint.save();
        return checkpoint;
    }

    if (existente.status === "completed") {
        throw criarErroHttp("A sessão já foi concluída.", 409);
    }
    if (!chaveCheckpointConfere(chave, existente.checkpointKeyHash)) {
        throw criarErroHttp("Checkpoint não autorizado.", 403);
    }

    validarIdentidadeCheckpoint(existente, dados);
    existente.set(dados);
    await existente.save();
    return existente;
};

const concluirCheckpoint = async (existente, dados, chave) => {
    if (!chaveCheckpointConfere(chave, existente.checkpointKeyHash)) {
        throw criarErroHttp("Conclusão de checkpoint não autorizada.", 403);
    }

    validarIdentidadeCheckpoint(existente, dados);
    const resultadoScreenshots = processarScreenshots(
        dados.screenshots || [],
        dados.sessionId,
    );
    dados.screenshots = resultadoScreenshots.capturasProcessadas;

    try {
        existente.set(dados);
        existente.checkpointKeyHash = undefined;
        await existente.save();
        return existente;
    } catch (erro) {
        removerArquivosCriados(resultadoScreenshots.arquivosCriados);
        throw erro;
    }
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

        const checkpointExistente = await Session.findOne({
            sessionId: dados.sessionId,
            status: "in_progress",
        }).select("+checkpointKeyHash");
        const checkpointTemCapturasBase64 = Boolean(
            checkpointExistente &&
                dados.screenshots?.some((captura) => captura.screenshotBase64),
        );
        const sessao = checkpointExistente
            ? await concluirCheckpoint(
                  checkpointExistente,
                  dados,
                  obterChaveCheckpoint(req),
              )
            : await salvarSessaoNormalizada(dados, {
                  resetarCapturaSolicitada: true,
              });

        if (checkpointTemCapturasBase64) {
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
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
            });
        }
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao salvar sessão",
        });
    }
};

// -------------------------------------------------------------------------
// salvarCheckpoint — PUT /api/sessions/checkpoint
// Mantém uma fotografia parcial idempotente da sessão em andamento.
// -------------------------------------------------------------------------
const salvarCheckpoint = async (req, res) => {
    try {
        const dados = validarENormalizarSessao(req.body);
        const aluno = await Student.findById(dados.studentId);
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado para esta sessão",
            });
        }

        dados.playerId = aluno.name;
        const checkpoint = await salvarOuAtualizarCheckpoint(
            dados,
            obterChaveCheckpoint(req),
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: "Progresso parcial salvo.",
            sessionId: checkpoint.sessionId,
            status: checkpoint.status,
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria || erro.status) {
            return res.status(erro.status || 400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes || [],
            });
        }

        console.error("[LUDUS] Erro ao salvar checkpoint:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao salvar progresso parcial",
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

const criarNomeArquivoSeguro = (valor, fallback) => {
    const nome = String(valor || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/gu, "")
        .replace(/[^A-Za-z0-9._-]+/gu, "-")
        .replace(/^-+|-+$/gu, "")
        .slice(0, 100);
    return nome || fallback;
};

const responderComoDownloadJson = (res, nomeArquivo, dados) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nomeArquivo}.json"`,
    );
    return res.send(JSON.stringify(dados, null, 2));
};

// -------------------------------------------------------------------------
// exportarSessao — GET /api/sessions/export/:sessionId
// Gera uma cópia JSON autenticada sem modificar a sessão persistida.
// -------------------------------------------------------------------------
const exportarSessao = async (req, res) => {
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

        return responderComoDownloadJson(
            res,
            criarNomeArquivoSeguro(sessao.sessionId, "sessao-ludus"),
            prepararSessaoParaExportacao(sessao),
        );
    } catch (erro) {
        console.error("[LUDUS] Erro ao exportar sessão:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao exportar sessão",
        });
    }
};

// -------------------------------------------------------------------------
// exportarExecucao — GET /api/sessions/export-run/:runId
// Reúne as categorias e tentativas acessíveis de uma mesma execução.
// -------------------------------------------------------------------------
const exportarExecucao = async (req, res) => {
    try {
        const runId = String(req.params.runId || "").trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(runId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "runId inválido",
            });
        }

        const sessoes = await Session.find({ runId }).sort({
            attemptNumber: 1,
            startedAt: 1,
        });
        if (sessoes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Execução não encontrada",
            });
        }

        for (const sessao of sessoes) {
            const aluno = await buscarAlunoComAcesso(
                req.usuarioId,
                sessao.studentId,
            );
            if (!aluno) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Execução não encontrada",
                });
            }
        }

        return responderComoDownloadJson(
            res,
            criarNomeArquivoSeguro(runId, "execucao-ludus"),
            prepararPacoteDeExecucao(runId, sessoes),
        );
    } catch (erro) {
        console.error("[LUDUS] Erro ao exportar execução:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao exportar execução",
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
                "sessionId runId attemptNumber status gameId platform startedAt endedAt durationMs metrics gameEvents screenshots schemaVersion captureMode source sourceVersion ingestionMethod capabilities viewport",
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
    salvarCheckpoint,
    previewImportacao,
    confirmarImportacao,
    previewImportacaoLote,
    confirmarImportacaoLote,
    listarSessoes,
    buscarSessao,
    exportarSessao,
    exportarExecucao,
    removerSessaoImportada,
    sessoesPorAluno,
};
