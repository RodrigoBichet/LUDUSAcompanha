// =============================================================================
// DetalhesSessao.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de detalhes de uma sessão específica.
// Mostra eventos, métricas e heatmap de interações.
// =============================================================================

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Icone from "../components/shared/Icone";
import { buscarSessao, heatmapSessao, listarJogos } from "../services/api";
import { criarMapaNomesJogos, obterNomeJogo } from "../utils/jogos";
import "./DetalhesSessao.css";

const CORES_FASES = [
    { nome: "Fase 1", linha: "rgba(78, 203, 160, 0.95)" },
    { nome: "Fase 2", linha: "rgba(115, 80, 255, 0.95)" },
    { nome: "Fase 3", linha: "rgba(65, 150, 255, 0.95)" },
    { nome: "Fase 4", linha: "rgba(245, 165, 55, 0.95)" },
];

const obterCorFase = (faseIndex) => CORES_FASES[faseIndex % CORES_FASES.length];

const BACKEND_ORIGIN =
    import.meta.env.VITE_BACKEND_ORIGIN || "http://localhost:3000";

const montarUrlImagem = (caminho) => {
    if (!caminho) return null;
    if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
        return caminho;
    }
    return `${BACKEND_ORIGIN}${caminho}`;
};

const obterPayloadEvento = (evento) => {
    if (evento?.payload && typeof evento.payload === "object") {
        return evento.payload;
    }

    try {
        return JSON.parse(evento?.payload || "{}");
    } catch {
        return {};
    }
};

const temCoordenadaNumerica = (valor) =>
    valor !== null && valor !== "" && Number.isFinite(Number(valor));

const CAPACIDADES_LEGADAS = {
    clicks: true,
    mousePath: true,
    dragPath: true,
    screenshots: true,
    inactivity: true,
    focusEvents: true,
    phaseEvents: true,
    correctWrong: true,
    categoryEvents: true,
    customEvents: true,
};

const ROTULOS_CAPACIDADES = {
    clicks: "Cliques",
    mousePath: "Trajetória do ponteiro",
    dragPath: "Arrastes do ponteiro",
    screenshots: "Capturas visuais",
    inactivity: "Pausas registradas",
    focusEvents: "Eventos de foco",
    phaseEvents: "Eventos de fase",
    correctWrong: "Acertos e erros informados pelo jogo",
    categoryEvents: "Categorias informadas pelo jogo",
    customEvents: "Contextos e eventos registrados",
};

const obterTempoInteracao = (item) =>
    Number(item?.timestamp ?? item?.t ?? item?.time ?? 0);

const calcularDistanciaTrajeto = (pontos = []) =>
    pontos.reduce((total, ponto, indice) => {
        if (indice === 0) return total;
        const anterior = pontos[indice - 1];
        const x = Number(ponto?.x);
        const y = Number(ponto?.y);
        const xAnterior = Number(anterior?.x);
        const yAnterior = Number(anterior?.y);

        if (![x, y, xAnterior, yAnterior].every(Number.isFinite)) return total;
        return total + Math.hypot(x - xAnterior, y - yAnterior);
    }, 0);

const agruparGestosArraste = (pontos = []) => {
    const gestos = [];
    let gestoAtual = null;

    pontos.forEach((ponto) => {
        if (ponto?.state === "start" || !gestoAtual) {
            if (gestoAtual?.pontos?.length) gestos.push(gestoAtual);
            gestoAtual = { inicio: obterTempoInteracao(ponto), pontos: [ponto] };
            return;
        }

        gestoAtual.pontos.push(ponto);
        if (ponto?.state === "end") {
            gestos.push(gestoAtual);
            gestoAtual = null;
        }
    });

    if (gestoAtual?.pontos?.length) gestos.push(gestoAtual);
    return gestos;
};

const formatarDistancia = (valor) => {
    if (!Number.isFinite(valor) || valor <= 0) return "0 px";
    if (valor >= 1000) {
        return `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil px`;
    }
    return `${Math.round(valor).toLocaleString("pt-BR")} px`;
};

const agruparItensPorFase = (itens = []) => {
    const grupos = [];
    const gruposPorChave = new Map();

    itens.forEach((item, indiceGlobal) => {
        const chave = item.faseChave || item.faseId || "sem-fase";

        if (!gruposPorChave.has(chave)) {
            const grupo = {
                chave,
                faseId: item.faseId || "",
                faseNome: item.faseNome || "Atividades acompanhadas",
                categoria: item.categoria || "",
                eventosFase: [],
                itens: [],
            };
            gruposPorChave.set(chave, grupo);
            grupos.push(grupo);
        }

        const grupo = gruposPorChave.get(chave);
        grupo.itens.push({ ...item, indiceGlobal });

        (item.eventosFase || []).forEach((evento) => {
            const jaIncluido = grupo.eventosFase.some(
                (existente) =>
                    existente.eventType === evento.eventType &&
                    existente.timestamp === evento.timestamp,
            );
            if (!jaIncluido) grupo.eventosFase.push(evento);
        });
    });

    return grupos;
};

export default function DetalhesSessao() {
    const { sessionId } = useParams();
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();
    const modoFigura = searchParams.get("figura") === "1";
    const canvasRef = useRef(null);
    const segmentosHeatmapRef = useRef([]);
    const [itemHover, setItemHover] = useState(null);
    const [canvasClicavel, setCanvasClicavel] = useState(false);

    const [sessao, setSessao] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [nomesJogos, setNomesJogos] = useState(new Map());

    const [faseSelecionada, setFaseSelecionada] = useState(0);
    const [faseEventosSelecionada, setFaseEventosSelecionada] = useState(0);

    const capacidades =
        sessao?.capabilities || heatmap?.capabilities || CAPACIDADES_LEGADAS;
    const possuiCapacidade = useCallback(
        (nome) => capacidades[nome] !== false,
        [capacidades],
    );
    const temFasesConfiaveis = possuiCapacidade("phaseEvents");
    const modoObservacional = sessao?.captureMode === "observational";
    const totalMovimentos = sessao?.mousePath?.length || 0;
    const gestosArraste = agruparGestosArraste(sessao?.dragPath || []);
    const totalGestosArraste = gestosArraste.length;
    const distanciaPonteiro = calcularDistanciaTrajeto(
        sessao?.mousePath || [],
    );
    const distanciaArrastes = gestosArraste.reduce(
        (total, gesto) => total + calcularDistanciaTrajeto(gesto.pontos),
        0,
    );
    const linhaTempoObservacional = modoObservacional
        ? [
              {
                  id: "inicio",
                  tempo: 0,
                  tipo: "marco",
                  titulo: "Atividade iniciada",
                  detalhe: "O acompanhamento começou neste jogo.",
              },
              ...(sessao?.clicks || []).map((clique, indice) => ({
                  id: `clique-${indice}`,
                  tempo: obterTempoInteracao(clique),
                  tipo: "clique",
                  titulo: "Clique registrado",
                  detalhe: "Interação realizada dentro da área acompanhada.",
              })),
              ...gestosArraste.map((gesto, indice) => {
                  const fim = obterTempoInteracao(
                      gesto.pontos[gesto.pontos.length - 1],
                  );
                  return {
                      id: `arraste-${indice}`,
                      tempo: gesto.inicio,
                      tipo: "arraste",
                      titulo: "Gesto de arraste",
                      detalhe: `${formatarDistancia(calcularDistanciaTrajeto(gesto.pontos))} em ${Math.max(0, (fim - gesto.inicio) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}s`,
                  };
              }),
              {
                  id: "fim",
                  tempo: Number(sessao?.durationMs || 0),
                  tipo: "marco",
                  titulo: "Atividade encerrada",
                  detalhe: "Os dados disponíveis foram consolidados.",
              },
          ].sort((a, b) => a.tempo - b.tempo)
        : [];
    const dadosDisponiveis = Object.entries(ROTULOS_CAPACIDADES)
        .filter(([capacidade]) => possuiCapacidade(capacidade))
        .map(([, rotulo]) => rotulo);
    const temInteracoesSemanticasPosicionadas = (sessao?.gameEvents || []).some(
        (evento) => {
            if (evento.eventType !== "TrackedInteraction") return false;
            const payload = obterPayloadEvento(evento);
            return (
                temCoordenadaNumerica(payload.x) &&
                temCoordenadaNumerica(payload.y)
            );
        },
    );
    const tiposInteracoesSemanticas = new Set(
        (sessao?.gameEvents || [])
            .filter((evento) => evento.eventType === "TrackedInteraction")
            .map((evento) => obterPayloadEvento(evento).interactionKind)
            .filter(Boolean),
    );
    const temBotoesAcompanhados = tiposInteracoesSemanticas.has("button");
    const temCamposTextoAcompanhados =
        tiposInteracoesSemanticas.has("text-input");
    const temObjetosClicaveisAcompanhados =
        tiposInteracoesSemanticas.has("clickable-object");
    const temObjetosArrastaveisAcompanhados =
        tiposInteracoesSemanticas.has("draggable-object");
    const temOutrasInteracoesAcompanhadas = [...tiposInteracoesSemanticas].some(
        (tipo) =>
            ![
                "button",
                "text-input",
                "clickable-object",
                "draggable-object",
            ].includes(tipo),
    );

    useEffect(() => {
        Promise.all([
            buscarSessao(sessionId),
            heatmapSessao(sessionId),
            listarJogos().catch(() => null),
        ])
            .then(([resSessao, resHeatmap, resJogos]) => {
                const sessaoCarregada = resSessao.data.sessao;

                setSessao(sessaoCarregada);
                setHeatmap(resHeatmap.data);
                setNomesJogos(
                    criarMapaNomesJogos(resJogos?.data?.jogos || []),
                );
                const possuiCapturaVisual =
                    sessaoCarregada?.capabilities?.screenshots !== false &&
                    (resHeatmap.data?.screenshots?.length || 0) > 0;
                setFaseSelecionada(
                    sessaoCarregada?.capabilities?.phaseEvents === false
                        ? possuiCapturaVisual
                            ? 0
                            : -1
                        : 0,
                );
                setFaseEventosSelecionada(0);
                setCarregando(false);
            })
            .catch(() => {
                setErro("Não foi possível carregar os detalhes da sessão.");
                setCarregando(false);
            });
    }, [sessionId]);

    const obterContextosCaptura = useCallback(() => {
        const contextos = [];
        const contextosAbertos = new Map();

        (sessao?.gameEvents || []).forEach((evento) => {
            const payload = obterPayloadEvento(evento);
            const identificador = payload.contextInstanceId;

            if (
                evento.eventType === "CaptureContextStarted" &&
                identificador
            ) {
                contextosAbertos.set(identificador, {
                    identificador,
                    nome: payload.displayName || "Recorte acompanhado",
                    tipo: payload.contextKind || "other",
                    timestamp: evento.timestamp ?? 0,
                    endTimestamp: sessao?.durationMs ?? Infinity,
                });
            }

            if (
                evento.eventType === "CaptureContextEnded" &&
                identificador &&
                contextosAbertos.has(identificador)
            ) {
                const contexto = contextosAbertos.get(identificador);
                contexto.endTimestamp =
                    evento.timestamp ?? sessao?.durationMs ?? Infinity;
                contextos.push(contexto);
                contextosAbertos.delete(identificador);
            }
        });

        contextosAbertos.forEach((contexto) => contextos.push(contexto));

        return contextos.sort((a, b) => a.timestamp - b.timestamp);
    }, [sessao]);

    const obterFasesJogo = useCallback(() => {
        const fases = [];
        let categoriaAtual = "";

        [...(sessao?.gameEvents || [])]
            .sort(
                (a, b) =>
                    Number(a?.timestamp || 0) - Number(b?.timestamp || 0),
            )
            .forEach((evento) => {
                const payload = obterPayloadEvento(evento);

                if (evento.eventType === "CategorySelected") {
                    categoriaAtual = payload.category || categoriaAtual;
                    return;
                }

                if (evento.eventType !== "PhaseStarted") return;

                const indice = fases.length;
                const faseId =
                    payload.phaseId || payload.phaseName || `fase-${indice + 1}`;

                fases.push({
                    faseIndex: indice,
                    faseId,
                    faseNome:
                        payload.phaseName || payload.phaseId || `Fase ${indice + 1}`,
                    categoria: payload.category || categoriaAtual,
                    timestamp: Number(evento.timestamp || 0),
                    endTimestamp: sessao?.durationMs ?? Infinity,
                });
            });

        return fases.map((fase, index) => ({
            ...fase,
            endTimestamp:
                fases[index + 1]?.timestamp ??
                sessao?.durationMs ??
                Infinity,
        }));
    }, [sessao]);

    const obterRecortesHeatmap = useCallback(() => {
        if (!heatmap) return [];

        const contextos = obterContextosCaptura();
        const fasesJogo = obterFasesJogo();
        const screenshots = [...(heatmap.screenshots || [])].sort(
            (a, b) => Number(a?.timestamp || 0) - Number(b?.timestamp || 0),
        );

        const recortesVisuais = screenshots.map((screenshot) => {
            const timestamp = Number(screenshot?.timestamp || 0);
            const contexto =
                contextos.find(
                    (item) =>
                        screenshot?.contextInstanceId &&
                        item.identificador === screenshot.contextInstanceId,
                ) ||
                contextos.find(
                    (item) =>
                        timestamp >= item.timestamp &&
                        timestamp <= item.endTimestamp,
                );

            return {
                identificador:
                    contexto?.identificador ||
                    screenshot?.contextInstanceId ||
                    `captura-${timestamp}`,
                contextName: contexto?.nome || "Recorte acompanhado",
                timestamp: contexto?.timestamp ?? timestamp,
                contextEndTimestamp: contexto?.endTimestamp,
                screenshot,
            };
        });

        const contextosRelevantes = contextos.some(
            (contexto) => contexto.tipo !== "scene",
        )
            ? contextos.filter((contexto) => contexto.tipo !== "scene")
            : contextos;

        const recortesBase =
            recortesVisuais.length > 0
                ? recortesVisuais
                : contextosRelevantes.length > 0
                  ? contextosRelevantes.map((contexto) => ({
                        identificador: contexto.identificador,
                        contextName: contexto.nome,
                        timestamp: contexto.timestamp,
                        contextEndTimestamp: contexto.endTimestamp,
                        screenshot: null,
                    }))
                  : fasesJogo.map((fase) => ({
                        identificador: `fase-${fase.faseId}`,
                        contextName: fase.faseNome,
                        timestamp: fase.timestamp,
                        contextEndTimestamp: fase.endTimestamp,
                        screenshot: null,
                    }));

        const contadorAtividades = new Map();

        return recortesBase.map((recorte, index) => {
            const timestamp = Number(recorte.timestamp || 0);
            const fase = fasesJogo.find(
                (item) =>
                    timestamp >= item.timestamp &&
                    timestamp < item.endTimestamp,
            );
            const chaveFase = fase?.faseId || "sem-fase";
            const atividadeIndex = contadorAtividades.get(chaveFase) || 0;
            contadorAtividades.set(chaveFase, atividadeIndex + 1);

            const proximoRecorteMesmaFase = recortesBase
                .slice(index + 1)
                .find((proximo) => {
                    const proximoTimestamp = Number(proximo.timestamp || 0);
                    if (!fase) return true;
                    return (
                        proximoTimestamp >= fase.timestamp &&
                        proximoTimestamp < fase.endTimestamp
                    );
                });

            return {
                ...recorte,
                faseIndex: fase?.faseIndex ?? 0,
                faseId: fase?.faseId || "",
                faseChave: fase
                    ? `${fase.faseIndex}-${fase.faseId}`
                    : "sem-fase",
                faseNome: fase?.faseNome || "Atividades acompanhadas",
                categoria: fase?.categoria || "",
                faseTimestamp: fase?.timestamp ?? timestamp,
                faseEndTimestamp:
                    fase?.endTimestamp ?? sessao?.durationMs ?? Infinity,
                atividadeIndex,
                nome: `Atividade ${atividadeIndex + 1}`,
                endTimestamp:
                    recorte.contextEndTimestamp ??
                    proximoRecorteMesmaFase?.timestamp ??
                    fase?.endTimestamp ??
                    sessao?.durationMs ??
                    Infinity,
            };
        });
    }, [
        heatmap,
        obterContextosCaptura,
        obterFasesJogo,
        sessao?.durationMs,
    ]);

    const carregarImagem = (url) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });

    // Desenha o heatmap no canvas após carregar os dados
    useEffect(() => {
        if (!heatmap || !canvasRef.current) return;

        let cancelado = false;

        const desenharHeatmap = async () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            const recortes = obterRecortesHeatmap();
            const contextosCaptura = obterContextosCaptura();
            const visualizacaoGeral = faseSelecionada === -1;

            const intervalosMapa = recortes.map((recorte, index) => ({
                inicio: recorte?.timestamp ?? 0,
                fim:
                    recorte?.endTimestamp ??
                    recortes[index + 1]?.timestamp ??
                    sessao?.durationMs ??
                    Infinity,
            }));

            const recorteAtual = visualizacaoGeral
                ? null
                : recortes[faseSelecionada] || recortes[0];

            const inicioRecorte = visualizacaoGeral
                ? 0
                : (recorteAtual?.timestamp ?? 0);
            const fimRecorte = visualizacaoGeral
                ? (sessao?.durationMs ?? Infinity)
                : (recorteAtual?.endTimestamp ??
                  sessao?.durationMs ??
                  Infinity);

            // A visão geral usa fundo neutro para não misturar capturas de momentos diferentes.
            const screenshotUrl = visualizacaoGeral
                ? null
                : montarUrlImagem(recorteAtual?.screenshot?.caminho);

            let imagemFundo = null;
            if (screenshotUrl) {
                try {
                    imagemFundo = await carregarImagem(screenshotUrl);
                } catch {
                    imagemFundo = null;
                }
            }

            if (cancelado) return;

            const pontosTodos = possuiCapacidade("mousePath")
                ? heatmap.mousePath || []
                : [];
            const cliquesTodos = possuiCapacidade("clicks")
                ? heatmap.clicks || []
                : [];
            const arrastesTodos = possuiCapacidade("dragPath")
                ? heatmap.dragPath || []
                : [];
            const interacoesSemanticasTodas = (sessao?.gameEvents || [])
                .filter((evento) => evento.eventType === "TrackedInteraction")
                .map((evento) => {
                    const payload = obterPayloadEvento(evento);
                    return {
                        ...payload,
                        timestamp: evento.timestamp ?? 0,
                    };
                })
                .filter(
                    (interacao) =>
                        temCoordenadaNumerica(interacao.x) &&
                        temCoordenadaNumerica(interacao.y),
                )
                .map((interacao) => ({
                    ...interacao,
                    x: Number(interacao.x),
                    y: Number(interacao.y),
                }));

            const dentroDaFase = (item) => {
                const tempo = item.t ?? item.timestamp ?? 0;
                return tempo >= inicioRecorte && tempo < fimRecorte;
            };

            const pontos = pontosTodos.filter(dentroDaFase);
            const cliques = cliquesTodos.filter(dentroDaFase);
            const arrastes = arrastesTodos.filter(dentroDaFase);
            const interacoesSemanticas =
                interacoesSemanticasTodas.filter(dentroDaFase);

            let imagemReferencia = imagemFundo;

            if (!imagemReferencia && recortes[0]?.screenshot?.caminho) {
                try {
                    imagemReferencia = await carregarImagem(
                        montarUrlImagem(recortes[0].screenshot.caminho),
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

                // A captura serve apenas como referência: a telemetria deve
                // permanecer como a informação visual de maior destaque.
                ctx.fillStyle = "rgba(6, 12, 20, 0.42)";
                ctx.fillRect(0, 0, W, H);
            } else {
                ctx.fillStyle = "#1C2B3A";
                ctx.fillRect(0, 0, W, H);
            }

            const mapearCoordenada = (x, y) => {
                const larguraReferencia = Math.max(
                    1,
                    sessao?.viewport?.widthPx ||
                        heatmap?.viewport?.widthPx ||
                        1920,
                );
                const alturaReferencia = Math.max(
                    1,
                    sessao?.viewport?.heightPx ||
                        heatmap?.viewport?.heightPx ||
                        1080,
                );

                return {
                    x: Math.max(0, Math.min(W, (x / larguraReferencia) * W)),
                    y: Math.max(
                        0,
                        Math.min(H, H - (y / alturaReferencia) * H),
                    ),
                };
            };

            const obterFaseIndexPorTempo = (item) => {
                const tempo = item.t ?? item.timestamp ?? 0;

                const faseEncontrada = intervalosMapa.findIndex((intervalo) => {
                    return tempo >= intervalo.inicio && tempo < intervalo.fim;
                });

                return faseEncontrada >= 0 ? faseEncontrada : 0;
            };

            const obterNomeContexto = (interacao, faseIndex) => {
                const contexto = contextosCaptura.find(
                    (item) =>
                        item.identificador === interacao.contextInstanceId,
                );

                if (contexto) return contexto.nome;
                if (temFasesConfiaveis) return `Fase ${faseIndex + 1}`;
                return "Recorte acompanhado";
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
                const corArraste = "rgba(167, 139, 250, 0.98)";

                ctx.strokeStyle = corArraste;
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

                    const corMarcador = "rgba(196, 181, 253, 1)";

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

            if (visualizacaoGeral && intervalosMapa.length > 0) {
                intervalosMapa.forEach((intervalo, index) => {
                    const inicio = intervalo.inicio;
                    const fim = intervalo.fim;

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
                const indiceVisual = visualizacaoGeral ? 0 : faseSelecionada;

                cliques.forEach((clique) =>
                    registrarCliqueClicavel(clique, indiceVisual),
                );
                desenharCaminho(pontos, indiceVisual);
                desenharArraste(arrastes, indiceVisual);
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
                ctx.shadowColor = corFase;
                ctx.lineWidth = Math.max(7, W * 0.003);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth =
                    faseSelecionada === -1
                        ? Math.max(7, W * 0.003)
                        : Math.max(12, W * 0.005);

                ctx.shadowBlur = faseSelecionada === -1 ? 14 : 24;

                segmentosDestacados.forEach((s) => {
                    if (
                        s.tipo === "clique" ||
                        s.tipo === "interacao-semantica"
                    ) {
                        return;
                    }

                    const arrasteDestacado = s.tipo === "arraste";
                    ctx.strokeStyle = arrasteDestacado
                        ? "rgba(196, 181, 253, 1)"
                        : corFase;
                    ctx.shadowColor = arrasteDestacado
                        ? "rgba(139, 92, 246, 0.95)"
                        : corFase;
                    ctx.setLineDash(
                        arrasteDestacado
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

                grad.addColorStop(0, "rgba(244, 63, 94, 0.98)");
                grad.addColorStop(0.28, "rgba(244, 63, 94, 0.78)");
                grad.addColorStop(0.58, "rgba(244, 63, 94, 0.38)");
                grad.addColorStop(1, "rgba(244, 63, 94, 0)");

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, raioFinal, 0, Math.PI * 2);
                ctx.fill();

                const raioCentro = Math.max(5, W * 0.0045);
                ctx.fillStyle = "rgba(244, 63, 94, 1)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
                ctx.lineWidth = Math.max(1.8, W * 0.0014);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, raioCentro, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            // Destaca elementos que o desenvolvedor marcou semanticamente.
            interacoesSemanticas.forEach((interacao) => {
                const pos = mapearCoordenada(interacao.x, interacao.y);
                const faseInteracaoIndex = visualizacaoGeral
                    ? obterFaseIndexPorTempo(interacao)
                    : faseSelecionada;
                const nome = interacao.displayName || "Elemento acompanhado";
                const contexto = obterNomeContexto(
                    interacao,
                    faseInteracaoIndex,
                );
                const emHover =
                    itemHover?.tipo === "interacao-semantica" &&
                    itemHover?.timestamp === interacao.timestamp &&
                    itemHover?.nome === nome;
                const campoDeTexto =
                    interacao.interactionKind === "text-input";
                const botao = interacao.interactionKind === "button";
                const objetoClicavel =
                    interacao.interactionKind === "clickable-object";
                const objetoArrastavel =
                    interacao.interactionKind === "draggable-object";

                if (objetoArrastavel) {
                    const fimArraste = Number(interacao.timestamp) || 0;
                    const duracaoArraste = Number(interacao.durationMs) || 0;
                    const inicioArraste = fimArraste - duracaoArraste;
                    const toleranciaMs = 100;
                    let pontosArrasteSemantico = arrastes
                        .filter((ponto) => {
                            const tempo = ponto.t ?? ponto.timestamp ?? 0;
                            return (
                                tempo >= inicioArraste - toleranciaMs &&
                                tempo <= fimArraste + toleranciaMs
                            );
                        })
                        .map((ponto) =>
                            mapearCoordenada(ponto.x, ponto.y),
                        );

                    if (
                        pontosArrasteSemantico.length < 2 &&
                        temCoordenadaNumerica(interacao.startX) &&
                        temCoordenadaNumerica(interacao.startY) &&
                        temCoordenadaNumerica(interacao.endX) &&
                        temCoordenadaNumerica(interacao.endY)
                    ) {
                        pontosArrasteSemantico = [
                            mapearCoordenada(
                                Number(interacao.startX),
                                Number(interacao.startY),
                            ),
                            mapearCoordenada(
                                Number(interacao.endX),
                                Number(interacao.endY),
                            ),
                        ];
                    }

                    if (pontosArrasteSemantico.length > 1) {
                        ctx.save();
                        ctx.strokeStyle = emHover
                            ? "rgba(196, 181, 253, 1)"
                            : "rgba(139, 92, 246, 0.58)";
                        ctx.lineWidth = emHover
                            ? Math.max(9, W * 0.006)
                            : Math.max(4, W * 0.0025);
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        ctx.setLineDash(
                            emHover
                                ? []
                                : [Math.max(8, W * 0.007), Math.max(5, W * 0.004)],
                        );
                        ctx.shadowColor = "rgba(139, 92, 246, 0.95)";
                        ctx.shadowBlur = emHover ? 22 : 8;
                        ctx.beginPath();
                        pontosArrasteSemantico.forEach((ponto, index) => {
                            if (index === 0) {
                                ctx.moveTo(ponto.x, ponto.y);
                            } else {
                                ctx.lineTo(ponto.x, ponto.y);
                            }
                        });
                        ctx.stroke();

                        const inicio = pontosArrasteSemantico[0];
                        const tamanhoInicio = Math.max(7, W * 0.006);
                        ctx.setLineDash([]);
                        ctx.fillStyle = "rgba(28, 43, 58, 0.96)";
                        ctx.strokeStyle = "rgba(196, 181, 253, 1)";
                        ctx.lineWidth = Math.max(2.5, W * 0.002);
                        ctx.fillRect(
                            inicio.x - tamanhoInicio,
                            inicio.y - tamanhoInicio,
                            tamanhoInicio * 2,
                            tamanhoInicio * 2,
                        );
                        ctx.strokeRect(
                            inicio.x - tamanhoInicio,
                            inicio.y - tamanhoInicio,
                            tamanhoInicio * 2,
                            tamanhoInicio * 2,
                        );
                        ctx.restore();
                    }
                }

                const marcador = {
                    tipo: "interacao-semantica",
                    faseIndex: faseInteracaoIndex,
                    x: pos.x,
                    y: pos.y,
                    raio: Math.max(18, W * 0.014),
                    nome,
                    contexto,
                    timestamp: interacao.timestamp,
                    interactionKind: interacao.interactionKind,
                    action: interacao.action,
                    characterCount: interacao.characterCount,
                    wasEmpty: interacao.wasEmpty,
                    startX: interacao.startX,
                    startY: interacao.startY,
                    endX: interacao.endX,
                    endY: interacao.endY,
                    durationMs: interacao.durationMs,
                    distancePx: interacao.distancePx,
                    tooltipX: Math.max(
                        14,
                        Math.min(86, (pos.x / Math.max(1, W)) * 100),
                    ),
                    tooltipY: Math.max(
                        18,
                        Math.min(88, (pos.y / Math.max(1, H)) * 100),
                    ),
                };

                segmentosHeatmapRef.current.push(marcador);

                const raio = emHover
                    ? Math.max(17, W * 0.013)
                    : Math.max(13, W * 0.01);

                ctx.save();
                ctx.shadowColor = campoDeTexto
                    ? "rgba(14, 165, 233, 0.85)"
                    : botao
                      ? "rgba(245, 158, 11, 0.85)"
                      : objetoClicavel
                        ? "rgba(236, 72, 153, 0.88)"
                        : objetoArrastavel
                          ? "rgba(139, 92, 246, 0.9)"
                          : "rgba(100, 116, 139, 0.82)";
                ctx.shadowBlur = emHover ? 20 : 12;
                ctx.fillStyle = campoDeTexto
                    ? "rgba(14, 165, 233, 0.96)"
                    : botao
                      ? "rgba(245, 158, 11, 0.95)"
                      : objetoClicavel
                        ? "rgba(236, 72, 153, 0.96)"
                        : objetoArrastavel
                          ? "rgba(139, 92, 246, 0.97)"
                          : "rgba(100, 116, 139, 0.95)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
                ctx.lineWidth = Math.max(2.5, W * 0.002);
                ctx.beginPath();
                if (campoDeTexto) {
                    ctx.moveTo(pos.x, pos.y - raio);
                    ctx.lineTo(pos.x + raio, pos.y);
                    ctx.lineTo(pos.x, pos.y + raio);
                    ctx.lineTo(pos.x - raio, pos.y);
                    ctx.closePath();
                } else if (objetoClicavel) {
                    for (let lado = 0; lado < 6; lado += 1) {
                        const angulo = (Math.PI / 3) * lado - Math.PI / 2;
                        const x = pos.x + Math.cos(angulo) * raio;
                        const y = pos.y + Math.sin(angulo) * raio;
                        if (lado === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                } else if (objetoArrastavel) {
                    const lado = raio * 1.55;
                    ctx.rect(pos.x - lado / 2, pos.y - lado / 2, lado, lado);
                } else {
                    ctx.arc(pos.x, pos.y, raio, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "rgba(28, 43, 58, 0.95)";
                ctx.beginPath();
                if (campoDeTexto || objetoArrastavel) {
                    const centro = Math.max(3.5, raio * 0.3);
                    ctx.rect(
                        pos.x - centro,
                        pos.y - centro,
                        centro * 2,
                        centro * 2,
                    );
                } else {
                    ctx.arc(
                        pos.x,
                        pos.y,
                        Math.max(3.5, raio * 0.28),
                        0,
                        Math.PI * 2,
                    );
                }
                ctx.fill();
                ctx.restore();
            });

            if (
                pontos.length === 0 &&
                cliques.length === 0 &&
                arrastes.length === 0 &&
                interacoesSemanticas.length === 0
            ) {
                ctx.fillStyle = imagemFundo
                    ? "rgba(28,43,58,0.72)"
                    : "rgba(255,255,255,0.9)";
                ctx.font = `${Math.max(16, W * 0.016)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(
                    visualizacaoGeral
                        ? "Nenhuma interação registrada nesta sessão"
                        : "Nenhuma interação registrada neste recorte",
                    W / 2,
                    H / 2,
                );
            }
        };

        desenharHeatmap();

        return () => {
            cancelado = true;
        };
    }, [
        heatmap,
        sessao,
        faseSelecionada,
        itemHover,
        obterRecortesHeatmap,
        obterContextosCaptura,
        possuiCapacidade,
        temFasesConfiaveis,
        modoObservacional,
    ]);

    const distanciaPontoSegmento = (px, py, item) => {
        if (
            item.tipo === "clique" ||
            item.tipo === "interacao-semantica"
        ) {
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

        const interacoesSemanticasCandidatas = candidatos.filter(
            ({ segmento }) => segmento.tipo === "interacao-semantica",
        );
        const cliquesCandidatos = candidatos.filter(
            ({ segmento }) => segmento.tipo === "clique",
        );

        const segmentoMaisProximo =
            (interacoesSemanticasCandidatas.length > 0
                ? interacoesSemanticasCandidatas
                : cliquesCandidatos.length > 0
                  ? cliquesCandidatos
                  : candidatos
            ).sort((a, b) => a.distancia - b.distancia)[0] || null;

        return segmentoMaisProximo?.segmento || null;
    };

    const abrirFasePeloCanvas = (evento) => {
        const item = obterSegmentoMaisProximo(evento);

        if (item?.tipo === "interacao-semantica") {
            setItemHover(item);
            return;
        }

        if (faseSelecionada !== -1) return;

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
            itemHover?.y !== item?.y ||
            itemHover?.nome !== item?.nome ||
            itemHover?.timestamp !== item?.timestamp;

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
    const nomeEvento = (tipo, payload = {}) => {
        if (tipo === "TrackedInteraction") {
            const nome =
                typeof payload.displayName === "string" &&
                payload.displayName.trim()
                    ? payload.displayName.trim()
                    : "Elemento acompanhado";

            if (
                payload.interactionKind === "button" &&
                payload.action === "activated"
            ) {
                return `${nome} acionado`;
            }

            if (
                payload.interactionKind === "text-input" &&
                payload.action === "completed"
            ) {
                return payload.wasEmpty === true
                    ? `${nome} concluído sem preenchimento`
                    : `${nome} preenchido`;
            }

            if (
                payload.interactionKind === "clickable-object" &&
                payload.action === "activated"
            ) {
                return `${nome} clicado`;
            }

            if (
                payload.interactionKind === "draggable-object" &&
                payload.action === "completed"
            ) {
                return `${nome} arrastado`;
            }

            return `${nome}: interação registrada`;
        }

        const mapa = {
            CategorySelected: "Categoria Selecionada",
            PhaseStarted: "Fase Iniciada",
            DragAttempt: "Tentativa de Arraste",
            DragStarted: "Arraste iniciado",
            DragEnded: "Arraste encerrado",
            CorrectMatch: "Acerto",
            WrongMatch: "Erro",
            PhaseCompleted: "Fase Concluída",
            InactivityDetected: "Pausa registrada",
            FocusLost: "Jogo perdeu o foco",
            FocusGained: "Jogo recuperou o foco",
            CaptureContextStarted: "Recorte de acompanhamento iniciado",
            CaptureContextEnded: "Recorte de acompanhamento encerrado",
            TrackedInteraction: "Interação acompanhada",
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
            target: "Item alvo",
            draggedItem: "Item arrastado",
            expectedItem: "Item esperado",
            expected: "Item esperado",
            item: "Item",
            options: "Opções",
            timeSeconds: "Tempo (s)",
            acertos: "Acertos",
            erros: "Erros",
            stars: "Estrelas",
            displayName: "Nome do recorte",
            contextKind: "Tipo do recorte",
            observationPurpose: "Objetivo do recorte",
            interactionKind: "Tipo de interação",
            action: "Ação",
            characterCount: "Quantidade de caracteres",
            wasEmpty: "Campo vazio",
            startX: "Início X",
            startY: "Início Y",
            endX: "Fim X",
            endY: "Fim Y",
            durationMs: "Duração do arraste",
            distancePx: "Distância percorrida",
        };
        return mapa[chave] || chave;
    };

    const nomeValorCampo = (chave, valor) => {
        if (Array.isArray(valor)) {
            return valor.join(", ");
        }

        if (chave === "contextKind") {
            const tiposDeRecorte = {
                scene: "Cena",
                canvas: "Canvas",
                panel: "Painel",
                activity: "Atividade",
            };
            return tiposDeRecorte[valor] || String(valor);
        }

        if (chave === "interactionKind") {
            const tiposDeInteracao = {
                button: "Botão",
                "text-input": "Campo de texto",
                "clickable-object": "Objeto clicável",
                "draggable-object": "Objeto arrastável",
            };
            return tiposDeInteracao[valor] || String(valor);
        }

        if (chave === "action") {
            const acoes = {
                activated: "Acionado",
                completed: "Preenchimento concluído",
            };
            return acoes[valor] || String(valor);
        }

        if (chave === "wasEmpty") {
            return valor === true ? "Sim" : "Não";
        }

        if (["startX", "startY", "endX", "endY"].includes(chave)) {
            return Number(valor).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
            });
        }

        if (chave === "durationMs") {
            return `${(Number(valor) / 1000).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
            })} s`;
        }

        if (chave === "distancePx") {
            return `${Number(valor).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
            })} px`;
        }

        return String(valor);
    };

    // Chaves a esconder na exibição
    const chavesOcultas = new Set([
        "correct",
        "target",
        "contextInstanceId",
    ]);

    // Agrupa a sequência nos mesmos recortes usados pelo mapa. Eventos
    // técnicos de abertura e fechamento continuam no JSON, mas não precisam
    // ocupar espaço na leitura pedagógica da sessão.
    const agruparEventosPorFase = (eventos, recortes = []) => {
        const eventosOrdenados = [...eventos]
            .filter(
                (evento) =>
                    evento.eventType !== "CaptureContextStarted" &&
                    evento.eventType !== "CaptureContextEnded",
            )
            .sort(
                (a, b) =>
                    Number(a?.timestamp || 0) - Number(b?.timestamp || 0),
            );

        if (recortes.length > 1) {
            const recortesOrdenados = [...recortes].sort(
                (a, b) =>
                    Number(a?.timestamp || 0) - Number(b?.timestamp || 0),
            );
            const primeiroTimestamp = Number(
                recortesOrdenados[0]?.faseTimestamp ??
                    recortesOrdenados[0]?.timestamp ??
                    0,
            );
            const preJogo = eventosOrdenados.filter(
                (evento) => Number(evento?.timestamp || 0) < primeiroTimestamp,
            );
            const grupos = recortesOrdenados.map((recorte, index) => {
                const inicio = Number(
                    recorte.atividadeIndex === 0
                        ? (recorte.faseTimestamp ?? recorte.timestamp ?? 0)
                        : (recorte.timestamp ?? 0),
                );
                const proximoRecorteMesmaFase = recortesOrdenados
                    .slice(index + 1)
                    .find(
                        (proximo) =>
                            proximo.faseChave === recorte.faseChave,
                    );
                const fim = Number(
                    proximoRecorteMesmaFase?.timestamp ??
                        recorte.faseEndTimestamp ??
                        recorte.endTimestamp ??
                        sessao?.durationMs ??
                        Infinity,
                );
                const eventosDoIntervalo = eventosOrdenados.filter((evento) => {
                    const timestamp = Number(evento?.timestamp || 0);
                    const eventoDeEncerramento =
                        evento.eventType === "PhaseCompleted" ||
                        evento.eventType === "SessionEnded";
                    return (
                        timestamp >= inicio &&
                        (timestamp < fim ||
                            (timestamp === fim && eventoDeEncerramento))
                    );
                });
                const eventosFase = eventosDoIntervalo.filter((evento) =>
                    [
                        "PhaseStarted",
                        "PhaseCompleted",
                        "SessionEnded",
                    ].includes(evento.eventType),
                );
                const eventosDoRecorte = eventosDoIntervalo.filter(
                    (evento) =>
                        ![
                            "PhaseStarted",
                            "PhaseCompleted",
                            "SessionEnded",
                        ].includes(evento.eventType),
                );
                const tentativa = eventosDoRecorte.find(
                    (evento) => evento.eventType === "DragAttempt",
                );
                const payloadTentativa = tentativa
                    ? obterPayloadEvento(tentativa)
                    : {};

                return {
                    nome: recorte.nome || `Fase ${index + 1}`,
                    faseId: recorte.faseId || "",
                    faseChave: recorte.faseChave || "sem-fase",
                    faseNome: recorte.faseNome || "Atividades acompanhadas",
                    categoria: recorte.categoria || "",
                    atividadeIndex: recorte.atividadeIndex ?? index,
                    contextName: recorte.contextName || "",
                    targetItem:
                        payloadTentativa.expectedItem ||
                        recorte.contextName ||
                        "Atividade acompanhada",
                    targetLabel: payloadTentativa.expectedItem
                        ? "Resposta esperada"
                        : "Recorte",
                    options: Array.isArray(payloadTentativa.options)
                        ? payloadTentativa.options
                        : [],
                    timestamp: inicio,
                    eventosFase,
                    eventos: eventosDoRecorte,
                };
            });

            return [
                ...(preJogo.length > 0
                    ? [{ preJogo: true, eventos: preJogo }]
                    : []),
                ...grupos,
            ];
        }

        const fases = [];
        let faseAtual = null;
        let categoriaAtual = "";

        eventosOrdenados.forEach((evento) => {
            const payload = obterPayloadEvento(evento);

            if (evento.eventType === "CategorySelected") {
                categoriaAtual = payload.category || "";
            }

            if (evento.eventType === "PhaseStarted") {
                if (faseAtual) fases.push(faseAtual);
                faseAtual = {
                    categoria: categoriaAtual,
                    targetItem: payload.targetItem || payload.target || "",
                    targetLabel: "Item alvo",
                    nome: `Fase ${fases.filter((fase) => !fase.preJogo).length + 1}`,
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
            {/* O jogo é a referência principal de navegação da atividade. */}
            {(() => {
                const nomeJogo = sessao
                    ? obterNomeJogo(sessao.gameId, nomesJogos)
                    : "Detalhes da atividade";
                const subtituloSessao = sessao
                    ? `${sessao.playerId || "Aluno"} • ${formatarData(sessao.startedAt)} • ${formatarDuracao(sessao.durationMs)}`
                    : "";

                return (
                    <Header
                        titulo={nomeJogo}
                        subtitulo={subtituloSessao}
                    />
                );
            })()}

            <div
                className={
                    modoFigura
                        ? "pagina-conteudo pagina-conteudo-figura"
                        : "pagina-conteudo"
                }
            >
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
                        <Icone nome="aviso" titulo="Atenção" />
                        <p>{erro}</p>
                    </div>
                )}

                {!carregando && !erro && sessao && (
                    <div
                        className={`detalhes-layout ${modoObservacional ? "observacional" : ""}`}
                    >
                        {/* Coluna esquerda */}
                        <div className="detalhes-coluna">
                            {/* Info geral */}
                            <div className="card secao-card detalhes-info-card">
                                <h3>Resumo da atividade</h3>
                                {sessaoDemonstrativa && (
                                    <span className="badge-demo">
                                        Dados demonstrativos
                                    </span>
                                )}
                                {modoObservacional && (
                                    <div className="telemetria-aviso">
                                        <strong>Observação pelo navegador</strong>
                                        <span>
                                            Foram registradas interações com a
                                            área do jogo. Esses dados apoiam a
                                            observação do professor, mas não
                                            identificam acertos, erros ou
                                            objetivos internos automaticamente.
                                        </span>
                                    </div>
                                )}
                                <div className="resumo-interacoes" aria-label="Resumo numérico da atividade">
                                    <div className="resumo-interacao-item">
                                        <span>Duração</span>
                                        <strong>{formatarDuracao(sessao.durationMs)}</strong>
                                    </div>
                                    {possuiCapacidade("clicks") && (
                                        <div className="resumo-interacao-item">
                                            <span>Cliques</span>
                                            <strong>{sessao.metrics?.totalClicks || 0}</strong>
                                        </div>
                                    )}
                                    {possuiCapacidade("mousePath") && (
                                        <div className="resumo-interacao-item">
                                            <span>Movimentos registrados</span>
                                            <strong>{totalMovimentos}</strong>
                                        </div>
                                    )}
                                    {possuiCapacidade("dragPath") && (
                                        <div className="resumo-interacao-item">
                                            <span>Gestos de arraste</span>
                                            <strong>{totalGestosArraste}</strong>
                                        </div>
                                    )}
                                    {modoObservacional &&
                                        possuiCapacidade("mousePath") && (
                                            <div className="resumo-interacao-item">
                                                <span>Trajeto do ponteiro</span>
                                                <strong>
                                                    {formatarDistancia(
                                                        distanciaPonteiro,
                                                    )}
                                                </strong>
                                            </div>
                                        )}
                                    {modoObservacional &&
                                        possuiCapacidade("dragPath") && (
                                            <div className="resumo-interacao-item">
                                                <span>Trajeto em arraste</span>
                                                <strong>
                                                    {formatarDistancia(
                                                        distanciaArrastes,
                                                    )}
                                                </strong>
                                            </div>
                                        )}
                                </div>
                                <div className="info-lista">
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Jogador
                                        </span>
                                        <span>{sessao.playerId}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Ambiente
                                        </span>
                                        <span>
                                            {sessao.platform === "browser"
                                                ? "Navegador Web"
                                                : sessao.platform}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="texto-leve">
                                            Início
                                        </span>
                                        <span>
                                            {formatarData(sessao.startedAt)}
                                        </span>
                                    </div>
                                    {possuiCapacidade("correctWrong") && (
                                        <>
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Acertos
                                                </span>
                                                <span className="texto-verde">
                                                    {sessao.metrics?.totalCorrect ||
                                                        0}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Erros
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--cor-erro)",
                                                    }}
                                                >
                                                    {sessao.metrics?.totalWrong ||
                                                        0}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {possuiCapacidade("inactivity") && (
                                        <div className="info-item">
                                            <span className="texto-leve">
                                                Inatividades
                                            </span>
                                            <span>
                                                {sessao.metrics
                                                    ?.inactivityCount || 0}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="telemetria-aviso">
                                    <strong>O que foi registrado nesta atividade</strong>
                                    <span>{dadosDisponiveis.join(" • ")}</span>
                                </div>
                            </div>

                            {/* Heatmap */}
                            <div className="card secao-card">
                                <div className="heatmap-cabecalho">
                                    <div>
                                        <h3>Mapa da atividade</h3>
                                        <div className="heatmap-legenda">
                                            {obterRecortesHeatmap().map(
                                                (recorte, index, recortes) => (
                                                    <span
                                                        key={
                                                            recorte.identificador ||
                                                            recorte.nome
                                                        }
                                                        className="heatmap-legenda-item"
                                                    >
                                                        <span
                                                            className="heatmap-legenda-cor"
                                                            style={{
                                                                background:
                                                                    obterCorFase(
                                                                        index,
                                                                    ).linha,
                                                            }}
                                                        />
                                                        {new Set(
                                                            recortes.map(
                                                                (item) =>
                                                                    item.faseChave,
                                                            ),
                                                        ).size > 1
                                                            ? `${recorte.faseNome} · ${recorte.nome}`
                                                            : recorte.nome}
                                                    </span>
                                                ),
                                            )}
                                            {possuiCapacidade("mousePath") && (
                                                <span className="heatmap-legenda-item">
                                                    <span className="heatmap-legenda-movimento" />
                                                    Linha contínua: movimento
                                                </span>
                                            )}
                                            {possuiCapacidade("dragPath") && (
                                                <span className="heatmap-legenda-item">
                                                    <span className="heatmap-legenda-arraste" />
                                                    Roxo tracejado: arraste
                                                </span>
                                            )}
                                            {possuiCapacidade("clicks") && (
                                                <span className="heatmap-legenda-item">
                                                    <span className="heatmap-legenda-clique" />
                                                    Ponto vermelho: clique
                                                </span>
                                            )}
                                            {temInteracoesSemanticasPosicionadas &&
                                                temBotoesAcompanhados && (
                                                <span className="heatmap-legenda-item">
                                                    <span className="heatmap-legenda-semantica botao" />
                                                    Círculo âmbar: botão
                                                </span>
                                            )}
                                            {temInteracoesSemanticasPosicionadas &&
                                                temCamposTextoAcompanhados && (
                                                    <span className="heatmap-legenda-item">
                                                        <span className="heatmap-legenda-semantica texto" />
                                                        Losango azul: campo de
                                                        texto
                                                    </span>
                                                )}
                                            {temInteracoesSemanticasPosicionadas &&
                                                temObjetosClicaveisAcompanhados && (
                                                    <span className="heatmap-legenda-item">
                                                        <span className="heatmap-legenda-semantica clicavel" />
                                                        Hexágono rosa: objeto
                                                        clicável
                                                    </span>
                                                )}
                                            {temInteracoesSemanticasPosicionadas &&
                                                temObjetosArrastaveisAcompanhados && (
                                                    <span className="heatmap-legenda-item">
                                                        <span className="heatmap-legenda-semantica arrastavel" />
                                                        Quadrado roxo: objeto
                                                        arrastável
                                                    </span>
                                                )}
                                            {temInteracoesSemanticasPosicionadas &&
                                                temOutrasInteracoesAcompanhadas && (
                                                    <span className="heatmap-legenda-item">
                                                        <span className="heatmap-legenda-semantica outro" />
                                                        Roxo: outra interação
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    {possuiCapacidade("screenshots") &&
                                        heatmap?.screenshots?.length > 0 && (
                                        <span className="heatmap-badge">
                                            Capturas visuais disponíveis
                                        </span>
                                    )}
                                </div>

                                {heatmap &&
                                    obterRecortesHeatmap().length > 0 &&
                                    (() => {
                                        const grupos = agruparItensPorFase(
                                            obterRecortesHeatmap(),
                                        );

                                        return (
                                            <div className="recortes-navegacao">
                                                <button
                                                    type="button"
                                                    className={
                                                        faseSelecionada === -1
                                                            ? "heatmap-tab heatmap-tab-geral ativo"
                                                            : "heatmap-tab heatmap-tab-geral"
                                                    }
                                                    onClick={() =>
                                                        setFaseSelecionada(-1)
                                                    }
                                                >
                                                    Geral
                                                </button>

                                                {grupos.map((grupo) => (
                                                    <div
                                                        className="recortes-grupo"
                                                        key={grupo.chave}
                                                    >
                                                        <div className="recortes-grupo-cabecalho">
                                                            <strong>
                                                                {grupo.faseNome}
                                                            </strong>
                                                            {grupo.categoria && (
                                                                <span>
                                                                    Categoria: {grupo.categoria}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="heatmap-tabs">
                                                            {grupo.itens.map(
                                                                (recorte) => (
                                                                    <button
                                                                        key={
                                                                            recorte.identificador ||
                                                                            recorte.indiceGlobal
                                                                        }
                                                                        type="button"
                                                                        className={
                                                                            faseSelecionada ===
                                                                            recorte.indiceGlobal
                                                                                ? "heatmap-tab ativo"
                                                                                : "heatmap-tab"
                                                                        }
                                                                        title={
                                                                            recorte.contextName
                                                                                ? `${recorte.nome}: ${recorte.contextName}`
                                                                                : recorte.nome
                                                                        }
                                                                        onClick={() => {
                                                                            setFaseSelecionada(
                                                                                recorte.indiceGlobal,
                                                                            );
                                                                            setFaseEventosSelecionada(
                                                                                recorte.indiceGlobal,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <span
                                                                            className="heatmap-tab-cor"
                                                                            style={{
                                                                                background:
                                                                                    obterCorFase(
                                                                                        recorte.indiceGlobal,
                                                                                    )
                                                                                        .linha,
                                                                            }}
                                                                        />
                                                                        {
                                                                            recorte.nome
                                                                        }
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

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

                                {temInteracoesSemanticasPosicionadas && (
                                    <div
                                        className={`heatmap-detalhe-semantico ${itemHover?.tipo === "interacao-semantica" ? (itemHover.interactionKind === "text-input" ? "texto" : itemHover.interactionKind === "button" ? "botao" : itemHover.interactionKind === "clickable-object" ? "clicavel" : itemHover.interactionKind === "draggable-object" ? "arrastavel" : "outro") : "vazio"}`}
                                        role="status"
                                        aria-live="polite"
                                    >
                                        {itemHover?.tipo ===
                                        "interacao-semantica" ? (
                                            <>
                                                <div className="heatmap-detalhe-topo">
                                                    <strong>
                                                        {itemHover.nome}
                                                    </strong>
                                                    <span>
                                                        {itemHover.contexto} •{" "}
                                                        {(
                                                            (itemHover.timestamp ||
                                                                0) / 1000
                                                        ).toFixed(1)}
                                                        s
                                                    </span>
                                                </div>
                                                <span>
                                                    {itemHover.interactionKind ===
                                                        "button" &&
                                                    itemHover.action ===
                                                        "activated"
                                                        ? "Botão acionado"
                                                        : itemHover.interactionKind ===
                                                                "text-input" &&
                                                            itemHover.action ===
                                                                "completed"
                                                          ? itemHover.wasEmpty ===
                                                            true
                                                              ? "Campo deixado vazio"
                                                              : `${Number(itemHover.characterCount) || 0} caracteres informados`
                                                          : itemHover.interactionKind ===
                                                              "clickable-object"
                                                            ? "Objeto clicado"
                                                            : itemHover.interactionKind ===
                                                                "draggable-object"
                                                              ? `Arraste de ${Number(itemHover.distancePx || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} px em ${(Number(itemHover.durationMs || 0) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} s`
                                                              : "Interação registrada"}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <strong>
                                                    Detalhes da interação
                                                </strong>
                                                <span>
                                                    Passe o mouse sobre um
                                                    marcador colorido para ver
                                                    suas informações sem cobrir
                                                    o mapa.
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className="texto-leve heatmap-ajuda">
                                    {heatmap?.screenshots?.length > 0
                                        ? faseSelecionada === -1
                                            ? "Use Geral para ver toda a sessão em uma área neutra ou escolha um recorte para ver as interações sobre a captura visual correspondente."
                                            : "As interações deste recorte estão sobrepostas à captura visual registrada pelo jogo."
                                        : "Esta sessão não possui captura visual. O mapa mostra as interações em uma área neutra."}
                                </p>
                            </div>
                        </div>

                        {/* Coluna direita — sequência de eventos */}
                        <div className="detalhes-coluna">
                            <div className="card secao-card">
                                <h3>
                                    {modoObservacional
                                        ? "Linha do tempo da interação"
                                        : "Sequência da sessão"}
                                </h3>

                                {modoObservacional ? (
                                    <div className="linha-tempo-observacional">
                                        {linhaTempoObservacional.map(
                                            (evento) => (
                                                <div
                                                    key={evento.id}
                                                    className={`evento-observacional ${evento.tipo}`}
                                                >
                                                    <span className="evento-observacional-tempo">
                                                        {(
                                                            evento.tempo / 1000
                                                        ).toLocaleString(
                                                            "pt-BR",
                                                            {
                                                                maximumFractionDigits: 1,
                                                            },
                                                        )}
                                                        s
                                                    </span>
                                                    <span className="evento-observacional-marcador" />
                                                    <span className="evento-observacional-conteudo">
                                                        <strong>
                                                            {evento.titulo}
                                                        </strong>
                                                        <small>
                                                            {evento.detalhe}
                                                        </small>
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (() => {
                                    const recortesDaSessao =
                                        obterRecortesHeatmap();
                                    const fasesAgrupadas =
                                        agruparEventosPorFase(
                                            sessao.gameEvents || [],
                                            recortesDaSessao,
                                        );

                                    const preJogo = fasesAgrupadas.find(
                                        (fase) => fase.preJogo,
                                    );
                                    const fasesJogadas = fasesAgrupadas.filter(
                                        (fase) => !fase.preJogo,
                                    );
                                    const gruposFasesJogadas =
                                        agruparItensPorFase(fasesJogadas);
                                    const faseAtual =
                                        fasesJogadas[faseEventosSelecionada] ||
                                        fasesJogadas[0];

                                    const renderizarEvento = (evento, i) => {
                                        const payload =
                                            obterPayloadEvento(evento);
                                        const isTrackedInteraction =
                                            evento.eventType ===
                                            "TrackedInteraction";

                                        const isAcerto =
                                            evento.eventType === "CorrectMatch";
                                        const isErro =
                                            evento.eventType === "WrongMatch";
                                        const isFim =
                                            evento.eventType ===
                                                "PhaseCompleted" ||
                                            evento.eventType === "SessionEnded";

                                        return (
                                            <div
                                                key={`${evento.eventType}-${evento.timestamp}-${i}`}
                                                className={`timeline-item ${isAcerto ? "item-acerto" : ""} ${isErro ? "item-erro" : ""} ${isFim ? "item-fim" : ""}`}
                                            >
                                                <div className="timeline-conteudo">
                                                    <div className="timeline-topo">
                                                        <div className="timeline-tipo">
                                                            {nomeEvento(
                                                                evento.eventType,
                                                                payload,
                                                            )}
                                                        </div>
                                                        <div className="timeline-tempo texto-leve">
                                                            {(
                                                                evento.timestamp /
                                                                1000
                                                            ).toFixed(1)}
                                                            s
                                                        </div>
                                                    </div>

                                                    <div className="timeline-payload">
                                                        {Object.entries(payload)
                                                            .filter(
                                                                ([k]) =>
                                                                    !chavesOcultas.has(
                                                                        k,
                                                                    ) &&
                                                                    !(
                                                                        isTrackedInteraction &&
                                                                        [
                                                                            "displayName",
                                                                            "interactionKind",
                                                                            "action",
                                                                        ].includes(
                                                                            k,
                                                                        )
                                                                    ) &&
                                                                    !(
                                                                        isTrackedInteraction &&
                                                                        payload.interactionKind ===
                                                                            "draggable-object" &&
                                                                        [
                                                                            "x",
                                                                            "y",
                                                                        ].includes(
                                                                            k,
                                                                        )
                                                                    ) &&
                                                                    !(
                                                                        k ===
                                                                            "options" &&
                                                                        evento.eventType ===
                                                                            "PhaseStarted"
                                                                    ) &&
                                                                    payload[k] !==
                                                                        "" &&
                                                                    payload[k] !==
                                                                        null &&
                                                                    payload[k] !==
                                                                        undefined &&
                                                                    !(
                                                                        Array.isArray(
                                                                            payload[
                                                                                k
                                                                            ],
                                                                        ) &&
                                                                        payload[
                                                                            k
                                                                        ]
                                                                            .length ===
                                                                            0
                                                                    ),
                                                            )
                                                            .map(([k, v]) => (
                                                                <span
                                                                    key={k}
                                                                    className="payload-chip"
                                                                >
                                                                    {nomeCampo(
                                                                        k,
                                                                    )}
                                                                    :{" "}
                                                                    <strong>
                                                                        {nomeValorCampo(
                                                                            k,
                                                                            v,
                                                                        )}
                                                                    </strong>
                                                                </span>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    };

                                    if (fasesJogadas.length === 0) {
                                        const eventos =
                                            preJogo?.eventos || [];

                                        return eventos.length > 0 ? (
                                            <div className="timeline">
                                                {eventos.map(renderizarEvento)}
                                            </div>
                                        ) : (
                                            <p className="texto-leve">
                                                Esta sessão não possui eventos
                                                semânticos registrados.
                                            </p>
                                        );
                                    }

                                    return (
                                        <>
                                            {preJogo?.eventos?.length > 0 && (
                                                <div className="fase-bloco fase-bloco-pre">
                                                    {preJogo.eventos.map(
                                                        renderizarEvento,
                                                    )}
                                                </div>
                                            )}

                                            {gruposFasesJogadas.map((grupo) => (
                                                <div
                                                    className="recortes-grupo sequencia-recortes-grupo"
                                                    key={grupo.chave}
                                                >
                                                    <div className="recortes-grupo-cabecalho">
                                                        <strong>
                                                            {grupo.faseNome}
                                                        </strong>
                                                        {grupo.categoria && (
                                                            <span>
                                                                Categoria: {grupo.categoria}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {grupo.eventosFase.length >
                                                        0 && (
                                                        <div className="eventos-da-fase">
                                                            {grupo.eventosFase.map(
                                                                renderizarEvento,
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="eventos-fase-tabs">
                                                        {grupo.itens.map(
                                                            (fase) => (
                                                                <button
                                                                    key={`${fase.targetItem}-${fase.timestamp}-${fase.indiceGlobal}`}
                                                                    type="button"
                                                                    className={
                                                                        faseEventosSelecionada ===
                                                                        fase.indiceGlobal
                                                                            ? "eventos-fase-tab ativo"
                                                                            : "eventos-fase-tab"
                                                                    }
                                                                    title={
                                                                        fase.contextName
                                                                            ? `${fase.nome}: ${fase.contextName}`
                                                                            : fase.nome
                                                                    }
                                                                    onClick={() => {
                                                                        setFaseEventosSelecionada(
                                                                            fase.indiceGlobal,
                                                                        );
                                                                        setFaseSelecionada(
                                                                            fase.indiceGlobal,
                                                                        );
                                                                    }}
                                                                >
                                                                    <span
                                                                        className="eventos-fase-cor"
                                                                        style={{
                                                                            background:
                                                                                obterCorFase(
                                                                                    fase.indiceGlobal,
                                                                                )
                                                                                    .linha,
                                                                        }}
                                                                    />
                                                                    {fase.nome}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {faseAtual && (
                                                <div className="fase-bloco">
                                                    <div className="fase-cabecalho">
                                                        <span className="fase-numero">
                                                            {faseAtual.nome ||
                                                                `Fase ${faseEventosSelecionada + 1}`}
                                                        </span>
                                                        {faseAtual.contextName && (
                                                            <span className="atividade-contexto">
                                                                {faseAtual.contextName}
                                                            </span>
                                                        )}
                                                        <span className="fase-alvo">
                                                            {faseAtual.targetLabel ||
                                                                "Item alvo"}
                                                            :{" "}
                                                            <strong>
                                                                {
                                                                    faseAtual.targetItem
                                                                }
                                                            </strong>
                                                        </span>
                                                        <span
                                                            className="texto-leve"
                                                            style={{
                                                                fontSize:
                                                                    "0.75rem",
                                                            }}
                                                        >
                                                            {(
                                                                faseAtual.timestamp /
                                                                1000
                                                            ).toFixed(1)}
                                                            s
                                                        </span>
                                                    </div>

                                                    {faseAtual.options.length >
                                                        0 && (
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
                                                            {faseAtual.options.map(
                                                                (op, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={`opcao-chip ${op === faseAtual.targetItem ? "opcao-correta" : ""}`}
                                                                    >
                                                                        {op}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                    {faseAtual.eventos.map(
                                                        renderizarEvento,
                                                    )}
                                                    {faseAtual.eventos.length ===
                                                        0 && (
                                                        <p className="texto-leve fase-sem-eventos">
                                                            Nenhum evento
                                                            semântico foi
                                                            registrado neste
                                                            recorte.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
