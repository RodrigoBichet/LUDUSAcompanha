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

const CORES_FASES = [
    { nome: "Fase 1", linha: "rgba(78, 203, 160, 0.95)" },
    { nome: "Fase 2", linha: "rgba(115, 80, 255, 0.95)" },
    { nome: "Fase 3", linha: "rgba(65, 150, 255, 0.95)" },
    { nome: "Fase 4", linha: "rgba(245, 165, 55, 0.95)" },
];

const obterCorFase = (faseIndex) => CORES_FASES[faseIndex % CORES_FASES.length];

export default function DetalhesSessao() {
    const { sessionId } = useParams();
    const navegar = useNavigate();
    const canvasRef = useRef(null);
    const segmentosHeatmapRef = useRef([]);
    const [itemHover, setItemHover] = useState(null);
    const [canvasClicavel, setCanvasClicavel] = useState(false);

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
            const arrastesTodos = heatmap.dragPath || [];

            const dentroDaFase = (item) => {
                const tempo = item.t ?? item.timestamp ?? 0;
                return tempo >= inicioFase && tempo < fimFase;
            };

            const pontos = pontosTodos.filter(dentroDaFase);
            const cliques = cliquesTodos.filter(dentroDaFase);
            const arrastes = arrastesTodos.filter(dentroDaFase);

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
            segmentosHeatmapRef.current = [];

            if (imagemFundo) {
                ctx.drawImage(imagemFundo, 0, 0, W, H);

                // Escurece levemente o print para destacar cliques e trajetos
                ctx.fillStyle = "rgba(28, 43, 58, 0.18)";
                ctx.fillRect(0, 0, W, H);
            } else {
                ctx.fillStyle = "#1C2B3A";
                ctx.fillRect(0, 0, W, H);
            }

            const coordenadaComImagem = (x, y) => ({
                x: Math.max(0, Math.min(W, x)),
                y: Math.max(0, Math.min(H, H - y)),
            });

            const coordenadaFallback = (x, y) => {
                const LARGURA_REFERENCIA = 1920;
                const ALTURA_REFERENCIA = 1080;

                return {
                    x: Math.max(0, Math.min(W, (x / LARGURA_REFERENCIA) * W)),
                    y: Math.max(
                        0,
                        Math.min(H, H - (y / ALTURA_REFERENCIA) * H),
                    ),
                };
            };

            const mapearCoordenada = (x, y) =>
                imagemReferencia
                    ? coordenadaComImagem(x, y)
                    : coordenadaFallback(x, y);

            const obterFaseIndexPorTempo = (item) => {
                const tempo = item.t ?? item.timestamp ?? 0;

                const faseEncontrada = fases.findIndex((fase, index) => {
                    const proxima = fases[index + 1];
                    const inicio = fase?.timestamp ?? 0;
                    const fim =
                        proxima?.timestamp ?? sessao?.durationMs ?? Infinity;

                    return tempo >= inicio && tempo < fim;
                });

                return faseEncontrada >= 0 ? faseEncontrada : 0;
            };

            // Desenha caminho do mouse
            const desenharCaminho = (pontosCaminho, faseIndex = null) => {
                if (pontosCaminho.length <= 1) return;

                ctx.save();

                ctx.beginPath();
                const corFase = obterCorFase(faseIndex ?? 0);

                ctx.strokeStyle = corFase.linha;
                ctx.lineWidth = visualizacaoGeral
                    ? Math.max(2.5, W * 0.0011)
                    : Math.max(3, W * 0.0014);

                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = "rgba(0, 90, 70, 0.35)";
                ctx.shadowBlur = 4;

                let posAnterior = null;

                pontosCaminho.forEach((p, i) => {
                    const pos = mapearCoordenada(p.x, p.y);

                    if (i === 0) {
                        ctx.moveTo(pos.x, pos.y);
                    } else {
                        ctx.lineTo(pos.x, pos.y);

                        if (faseIndex !== null && posAnterior) {
                            segmentosHeatmapRef.current.push({
                                faseIndex,
                                tipo: "movimento",
                                x1: posAnterior.x,
                                y1: posAnterior.y,
                                x2: pos.x,
                                y2: pos.y,
                            });
                        }
                    }

                    posAnterior = pos;
                });

                ctx.stroke();
                ctx.restore();
            };

            const desenharArraste = (pontosArraste, faseIndex = null) => {
                if (pontosArraste.length <= 1) return;

                ctx.save();

                ctx.beginPath();
                const corFase = obterCorFase(faseIndex ?? 0);

                ctx.strokeStyle = corFase.linha;
                ctx.lineWidth = Math.max(4, W * 0.0018);
                ctx.setLineDash([
                    Math.max(10, W * 0.008),
                    Math.max(6, W * 0.004),
                ]);

                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = "rgba(90, 60, 220, 0.45)";
                ctx.shadowBlur = 8;

                let posAnterior = null;

                pontosArraste.forEach((p, i) => {
                    const pos = mapearCoordenada(p.x, p.y);

                    if (i === 0 || p.state === "start") {
                        ctx.moveTo(pos.x, pos.y);
                        posAnterior = pos;
                        return;
                    }

                    ctx.lineTo(pos.x, pos.y);

                    if (faseIndex !== null && posAnterior) {
                        segmentosHeatmapRef.current.push({
                            faseIndex,
                            tipo: "arraste",
                            x1: posAnterior.x,
                            y1: posAnterior.y,
                            x2: pos.x,
                            y2: pos.y,
                        });
                    }

                    posAnterior = pos;
                });

                ctx.stroke();

                pontosArraste.forEach((p) => {
                    if (p.state !== "start" && p.state !== "end") return;

                    const pos = mapearCoordenada(p.x, p.y);
                    const tamanho = Math.max(7, W * 0.005);

                    const corMarcador = obterCorFase(faseIndex ?? 0).linha;

                    ctx.save();
                    ctx.strokeStyle = corMarcador;
                    ctx.fillStyle = corMarcador;

                    ctx.lineWidth = Math.max(2, W * 0.0015);
                    ctx.shadowColor = corMarcador;
                    ctx.shadowBlur = 8;

                    if (p.state === "start") {
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y - tamanho);
                        ctx.lineTo(pos.x + tamanho, pos.y);
                        ctx.lineTo(pos.x, pos.y + tamanho);
                        ctx.lineTo(pos.x - tamanho, pos.y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, tamanho * 0.75, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    ctx.restore();
                });

                ctx.restore();
            };

            const registrarCliqueClicavel = (clique, faseIndex) => {
                if (!visualizacaoGeral) return;

                const pos = mapearCoordenada(clique.x, clique.y);

                segmentosHeatmapRef.current.push({
                    tipo: "clique",
                    faseIndex,
                    x: pos.x,
                    y: pos.y,
                    raio: Math.max(16, W * 0.013),
                });
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

                    const arrastesDaFase = arrastesTodos.filter((p) => {
                        const tempo = p.t ?? p.timestamp ?? 0;
                        return tempo >= inicio && tempo < fim;
                    });

                    const cliquesDaFase = cliquesTodos.filter((p) => {
                        const tempo = p.t ?? p.timestamp ?? 0;
                        return tempo >= inicio && tempo < fim;
                    });

                    cliquesDaFase.forEach((clique) =>
                        registrarCliqueClicavel(clique, index),
                    );

                    desenharCaminho(pontosDaFase, index);
                    desenharArraste(arrastesDaFase, index);
                });
            } else {
                desenharCaminho(pontos, faseSelecionada);
                desenharArraste(arrastes, faseSelecionada);
            }
            if (itemHover) {
                const segmentosDestacados = segmentosHeatmapRef.current.filter(
                    (segmento) =>
                        segmento.faseIndex === itemHover.faseIndex &&
                        segmento.tipo === itemHover.tipo,
                );

                const corFase = obterCorFase(itemHover.faseIndex).linha;

                ctx.save();
                ctx.strokeStyle = corFase;
                ctx.lineWidth = Math.max(7, W * 0.003);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth =
                    faseSelecionada === -1
                        ? Math.max(7, W * 0.003)
                        : Math.max(12, W * 0.005);

                ctx.shadowBlur = faseSelecionada === -1 ? 14 : 24;

                segmentosDestacados.forEach((s) => {
                    if (s.tipo === "clique") return;

                    ctx.setLineDash(
                        s.tipo === "arraste"
                            ? [
                                  faseSelecionada === -1
                                      ? Math.max(10, W * 0.008)
                                      : Math.max(18, W * 0.014),
                                  faseSelecionada === -1
                                      ? Math.max(6, W * 0.004)
                                      : Math.max(8, W * 0.006),
                              ]
                            : [],
                    );

                    ctx.beginPath();
                    ctx.moveTo(s.x1, s.y1);
                    ctx.lineTo(s.x2, s.y2);
                    ctx.stroke();
                });

                ctx.restore();
            }

            // Desenha pontos de calor (mousePath)
            pontos.forEach((p) => {
                const pos = mapearCoordenada(p.x, p.y);
                const raio = Math.max(9, W * 0.009);
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

            // Desenha cliques
            cliques.forEach((c) => {
                const pos = mapearCoordenada(c.x, c.y);
                const raio = Math.max(13, W * 0.011);

                const faseCliqueIndex = visualizacaoGeral
                    ? obterFaseIndexPorTempo(c)
                    : faseSelecionada;

                const cliqueEmHover =
                    itemHover?.tipo === "clique" &&
                    itemHover?.faseIndex === faseCliqueIndex &&
                    Math.hypot(itemHover.x - pos.x, itemHover.y - pos.y) < 1;

                const raioFinal = cliqueEmHover ? raio * 1.35 : raio;

                const grad = ctx.createRadialGradient(
                    pos.x,
                    pos.y,
                    0,
                    pos.x,
                    pos.y,
                    raioFinal,
                );

                grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
                grad.addColorStop(0.18, "rgba(255, 255, 255, 0.9)");
                grad.addColorStop(0.45, "rgba(244, 63, 94, 0.55)");
                grad.addColorStop(1, "rgba(244, 63, 94, 0)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, raioFinal, 0, Math.PI * 2);
                ctx.fill();

                if (visualizacaoGeral) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
                    ctx.lineWidth = Math.max(1.5, W * 0.0012);
                    ctx.beginPath();
                    ctx.arc(
                        pos.x,
                        pos.y,
                        Math.max(5, W * 0.004),
                        0,
                        Math.PI * 2,
                    );
                    ctx.stroke();
                }
            });

            if (
                pontos.length === 0 &&
                cliques.length === 0 &&
                arrastes.length === 0
            ) {
                ctx.fillStyle = imagemFundo
                    ? "rgba(28,43,58,0.72)"
                    : "rgba(255,255,255,0.9)";
                ctx.font = `${Math.max(16, W * 0.016)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(
                    "Nenhuma interação registrada nesta fase",
                    W / 2,
                    H / 2,
                );
            }
        };

        desenharHeatmap();

        return () => {
            cancelado = true;
        };
    }, [heatmap, sessao, faseSelecionada, itemHover]);

    const distanciaPontoSegmento = (px, py, item) => {
        if (item.tipo === "clique") {
            return Math.hypot(px - item.x, py - item.y);
        }

        const { x1, y1, x2, y2 } = item;

        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            return Math.hypot(px - x1, py - y1);
        }

        const t = Math.max(
            0,
            Math.min(
                1,
                ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy),
            ),
        );

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.hypot(px - projX, py - projY);
    };

    const obterPontoCanvas = (evento) => {
        if (!canvasRef.current) return null;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            canvas,
            x: ((evento.clientX - rect.left) / rect.width) * canvas.width,
            y: ((evento.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const obterSegmentoMaisProximo = (evento) => {
        const ponto = obterPontoCanvas(evento);
        if (!ponto) return null;

        const limiteClique = Math.max(18, ponto.canvas.width * 0.012);

        const candidatos = segmentosHeatmapRef.current
            .map((segmento) => ({
                segmento,
                distancia: distanciaPontoSegmento(ponto.x, ponto.y, segmento),
            }))
            .filter(({ segmento, distancia }) => {
                const limite =
                    segmento.tipo === "clique"
                        ? Math.max(segmento.raio || 0, limiteClique)
                        : limiteClique;

                return distancia <= limite;
            });

        const cliquesCandidatos = candidatos.filter(
            ({ segmento }) => segmento.tipo === "clique",
        );

        const segmentoMaisProximo =
            (cliquesCandidatos.length > 0
                ? cliquesCandidatos
                : candidatos
            ).sort((a, b) => a.distancia - b.distancia)[0] || null;

        return segmentoMaisProximo?.segmento || null;
    };

    const abrirFasePeloCanvas = (evento) => {
        if (faseSelecionada !== -1) return;

        const item = obterSegmentoMaisProximo(evento);

        if (item) {
            setFaseSelecionada(item.faseIndex);
        }
    };

    const atualizarHoverCanvas = (evento) => {
        const item = obterSegmentoMaisProximo(evento);

        const mudouHover =
            itemHover?.faseIndex !== item?.faseIndex ||
            itemHover?.tipo !== item?.tipo ||
            itemHover?.x1 !== item?.x1 ||
            itemHover?.y1 !== item?.y1 ||
            itemHover?.x2 !== item?.x2 ||
            itemHover?.y2 !== item?.y2 ||
            itemHover?.x !== item?.x ||
            itemHover?.y !== item?.y;

        if (mudouHover) {
            setItemHover(item);
            setCanvasClicavel(Boolean(item));
        }
    };

    const limparHoverCanvas = () => {
        setItemHover(null);
        setCanvasClicavel(false);
    };

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
    const sessaoDemonstrativa =
        sessao?.gameVersion?.startsWith("demo") ||
        sessao?.sessionId?.startsWith("demo-");

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
                                {sessaoDemonstrativa && (
                                    <span className="badge-demo">
                                        Dados demonstrativos
                                    </span>
                                )}
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
                                        <div className="heatmap-legenda">
                                            {CORES_FASES.map((fase) => (
                                                <span
                                                    key={fase.nome}
                                                    className="heatmap-legenda-item"
                                                >
                                                    <span
                                                        className="heatmap-legenda-cor"
                                                        style={{
                                                            background:
                                                                fase.linha,
                                                        }}
                                                    />
                                                    {fase.nome}
                                                </span>
                                            ))}
                                            <span className="heatmap-legenda-item">
                                                Linha contínua: movimento
                                            </span>
                                            <span className="heatmap-legenda-item">
                                                Linha tracejada: arraste
                                            </span>
                                            <span className="heatmap-legenda-item">
                                                Branco/vermelho: cliques
                                            </span>
                                        </div>
                                    </div>

                                    {heatmap?.screenshots?.length > 0 && (
                                        <span className="heatmap-badge">
                                            Imagens disponíveis
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
                                                    <span
                                                        className="heatmap-tab-cor"
                                                        style={{
                                                            background:
                                                                obterCorFase(
                                                                    index,
                                                                ).linha,
                                                        }}
                                                    />
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
                                        onClick={abrirFasePeloCanvas}
                                        onMouseMove={atualizarHoverCanvas}
                                        onMouseLeave={limparHoverCanvas}
                                        style={{
                                            cursor: canvasClicavel
                                                ? "pointer"
                                                : "default",
                                        }}
                                    />
                                </div>

                                {faseSelecionada === -1 && (
                                    <p className="texto-leve heatmap-ajuda">
                                        {heatmap?.screenshots?.length > 0
                                            ? "Use Geral para ver toda a sessão ou escolha uma fase para ver as interações sobre a imagem do jogo."
                                            : "Esta sessão não possui imagem de fundo. O mapa mostra as interações em uma área neutra."}
                                    </p>
                                )}
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
