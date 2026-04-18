// =============================================================================
// dashboardController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
// Orientador: Prof. Dr. Leomar Soares da Rosa Júnior
//
// Controller do dashboard pedagógico.
// Processa e consolida dados das sessões para exibição no dashboard.
// =============================================================================

const Session = require("../models/Session");

// -------------------------------------------------------------------------
// resumoJogador — GET /api/dashboard/summary/:playerId
// Retorna métricas consolidadas de todas as sessões de um jogador
// -------------------------------------------------------------------------

const resumoJogador = async (req, res) => {
    try {
        const { playerId } = req.params;

        const sessoes = await Session.find({ playerId }).sort({ startedAt: 1 });

        if (sessoes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: `Nenhuma sessão encontrada para: ${playerId}`,
            });
        }

        // --- Consolida métricas de todas as sessões ---

        let totalClicks = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalDuracaoMs = 0;
        let totalInatividade = 0;
        let categorias = {};
        let evolucaoTemporal = [];

        sessoes.forEach((sessao) => {
            totalClicks += sessao.metrics.totalClicks || 0;
            totalCorrect += sessao.metrics.totalCorrect || 0;
            totalWrong += sessao.metrics.totalWrong || 0;
            totalDuracaoMs += sessao.durationMs || 0;
            totalInatividade += sessao.metrics.inactivityCount || 0;

            // Contagem de sessões por categoria
            sessao.gameEvents.forEach((evento) => {
                if (evento.eventType === "CategorySelected") {
                    try {
                        const payload = JSON.parse(evento.payload);
                        const cat = payload.category || "desconhecida";
                        categorias[cat] = (categorias[cat] || 0) + 1;
                    } catch (_) {}
                }
            });

            // Evolução temporal — uma entrada por sessão
            evolucaoTemporal.push({
                sessionId: sessao.sessionId,
                startedAt: sessao.startedAt,
                totalCorrect: sessao.metrics.totalCorrect || 0,
                totalWrong: sessao.metrics.totalWrong || 0,
                durationMs: sessao.durationMs || 0,
                inatividade: sessao.metrics.inactivityCount || 0,
            });
        });

        const taxaAcerto =
            totalCorrect + totalWrong > 0
                ? ((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(
                      1,
                  )
                : 0;

        return res.json({
            sucesso: true,
            playerId,
            totalSessoes: sessoes.length,
            totalClicks,
            totalCorrect,
            totalWrong,
            taxaAcerto: `${taxaAcerto}%`,
            totalDuracaoMs,
            totalInatividade,
            categorias,
            evolucaoTemporal,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao gerar resumo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao gerar resumo",
        });
    }
};

// -------------------------------------------------------------------------
// heatmapSessao — GET /api/dashboard/heatmap/:sessionId
// Retorna os pontos do caminho do mouse para geração do heatmap
// -------------------------------------------------------------------------

const heatmapSessao = async (req, res) => {
    try {
        const sessao = await Session.findOne({
            sessionId: req.params.sessionId,
        }).select("sessionId playerId mousePath clicks");

        if (!sessao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada",
            });
        }

        return res.json({
            sucesso: true,
            sessionId: sessao.sessionId,
            playerId: sessao.playerId,
            mousePath: sessao.mousePath,
            clicks: sessao.clicks,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar heatmap:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar heatmap",
        });
    }
};

module.exports = { resumoJogador, heatmapSessao };
