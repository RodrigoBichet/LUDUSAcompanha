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

const montarFiltroSessao = (playerId, gameId) => {
    const filtro = { playerId };

    if (gameId && gameId !== "todos") {
        filtro.gameId = gameId;
    }

    return filtro;
};

// -------------------------------------------------------------------------
// resumoJogador — GET /api/dashboard/summary/:playerId
// -------------------------------------------------------------------------

const resumoJogador = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { gameId } = req.query;

        const sessoes = await Session.find(
            montarFiltroSessao(playerId, gameId),
        ).sort({ startedAt: 1 });

        if (sessoes.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: `Nenhuma sessão encontrada para: ${playerId}`,
            });
        }

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

            sessao.gameEvents.forEach((evento) => {
                if (evento.eventType === "CategorySelected") {
                    try {
                        const payload = JSON.parse(evento.payload);
                        const cat = payload.category || "desconhecida";
                        categorias[cat] = (categorias[cat] || 0) + 1;
                    } catch (_) {}
                }
            });

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
            gameId: gameId || "todos",
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
//
// Retorna os dados necessários para renderizar o heatmap no dashboard:
// - mousePath e clicks para desenhar os pontos no canvas
// - screenshots por fase (caminhos dos arquivos salvos em disco)
// - gameEvents filtrados aos PhaseStarted, para o frontend saber os
//   limites de tempo de cada fase e filtrar os pontos corretamente
// -------------------------------------------------------------------------

const heatmapSessao = async (req, res) => {
    try {
        const sessao = await Session.findOne({
            sessionId: req.params.sessionId,
        }).select("sessionId playerId mousePath clicks screenshots gameEvents");

        if (!sessao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sessão não encontrada",
            });
        }

        // Filtra apenas os eventos de início de fase para o frontend
        // calcular os intervalos de tempo de cada fase sem receber
        // o payload completo de todos os eventos
        const fases = (sessao.gameEvents || [])
            .filter((e) => e.eventType === "PhaseStarted")
            .map((e, index) => ({
                faseIndex: index,
                timestamp: e.timestamp,
            }));

        return res.json({
            sucesso: true,
            sessionId: sessao.sessionId,
            playerId: sessao.playerId,
            mousePath: sessao.mousePath,
            clicks: sessao.clicks,
            // Screenshots capturados pelo SDK (null se captura não estava ativa)
            screenshots: sessao.screenshots || [],
            // Timestamps de início de cada fase para filtragem no frontend
            fases,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar heatmap:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar heatmap",
        });
    }
};

// -------------------------------------------------------------------------
// alertasAluno — GET /api/dashboard/alerts/:playerId
// -------------------------------------------------------------------------

const alertasAluno = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { gameId } = req.query;

        const sessoes = await Session.find(montarFiltroSessao(playerId, gameId))
            .sort({ startedAt: -1 })
            .limit(10);

        if (sessoes.length === 0) {
            return res.json({
                sucesso: true,
                playerId,
                gameId: gameId || "todos",
                alertas: [],
                mensagem: "Nenhuma sessão encontrada para análise.",
            });
        }

        const alertas = [];

        // Alerta 1 — Taxa de acerto baixa nas últimas 3 sessões
        const ultimas3 = sessoes.slice(0, 3);
        if (ultimas3.length >= 2) {
            const totalAcertos = ultimas3.reduce(
                (s, sess) => s + (sess.metrics.totalCorrect || 0),
                0,
            );
            const totalTentativas = ultimas3.reduce(
                (s, sess) =>
                    s +
                    (sess.metrics.totalCorrect || 0) +
                    (sess.metrics.totalWrong || 0),
                0,
            );

            if (totalTentativas > 0) {
                const taxa = (totalAcertos / totalTentativas) * 100;
                if (taxa < 50) {
                    alertas.push({
                        tipo: "taxa_baixa",
                        severidade: "alta",
                        icone: "🔴",
                        titulo: "Taxa de acerto baixa",
                        descricao: `Taxa de acerto de ${taxa.toFixed(1)}% nas últimas ${ultimas3.length} sessões.`,
                        sugestao:
                            "Considere revisar as atividades com o aluno e verificar se há dificuldades específicas.",
                    });
                } else if (taxa < 70) {
                    alertas.push({
                        tipo: "taxa_regular",
                        severidade: "media",
                        icone: "🟡",
                        titulo: "Taxa de acerto regular",
                        descricao: `Taxa de acerto de ${taxa.toFixed(1)}% nas últimas ${ultimas3.length} sessões.`,
                        sugestao:
                            "O aluno está progredindo, mas pode se beneficiar de mais prática.",
                    });
                }
            }
        }

        // Alerta 2 — Inatividade frequente
        const totalInatividade = sessoes.reduce(
            (s, sess) => s + (sess.metrics.inactivityCount || 0),
            0,
        );
        const mediaInatividade = totalInatividade / sessoes.length;

        if (mediaInatividade >= 3) {
            alertas.push({
                tipo: "inatividade_alta",
                severidade: "alta",
                icone: "🔴",
                titulo: "Inatividade frequente",
                descricao: `Média de ${mediaInatividade.toFixed(1)} períodos de inatividade por sessão.`,
                sugestao:
                    "Verifique se o aluno está com dificuldades de concentração ou se o ambiente está adequado.",
            });
        } else if (mediaInatividade >= 1.5) {
            alertas.push({
                tipo: "inatividade_media",
                severidade: "media",
                icone: "🟡",
                titulo: "Períodos de inatividade detectados",
                descricao: `Média de ${mediaInatividade.toFixed(1)} períodos de inatividade por sessão.`,
                sugestao:
                    "Observe se o aluno precisa de pausas ou incentivos durante o jogo.",
            });
        }

        // Alerta 3 — Sem jogar há muito tempo
        const ultimaSessao = sessoes[0];
        const diasSemJogar = Math.floor(
            (Date.now() - new Date(ultimaSessao.startedAt).getTime()) /
                (1000 * 60 * 60 * 24),
        );

        if (diasSemJogar >= 14) {
            alertas.push({
                tipo: "sem_jogar_longo",
                severidade: "alta",
                icone: "🔴",
                titulo: "Sem jogar há muito tempo",
                descricao: `Última sessão há ${diasSemJogar} dias.`,
                sugestao:
                    "Retome as sessões com o aluno o quanto antes para manter a continuidade do aprendizado.",
            });
        } else if (diasSemJogar >= 7) {
            alertas.push({
                tipo: "sem_jogar",
                severidade: "informativo",
                icone: "🔵",
                titulo: "Sem jogar há uma semana",
                descricao: `Última sessão há ${diasSemJogar} dias.`,
                sugestao: "Considere agendar uma nova sessão em breve.",
            });
        }

        // Alerta 4 — Categoria problemática
        const errosPorCategoria = {};

        sessoes.forEach((sessao) => {
            let categoriaAtual = null;
            sessao.gameEvents.forEach((evento) => {
                if (evento.eventType === "CategorySelected") {
                    try {
                        const payload = JSON.parse(evento.payload);
                        categoriaAtual = payload.category;
                        if (!errosPorCategoria[categoriaAtual]) {
                            errosPorCategoria[categoriaAtual] = {
                                acertos: 0,
                                erros: 0,
                            };
                        }
                    } catch (_) {}
                }
                if (evento.eventType === "WrongMatch" && categoriaAtual)
                    errosPorCategoria[categoriaAtual].erros++;
                if (evento.eventType === "CorrectMatch" && categoriaAtual)
                    errosPorCategoria[categoriaAtual].acertos++;
            });
        });

        Object.entries(errosPorCategoria).forEach(([categoria, dados]) => {
            const total = dados.acertos + dados.erros;
            if (total >= 3) {
                const taxaErro = (dados.erros / total) * 100;
                if (taxaErro >= 50) {
                    alertas.push({
                        tipo: "categoria_problematica",
                        severidade: "media",
                        icone: "🟡",
                        titulo: `Dificuldade na categoria ${categoria}`,
                        descricao: `${taxaErro.toFixed(0)}% de erros na categoria ${categoria}.`,
                        sugestao: `Dedique atenção especial aos itens da categoria ${categoria} nas próximas sessões.`,
                    });
                }
            }
        });

        // Alerta 5 — Evolução positiva
        if (sessoes.length >= 3) {
            const primeiras = sessoes.slice(-3);
            const recentes = sessoes.slice(0, 3);

            const mediaAntiga =
                primeiras.reduce(
                    (s, sess) => s + (sess.metrics.totalCorrect || 0),
                    0,
                ) / primeiras.length;
            const mediaRecente =
                recentes.reduce(
                    (s, sess) => s + (sess.metrics.totalCorrect || 0),
                    0,
                ) / recentes.length;

            if (mediaRecente > mediaAntiga * 1.2) {
                alertas.push({
                    tipo: "evolucao_positiva",
                    severidade: "positivo",
                    icone: "🟢",
                    titulo: "Evolução positiva detectada!",
                    descricao:
                        "O aluno melhorou significativamente nas últimas sessões.",
                    sugestao:
                        "Continue com as atividades atuais — o aluno está respondendo bem!",
                });
            }
        }

        return res.json({
            sucesso: true,
            playerId,
            gameId: gameId || "todos",
            totalAlertas: alertas.length,
            alertas,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao gerar alertas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao gerar alertas",
        });
    }
};

module.exports = { resumoJogador, heatmapSessao, alertasAluno };
