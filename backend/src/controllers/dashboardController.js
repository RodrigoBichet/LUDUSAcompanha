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

const montarFiltroSessao = (studentId, gameId) => {
    const filtro = { studentId };

    if (gameId && gameId !== "todos") {
        filtro.gameId = gameId;
    }

    return filtro;
};

const possuiCapacidade = (sessao, capacidade) =>
    sessao.capabilities?.[capacidade] !== false;

// -------------------------------------------------------------------------
// resumoJogador — GET /api/dashboard/summary/:studentId
// -------------------------------------------------------------------------

const resumoJogador = async (req, res) => {
    try {
        const { studentId } = req.params;

        const { gameId } = req.query;

        const sessoes = await Session.find(
            montarFiltroSessao(studentId, gameId),
        ).sort({ startedAt: 1 });

        if (sessoes.length === 0) {
            return res.json({
                sucesso: true,
                studentId,
                gameId: gameId || "todos",
                totalSessoes: 0,
                totalClicks: 0,
                totalSessoesComDesempenho: 0,
                temDadosDesempenho: false,
                totalCorrect: null,
                totalWrong: null,
                taxaAcerto: null,
                totalDuracaoMs: 0,
                totalInatividade: 0,
                totalSessoesComInatividade: 0,
                categorias: {},
                evolucaoTemporal: [],
                mensagem: "Nenhuma sessão encontrada para este filtro.",
            });
        }

        let totalClicks = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalDuracaoMs = 0;
        let totalInatividade = 0;
        let totalSessoesComDesempenho = 0;
        let totalSessoesComInatividade = 0;
        let categorias = {};
        let evolucaoTemporal = [];

        sessoes.forEach((sessao) => {
            const temDadosDesempenho = possuiCapacidade(
                sessao,
                "correctWrong",
            );

            if (possuiCapacidade(sessao, "clicks")) {
                totalClicks += sessao.metrics.totalClicks || 0;
            }

            if (temDadosDesempenho) {
                totalCorrect += sessao.metrics.totalCorrect || 0;
                totalWrong += sessao.metrics.totalWrong || 0;
                totalSessoesComDesempenho++;
            }

            totalDuracaoMs += sessao.durationMs || 0;

            if (possuiCapacidade(sessao, "inactivity")) {
                totalInatividade += sessao.metrics.inactivityCount || 0;
                totalSessoesComInatividade++;
            }

            (sessao.gameEvents || []).forEach((evento) => {
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
                temDadosDesempenho,
                totalCorrect: temDadosDesempenho
                    ? sessao.metrics.totalCorrect || 0
                    : null,
                totalWrong: temDadosDesempenho
                    ? sessao.metrics.totalWrong || 0
                    : null,
                durationMs: sessao.durationMs || 0,
                inatividade: possuiCapacidade(sessao, "inactivity")
                    ? sessao.metrics.inactivityCount || 0
                    : null,
            });
        });

        const taxaAcerto =
            totalCorrect + totalWrong > 0
                ? ((totalCorrect / (totalCorrect + totalWrong)) * 100).toFixed(
                      1,
                  )
                : null;

        return res.json({
            sucesso: true,
            studentId,
            gameId: gameId || "todos",
            totalSessoes: sessoes.length,
            totalClicks,
            totalSessoesComDesempenho,
            temDadosDesempenho: totalSessoesComDesempenho > 0,
            totalCorrect:
                totalSessoesComDesempenho > 0 ? totalCorrect : null,
            totalWrong: totalSessoesComDesempenho > 0 ? totalWrong : null,
            taxaAcerto: taxaAcerto === null ? null : `${taxaAcerto}%`,
            totalDuracaoMs,
            totalInatividade,
            totalSessoesComInatividade,
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
        }).select(
            "sessionId studentId playerId mousePath dragPath clicks screenshots gameEvents schemaVersion captureMode source capabilities viewport",
        );

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
            studentId: sessao.studentId,
            playerId: sessao.playerId,
            schemaVersion: sessao.schemaVersion,
            captureMode: sessao.captureMode,
            source: sessao.source,
            capabilities: sessao.capabilities,
            viewport: sessao.viewport,
            mousePath: sessao.mousePath,
            dragPath: sessao.dragPath || [],
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
// alertasAluno — GET /api/dashboard/alerts/:studentId
// -------------------------------------------------------------------------

const alertasAluno = async (req, res) => {
    try {
        const { studentId } = req.params;

        const { gameId } = req.query;

        const sessoes = await Session.find(
            montarFiltroSessao(studentId, gameId),
        )
            .sort({ startedAt: -1 })
            .limit(10);

        if (sessoes.length === 0) {
            return res.json({
                sucesso: true,
                studentId,
                gameId: gameId || "todos",
                alertas: [],
                mensagem: "Nenhuma sessão encontrada para análise.",
            });
        }

        const alertas = [];
        const sessoesComDesempenho = sessoes.filter((sessao) =>
            possuiCapacidade(sessao, "correctWrong"),
        );
        const sessoesComInatividade = sessoes.filter((sessao) =>
            possuiCapacidade(sessao, "inactivity"),
        );

        // Indicador 1 — Taxa de acerto baixa nas últimas 3 sessões
        const ultimas3 = sessoesComDesempenho.slice(0, 3);
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
                        titulo: "Taxa de acerto sugere atenção",
                        descricao: `Taxa de acerto de ${taxa.toFixed(1)}% nas últimas ${ultimas3.length} sessões.`,
                        sugestao:
                            "Considere retomar os itens trabalhados e observar se o aluno precisa de mediação adicional.",
                    });
                } else if (taxa < 70) {
                    alertas.push({
                        tipo: "taxa_regular",
                        severidade: "media",
                        icone: "🟡",
                        titulo: "Taxa de acerto em desenvolvimento",
                        descricao: `Taxa de acerto de ${taxa.toFixed(1)}% nas últimas ${ultimas3.length} sessões.`,
                        sugestao:
                            "O aluno pode se beneficiar de novas práticas e acompanhamento nas próximas atividades.",
                    });
                }
            }
        }

        // Alerta 2 — Inatividade frequente
        const totalInatividade = sessoesComInatividade.reduce(
            (s, sess) => s + (sess.metrics.inactivityCount || 0),
            0,
        );
        const mediaInatividade =
            sessoesComInatividade.length > 0
                ? totalInatividade / sessoesComInatividade.length
                : 0;

        if (sessoesComInatividade.length > 0 && mediaInatividade >= 3) {
            alertas.push({
                tipo: "inatividade_alta",
                severidade: "alta",
                icone: "🔴",
                titulo: "Pausas frequentes durante o jogo",
                descricao: `Média de ${mediaInatividade.toFixed(1)} períodos de inatividade por sessão.`,
                sugestao:
                    "Observe o contexto da atividade para compreender se as pausas indicam espera por ajuda, reflexão, cansaço ou necessidade de ajuste na mediação.",
            });
        } else if (
            sessoesComInatividade.length > 0 &&
            mediaInatividade >= 1.5
        ) {
            alertas.push({
                tipo: "inatividade_media",
                severidade: "media",
                icone: "🟡",
                titulo: "Pausas durante o jogo",
                descricao: `Média de ${mediaInatividade.toFixed(1)} períodos de inatividade por sessão.`,
                sugestao:
                    "Observe se o aluno se beneficia de pausas planejadas, incentivo ou orientação durante a atividade.",
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
                titulo: "Intervalo longo sem sessões registradas",
                descricao: `Última sessão há ${diasSemJogar} dias.`,
                sugestao:
                    "Considere retomar as sessões para manter continuidade no acompanhamento pedagógico.",
            });
        } else if (diasSemJogar >= 7) {
            alertas.push({
                tipo: "sem_jogar",
                severidade: "informativo",
                icone: "🔵",
                titulo: "Intervalo sem sessões recentes",
                descricao: `Última sessão há ${diasSemJogar} dias.`,
                sugestao: "Considere agendar uma nova sessão em breve.",
            });
        }

        // Alerta 4 — Categoria problemática
        const errosPorCategoria = {};

        sessoesComDesempenho.forEach((sessao) => {
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
                        titulo: `Maior ocorrência de erros em ${categoria}`,
                        descricao: `${taxaErro.toFixed(0)}% de erros na categoria ${categoria}.`,
                        sugestao: `Observe os itens da categoria ${categoria} nas próximas mediações e considere retomar exemplos semelhantes.`,
                    });
                }
            }
        });

        // Alerta 5 — Evolução positiva
        if (sessoesComDesempenho.length >= 3) {
            const primeiras = sessoesComDesempenho.slice(-3);
            const recentes = sessoesComDesempenho.slice(0, 3);

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
                    titulo: "Aumento de acertos nas sessões recentes",
                    descricao:
                        "As sessões recentes apresentaram mais acertos do que as sessões anteriores.",
                    sugestao:
                        "Registre o contexto dessa evolução e considere manter estratégias de mediação semelhantes.",
                });
            }
        }

        return res.json({
            sucesso: true,
            studentId,
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
