// =============================================================================
// sessionsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das sessões de jogo.
// Recebe o JSON do SDK Unity, valida e salva no MongoDB.
// =============================================================================

const Session = require("../models/Session");

// -------------------------------------------------------------------------
// criarSessao — POST /api/sessions
// Recebe o JSON da sessão gerado pelo LudusExporter e salva no banco
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

        // Verifica se já existe uma sessão com esse ID (evita duplicatas)
        const sessaoExistente = await Session.findOne({
            sessionId: dados.sessionId,
        });
        if (sessaoExistente) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Sessão já registrada com este sessionId",
            });
        }

        // Cria e salva a sessão no MongoDB
        const sessao = new Session(dados);
        await sessao.save();

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
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao salvar sessão",
            erro: erro.message,
        });
    }
};

// -------------------------------------------------------------------------
// listarSessoes — GET /api/sessions
// Lista todas as sessões (útil para debug)
// -------------------------------------------------------------------------

const listarSessoes = async (req, res) => {
    try {
        const sessoes = await Session.find()
            .select("sessionId playerId gameId platform startedAt durationMs") // só campos essenciais
            .sort({ createdAt: -1 }) // mais recentes primeiro
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
// Retorna uma sessão completa pelo ID
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

module.exports = { criarSessao, listarSessoes, buscarSessao };
