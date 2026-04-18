// =============================================================================
// playersController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
// Orientador: Prof. Dr. Leomar Soares da Rosa Júnior
//
// Controller dos jogadores.
// Gerencia cadastro e consulta de jogadores e seus históricos de sessão.
// =============================================================================

const Player = require("../models/Player");
const Session = require("../models/Session");

// -------------------------------------------------------------------------
// criarJogador — POST /api/players
// -------------------------------------------------------------------------

const criarJogador = async (req, res) => {
    try {
        const { name, institutionId, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório ausente: name",
            });
        }

        const jogador = new Player({ name, institutionId, notes });
        await jogador.save();

        console.log(`[LUDUS] Jogador criado: ${jogador.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Jogador criado com sucesso!",
            jogador,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar jogador:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar jogador",
        });
    }
};

// -------------------------------------------------------------------------
// listarJogadores — GET /api/players
// -------------------------------------------------------------------------

const listarJogadores = async (req, res) => {
    try {
        // Busca jogadores cadastrados no model Player
        const jogadores = await Player.find().sort({ createdAt: -1 });

        // Busca também os nomes únicos que já jogaram (via sessões)
        // Assim aparece mesmo quem não foi cadastrado formalmente
        const nomesNasSessoes = await Session.distinct("playerId");

        return res.json({
            sucesso: true,
            jogadoresCadastrados: jogadores,
            jogadoresNasSessoes: nomesNasSessoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar jogadores:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar jogadores",
        });
    }
};

// -------------------------------------------------------------------------
// buscarJogador — GET /api/players/:id
// -------------------------------------------------------------------------

const buscarJogador = async (req, res) => {
    try {
        const jogador = await Player.findById(req.params.id);

        if (!jogador) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Jogador não encontrado",
            });
        }

        return res.json({ sucesso: true, jogador });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar jogador:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar jogador",
        });
    }
};

// -------------------------------------------------------------------------
// historicoJogador — GET /api/players/:playerId/sessions
// Busca todas as sessões de um jogador pelo nome (playerId = nome digitado)
// -------------------------------------------------------------------------

const historicoJogador = async (req, res) => {
    try {
        const { playerId } = req.params;

        const sessoes = await Session.find({ playerId })
            .select(
                "sessionId gameId platform startedAt endedAt durationMs metrics gameEvents",
            )
            .sort({ startedAt: -1 });

        if (sessoes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: `Nenhuma sessão encontrada para o jogador: ${playerId}`,
            });
        }

        return res.json({
            sucesso: true,
            playerId,
            total: sessoes.length,
            sessoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar histórico:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar histórico",
        });
    }
};

module.exports = {
    criarJogador,
    listarJogadores,
    buscarJogador,
    historicoJogador,
};
