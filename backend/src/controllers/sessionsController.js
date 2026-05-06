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
const Session = require("../models/Session");
const Student = require("../models/Student");

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

    return screenshots.map((screenshot) => {
        // Se por algum motivo o base64 vier vazio, ignora sem quebrar
        if (!screenshot.screenshotBase64) {
            return {
                faseIndex: screenshot.faseIndex,
                timestamp: screenshot.timestamp,
                caminho: null,
            };
        }

        // Nome do arquivo: sessionId_faseN.jpg — garante unicidade
        const nomeArquivo = `${sessionId}_fase${screenshot.faseIndex}.jpg`;
        const caminhoCompleto = path.join(PASTA_SCREENSHOTS, nomeArquivo);

        // Decodifica o base64 e salva como arquivo binário
        const buffer = Buffer.from(screenshot.screenshotBase64, "base64");
        fs.writeFileSync(caminhoCompleto, buffer);

        console.log(`[LUDUS] Screenshot salvo: ${nomeArquivo}`);

        // Retorna o objeto sem o base64 — só com o caminho público
        return {
            faseIndex: screenshot.faseIndex,
            timestamp: screenshot.timestamp,
            caminho: `/uploads/screenshots/${nomeArquivo}`,
        };
    });
};

// -------------------------------------------------------------------------
// criarSessao — POST /api/sessions
// Recebe o JSON da sessão gerado pelo LudusExporter e salva no banco.
// -------------------------------------------------------------------------

const criarSessao = async (req, res) => {
    try {
        const dados = req.body;

        // Validação básica — campos obrigatórios
        if (!dados.sessionId || !dados.playerId || !dados.gameId) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Campos obrigatórios ausentes: sessionId, playerId, gameId",
            });
        }

        // Verifica duplicata
        const sessaoExistente = await Session.findOne({
            sessionId: dados.sessionId,
        });
        if (sessaoExistente) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Sessão já registrada com este sessionId",
            });
        }

        // Processa screenshots se a sessão trouxer algum
        // O base64 é extraído, salvo em disco e substituído pelo caminho
        const temScreenshots =
            Array.isArray(dados.screenshots) && dados.screenshots.length > 0;

        if (temScreenshots) {
            dados.screenshots = processarScreenshots(
                dados.screenshots,
                dados.sessionId,
            );
        }

        // Salva a sessão no MongoDB (sem base64 — só caminhos)
        const sessao = new Session(dados);
        await sessao.save();

        console.log(
            `[LUDUS] Sessão recebida: ${sessao.sessionId} | Player: ${sessao.playerId}`,
        );

        // Se a sessão veio com screenshots, reseta o flag capturaSolicitada do aluno.
        // O flag é buscado pelo nome do jogador (playerId = nome do aluno no sistema).
        // Usamos findOneAndUpdate para não travar o fluxo caso o aluno não seja encontrado.
        if (temScreenshots) {
            try {
                await Student.findOneAndUpdate(
                    { name: dados.playerId, capturaSolicitada: true },
                    {
                        capturaSolicitada: false,
                        capturaSolicitadaOrigem: null,
                    },
                );

                console.log(
                    `[LUDUS] Flag capturaSolicitada resetado para: ${dados.playerId}`,
                );
            } catch (erroReset) {
                // Não interrompe o fluxo — o reset é secundário
                console.warn(
                    "[LUDUS] Não foi possível resetar capturaSolicitada:",
                    erroReset.message,
                );
            }
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: "Sessão registrada com sucesso!",
            sessionId: sessao.sessionId,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao salvar sessão:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao salvar sessão",
            erro: erro.message,
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
                "sessionId gameId platform startedAt endedAt durationMs metrics gameEvents screenshots",
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
// sessoesPorJogador — GET /api/sessions/player/:playerId
// -------------------------------------------------------------------------

const sessoesPorJogador = async (req, res) => {
    try {
        const sessoes = await Session.find({ playerId: req.params.playerId })
            .select(
                "sessionId gameId platform startedAt endedAt durationMs metrics gameEvents screenshots",
            )

            .sort({ startedAt: -1 });

        return res.json({
            sucesso: true,
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
    listarSessoes,
    buscarSessao,
    sessoesPorJogador,
};
