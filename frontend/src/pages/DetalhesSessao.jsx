// =============================================================================
// DetalhesSessao.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de detalhes de uma sessão específica.
// Mostra eventos, métricas e heatmap de interações.
// =============================================================================

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { buscarSessao, heatmapSessao } from "../services/api";
import "./DetalhesSessao.css";

export default function DetalhesSessao() {
    const { sessionId } = useParams();
    const navegar = useNavigate();
    const canvasRef = useRef(null);

    const [sessao, setSessao] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    const [faseSelecionada, setFaseSelecionada] = useState(0);

    useEffect(() => {
        Promise.all([buscarSessao(sessionId), heatmapSessao(sessionId)])
            .then(([resSessao, resHeatmap]) => {
                setSessao(resSessao.data.sessao);
                setHeatmap(resHeatmap.data);
                setCarregando(false);
            })
            .catch(() => {
                setErro("Não foi possível carregar os detalhes da sessão.");
                setCarregando(false);
            });
    }, [sessionId]);

    const BACKEND_ORIGIN = "http://localhost:3000";

    const montarUrlImagem = (caminho) => {
        if (!caminho) return null;
        if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
            return caminho;
        }
        return `${BACKEND_ORIGIN}${caminho}`;
    };

    const obterFasesHeatmap = () => {
        if (!heatmap) return [];

        const fases = heatmap.fases || [];
        const screenshots = heatmap.screenshots || [];
        const total = Math.max(fases.length, screenshots.length, 4);

        return Array.from({ length: total }, (_, index) => ({
            faseIndex: index,
            timestamp:
                fases[index]?.timestamp ?? screenshots[index]?.timestamp ?? 0,
            screenshot:
                screenshots.find((s) => s.faseIndex === index) ||
                screenshots[index] ||
                null,
        }));
    };

    const carregarImagem = (url) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });

    useEffect(() => {
        setFaseSelecionada(0);
    }, [sessionId]);

    // Desenha o heatmap no canvas após carregar os dados
    useEffect(() => {
        if (!heatmap || !canvasRef.current) return;

        let cancelado = false;

        const desenharHeatmap = async () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            const fases = obterFasesHeatmap();
            const visualizacaoGeral = faseSelecionada === -1;
            const faseAtual = visualizacaoGeral
                ? null
                : fases[faseSelecionada] || fases[0];
            const proximaFase = visualizacaoGeral
                ? null
                : fases[faseSelecionada + 1];

            const inicioFase = visualizacaoGeral
                ? 0
                : (faseAtual?.timestamp ?? 0);
            const fimFase = visualizacaoGeral
                ? (sessao?.durationMs ?? Infinity)
                : (proximaFase?.timestamp ?? sessao?.durationMs ?? Infinity);

            // A visão geral usa fundo neutro para mostrar todas as fases sem misturar prints
            const screenshotUrl = visualizacaoGeral
                ? null
                : montarUrlImagem(faseAtual?.screenshot?.caminho);

            let imagemFundo = null;
            if (screenshotUrl) {
                try {
                    imagemFundo = await carregarImagem(screenshotUrl);
                } catch {
                    imagemFundo = null;
                }
            }

            if (cancelado) return;

            const pontosTodos = heatmap.mousePath || [];
            const cliquesTodos = heatmap.clicks || [];

            const dentroDaFase = (item) => {
                const tempo = item.t ?? item.timestamp ?? 0;
                return tempo >= inicioFase && tempo < fimFase;
            };

            const pontos = pontosTodos.filter(dentroDaFase);
            const cliques = cliquesTodos.filter(dentroDaFase);

            let imagemReferencia = imagemFundo;

            if (!imagemReferencia && fases[0]?.screenshot?.caminho) {
                try {
                    imagemReferencia = await carregarImagem(
                        montarUrlImagem(fases[0].screenshot.caminho),
                    );
                } catch {
                    imagemReferencia = null;
                }
            }

            const W = imagemReferencia?.naturalWidth || 900;
            const H = imagemReferencia?.naturalHeight || 520;

            canvas.width = W;
            canvas.height = H;
            ctx.clearRect(0, 0, W, H);

            if (imagemFundo) {
                ctx.drawImage(imagemFundo, 0, 0, W, H);

                // Escurece levemente o print para destacar cliques e trajetos
                ctx.fillStyle = "rgba(28, 43, 58, 0.18)";
                ctx.fillRect(0, 0, W, H);
            } else {
                ctx.fillStyle = "#1C2B3A";
                ctx.fillRect(0, 0, W, H);
            }

            const todosPontos = [...pontos, ...cliques];

            const coordenadaComImagem = (x, y) => ({
                x: Math.max(0, Math.min(W, x)),
                y: Math.max(0, Math.min(H, H - y)),
            });

            const coordenadaFallback = (x, y) => {
                if (todosPontos.length === 0) return { x: W / 2, y: H / 2 };

                const xs = todosPontos.map((p) => p.x);
                const ys = todosPontos.map((p) => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                const norm = (v, min, max, tamanho) =>
                    max === min
                        ? tamanho / 2
                        : ((v - min) / (max - min)) * tamanho;

                return {
                    x: norm(x, minX, maxX, W),
                    y: norm(y, minY, maxY, H),
                };
            };

            const mapearCoordenada = (x, y) =>
                imagemReferencia
                    ? coordenadaComImagem(x, y)
                    : coordenadaFallback(x, y);

            // Desenha caminho do mouse
            const desenharCaminho = (pontosCaminho) => {
                if (pontosCaminho.length <= 1) return;

                ctx.save();

                ctx.beginPath();
                ctx.strokeStyle = "rgba(0, 170, 130, 0.85)";
                ctx.lineWidth = Math.max(2, W * 0.0008);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = "rgba(0, 90, 70, 0.35)";
                ctx.shadowBlur = 4;

                pontosCaminho.forEach((p, i) => {
                    const pos = mapearCoordenada(p.x, p.y);
                    i === 0
                        ? ctx.moveTo(pos.x, pos.y)
                        : ctx.lineTo(pos.x, pos.y);
                });

                ctx.stroke();
                ctx.restore();
            };

            if (visualizacaoGeral) {
                fases.forEach((fase, index) => {
                    const proxima = fases[index + 1];
                    const inicio = fase?.timestamp ?? 0;
                    const fim =
                        proxima?.timestamp ?? sessao?.durationMs ?? Infinity;

                    const pontosDaFase = pontosTodos.filter((p) => {
                        const tempo = p.t ?? p.timestamp ?? 0;
                        return tempo >= inicio && tempo < fim;
                    });

                    desenharCaminho(pontosDaFase);
                });
            } else {
                desenharCaminho(pontos);
            }

            // Desenha pontos de calor (mousePath)
            pontos.forEach((p) => {
                const pos = mapearCoordenada(p.x, p.y);
                const raio = Math.max(12, W * 0.009);
                const grad = ctx.createRadialGradient(
                    pos.x,
                    pos.y,
                    0,
                    pos.x,
                    pos.y,
                    raio,
                );
                grad.addColorStop(0, "rgba(0,180,140,0.14)");

                grad.addColorStop(1, "rgba(78,203,160,0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, raio, 0, Math.PI * 2);
                ctx.fill();
            });

            // Desenha cliques (pontos maiores e mais intensos)
            cliques.forEach((c) => {
                const pos = mapearCoordenada(c.x, c.y);
                const raio = Math.max(28, W * 0.022);
                const grad = ctx.createRadialGradient(
                    pos.x,
                    pos.y,
                    0,
                    pos.x,
                    pos.y,
                    raio,
                );
                grad.addColorStop(0, "rgba(230,60,85,0.85)");
                grad.addColorStop(0.5, "rgba(255,170,60,0.45)");
                grad.addColorStop(1, "rgba(252,129,129,0)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, raio, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "rgba(255,255,255,1)";
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, Math.max(3, W * 0.0025), 0, Math.PI * 2);
                ctx.fill();
            });

            if (pontos.length === 0 && cliques.length === 0) {
                ctx.fillStyle = imagemFundo
                    ? "rgba(28,43,58,0.72)"
                    : "rgba(255,255,255,0.9)";
                ctx.font = `${Math.max(16, W * 0.016)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(
                    "Sem interações registradas nesta fase",
                    W / 2,
                    H / 2,
                );
            }
        };

        desenharHeatmap();

        return () => {
            cancelado = true;
        };
    }, [heatmap, sessao, faseSelecionada]);

    const formatarData = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatarDuracao = (ms) => {
        if (!ms) return "0s";
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}s`;
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    };

    // Tradução dos tipos de evento
    const nomeEvento = (tipo) => {
        const mapa = {
            CategorySelected: "Categoria Selecionada",
            PhaseStarted: "Fase Iniciada",
            DragAttempt: "Tentativa de Arraste",
            CorrectMatch: "Acerto ✅",
            WrongMatch: "Erro ❌",
            PhaseCompleted: "Fase Concluída",
            InactivityDetected: "Inatividade Detectada",
            SessionEnded: "Sessão Encerrada",
        };
        return mapa[tipo] || tipo;
    };

    // Tradução das chaves do payload
    const nomeCampo = (chave) => {
        const mapa = {
            category: "Categoria",
            targetItem: "Item alvo",
            draggedItem: "Item arrastado",
            expectedItem: "Item esperado",
            item: "Item",
            options: "Opções",
            timeSeconds: "Tempo (s)",
            acertos: "Acertos",
            erros: "Erros",
            stars: "Estrelas",
        };
        return mapa[chave] || chave;
    };

    // Chaves a esconder na exibição
    const chavesOcultas = new Set(["correct"]);

    // Agrupa eventos em fases
    const agruparEventosPorFase = (eventos) => {
        const fases = [];
        let faseAtual = null;
        let categoriaAtual = "";

        eventos.forEach((evento) => {
            let payload = {};
            try {
                payload = JSON.parse(evento.payload);
            } catch (_) {}

            if (evento.eventType === "CategorySelected") {
                categoriaAtual = payload.category || "";
            }

            if (evento.eventType === "PhaseStarted") {
                if (faseAtual) fases.push(faseAtual);
                faseAtual = {
                    categoria: categoriaAtual,
                    targetItem: payload.targetItem || "",
                    options: payload.options || [],
                    timestamp: evento.timestamp,
                    eventos: [],
                };
            } else if (faseAtual) {
                faseAtual.eventos.push(evento);
            } else {
                // Eventos antes da primeira fase (CategorySelected, etc.)
                if (fases.length === 0)
                    fases.push({ preJogo: true, eventos: [] });
                fases[0].eventos.push(evento);
            }
        });

        if (faseAtual) fases.push(faseAtual);
        return fases;
    };

    return (
        <div>
            {/* Extrai a categoria da sessão para usar no Header */}
            {(() => {
                let categoriaSessao = "Detalhes da Sessão";
                if (sessao?.gameEvents) {
                    const ev = sessao.gameEvents.find(
                        (e) => e.eventType === "CategorySelected",
                    );
                    if (ev) {
                        try {
                            const p = JSON.parse(ev.payload);
                            if (p.category)
                                categoriaSessao = `Categoria: ${p.category}`;
                        } catch {}
                    }
                }
                return (
                    <Header titulo={categoriaSessao} subtitulo={sessionId} />
                );
            })()}

            <div className="pagina-conteudo">
                <button className="btn-voltar" onClick={() => navegar(-1)}>
                    ← Voltar
                </button>

                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando sessão...</p>
                    </div>
                )}

                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {!carregando && !erro && sessao && (
                    <div className="detalhes-layout">
                        {/* Coluna esquerda */}
                        <div className="detalhes-coluna">
                            {/* Info geral */}
                            <div className="card secao-card">
                                <h3>Informações Gerais</h3>
                                <div className="info-lista">
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Jogador
                                        </span>
                                        <span>{sessao.playerId}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Plataforma
                                        </span>
                                        <span>{sessao.platform}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Início
                                        </span>
                                        <span>
                                            {formatarData(sessao.startedAt)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Duração
                                        </span>
                                        <span>
                                            {formatarDuracao(sessao.durationMs)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Acertos
                                        </span>
                                        <span className="texto-verde">
                                            {sessao.metrics?.totalCorrect || 0}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Erros
                                        </span>
                                        <span
                                            style={{ color: "var(--cor-erro)" }}
                                        >
                                            {sessao.metrics?.totalWrong || 0}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Cliques
                                        </span>
                                        <span>
                                            {sessao.metrics?.totalClicks || 0}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Inatividades
                                        </span>
                                        <span>
                                            {sessao.metrics?.inactivityCount ||
                                                0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Heatmap */}
                            <div className="card secao-card">
                                <div className="heatmap-cabecalho">
                                    <div>
                                        <h3>Mapa de Interações</h3>
                                        <p className="texto-leve">
                                            🟢 Caminho do mouse &nbsp;|&nbsp; 🔴
                                            Cliques
                                        </p>
                                    </div>

                                    {heatmap?.screenshots?.length > 0 && (
                                        <span className="heatmap-badge">
                                            Imagens capturadas
                                        </span>
                                    )}
                                </div>

                                {heatmap && obterFasesHeatmap().length > 1 && (
                                    <div className="heatmap-tabs">
                                        <button
                                            type="button"
                                            className={
                                                faseSelecionada === -1
                                                    ? "heatmap-tab ativo"
                                                    : "heatmap-tab"
                                            }
                                            onClick={() =>
                                                setFaseSelecionada(-1)
                                            }
                                        >
                                            Geral
                                        </button>

                                        {obterFasesHeatmap().map(
                                            (fase, index) => (
                                                <button
                                                    key={fase.faseIndex}
                                                    type="button"
                                                    className={
                                                        faseSelecionada ===
                                                        index
                                                            ? "heatmap-tab ativo"
                                                            : "heatmap-tab"
                                                    }
                                                    onClick={() =>
                                                        setFaseSelecionada(
                                                            index,
                                                        )
                                                    }
                                                >
                                                    Fase {fase.faseIndex + 1}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                )}

                                <div className="heatmap-canvas-wrap">
                                    <canvas
                                        ref={canvasRef}
                                        className="canvas-heatmap"
                                    />
                                </div>

                                <p className="texto-leve heatmap-ajuda">
                                    {heatmap?.screenshots?.length > 0
                                        ? "Use Geral para ver toda a sessão ou selecione uma fase para ver as interações sobre a imagem capturada no jogo."
                                        : "Sessões sem imagem capturada usam o mapa de calor com fundo neutro."}
                                </p>
                            </div>
                        </div>

                        {/* Coluna direita — eventos agrupados por fase */}
                        <div className="detalhes-coluna">
                            <div className="card secao-card">
                                <h3>Linha do Tempo de Eventos</h3>

                                {(() => {
                                    const fases = agruparEventosPorFase(
                                        sessao.gameEvents || [],
                                    );
                                    return fases.map((fase, faseIdx) => {
                                        if (fase.preJogo) {
                                            return (
                                                <div
                                                    key="pre"
                                                    className="fase-bloco"
                                                >
                                                    {fase.eventos.map(
                                                        (evento, i) => {
                                                            let payload = {};
                                                            try {
                                                                payload =
                                                                    JSON.parse(
                                                                        evento.payload,
                                                                    );
                                                            } catch (_) {}
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="timeline-item"
                                                                >
                                                                    <div className="timeline-conteudo">
                                                                        <div className="timeline-tipo">
                                                                            {nomeEvento(
                                                                                evento.eventType,
                                                                            )}
                                                                        </div>
                                                                        <div className="timeline-tempo texto-leve">
                                                                            {(
                                                                                evento.timestamp /
                                                                                1000
                                                                            ).toFixed(
                                                                                1,
                                                                            )}
                                                                            s
                                                                        </div>
                                                                        <div className="timeline-payload">
                                                                            {Object.entries(
                                                                                payload,
                                                                            )
                                                                                .filter(
                                                                                    ([
                                                                                        k,
                                                                                    ]) =>
                                                                                        !chavesOcultas.has(
                                                                                            k,
                                                                                        ),
                                                                                )
                                                                                .map(
                                                                                    ([
                                                                                        k,
                                                                                        v,
                                                                                    ]) => (
                                                                                        <span
                                                                                            key={
                                                                                                k
                                                                                            }
                                                                                            className="payload-chip"
                                                                                        >
                                                                                            {nomeCampo(
                                                                                                k,
                                                                                            )}

                                                                                            :{" "}
                                                                                            <strong>
                                                                                                {String(
                                                                                                    v,
                                                                                                )}
                                                                                            </strong>
                                                                                        </span>
                                                                                    ),
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={faseIdx}
                                                className="fase-bloco"
                                            >
                                                {/* Cabeçalho da fase */}
                                                <div className="fase-cabecalho">
                                                    <span className="fase-numero">
                                                        Fase {faseIdx}
                                                    </span>
                                                    <span className="fase-alvo">
                                                        🎯 Item alvo:{" "}
                                                        <strong>
                                                            {fase.targetItem}
                                                        </strong>
                                                    </span>
                                                    <span
                                                        className="texto-leve"
                                                        style={{
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        {(
                                                            fase.timestamp /
                                                            1000
                                                        ).toFixed(1)}
                                                        s
                                                    </span>
                                                </div>

                                                {/* Opções da fase */}
                                                {fase.options.length > 0 && (
                                                    <div className="fase-opcoes">
                                                        <span
                                                            className="texto-leve"
                                                            style={{
                                                                fontSize:
                                                                    "0.75rem",
                                                            }}
                                                        >
                                                            Opções:
                                                        </span>
                                                        {fase.options.map(
                                                            (op, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`opcao-chip ${op === fase.targetItem ? "opcao-correta" : ""}`}
                                                                >
                                                                    {op}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                {/* Eventos da fase */}
                                                {fase.eventos.map(
                                                    (evento, i) => {
                                                        let payload = {};
                                                        try {
                                                            payload =
                                                                JSON.parse(
                                                                    evento.payload,
                                                                );
                                                        } catch (_) {}

                                                        const isAcerto =
                                                            evento.eventType ===
                                                            "CorrectMatch";
                                                        const isErro =
                                                            evento.eventType ===
                                                            "WrongMatch";
                                                        const isFim =
                                                            evento.eventType ===
                                                                "PhaseCompleted" ||
                                                            evento.eventType ===
                                                                "SessionEnded";

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`timeline-item ${isAcerto ? "item-acerto" : ""} ${isErro ? "item-erro" : ""} ${isFim ? "item-fim" : ""}`}
                                                            >
                                                                <div className="timeline-conteudo">
                                                                    <div className="timeline-tipo">
                                                                        {nomeEvento(
                                                                            evento.eventType,
                                                                        )}
                                                                    </div>
                                                                    <div className="timeline-tempo texto-leve">
                                                                        {(
                                                                            evento.timestamp /
                                                                            1000
                                                                        ).toFixed(
                                                                            1,
                                                                        )}
                                                                        s
                                                                    </div>
                                                                    <div className="timeline-payload">
                                                                        {Object.entries(
                                                                            payload,
                                                                        )
                                                                            .filter(
                                                                                ([
                                                                                    k,
                                                                                ]) =>
                                                                                    !chavesOcultas.has(
                                                                                        k,
                                                                                    ) &&
                                                                                    k !==
                                                                                        "options",
                                                                            )
                                                                            .map(
                                                                                ([
                                                                                    k,
                                                                                    v,
                                                                                ]) => (
                                                                                    <span
                                                                                        key={
                                                                                            k
                                                                                        }
                                                                                        className="payload-chip"
                                                                                    >
                                                                                        {nomeCampo(
                                                                                            k,
                                                                                        )}

                                                                                        :{" "}
                                                                                        <strong>
                                                                                            {String(
                                                                                                v,
                                                                                            )}
                                                                                        </strong>
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
