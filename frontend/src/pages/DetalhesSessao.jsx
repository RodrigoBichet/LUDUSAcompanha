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

    // Desenha o heatmap no canvas após carregar os dados
    useEffect(() => {
        if (!heatmap || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        // Fundo escuro
        ctx.fillStyle = "#1C2B3A";
        ctx.fillRect(0, 0, W, H);

        // Encontra limites dos dados para normalizar
        const pontos = heatmap.mousePath || [];
        if (pontos.length === 0) return;

        const xs = pontos.map((p) => p.x);
        const ys = pontos.map((p) => p.y);
        const minX = Math.min(...xs),
            maxX = Math.max(...xs);
        const minY = Math.min(...ys),
            maxY = Math.max(...ys);

        // Normaliza coordenadas para o canvas
        const norm = (v, min, max, tamanho) =>
            max === min ? tamanho / 2 : ((v - min) / (max - min)) * tamanho;

        // Desenha caminho do mouse
        if (pontos.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(78,203,160,0.3)";
            ctx.lineWidth = 1.5;
            pontos.forEach((p, i) => {
                const x = norm(p.x, minX, maxX, W);
                const y = norm(p.y, minY, maxY, H);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Desenha pontos de calor (mousePath)
        pontos.forEach((p) => {
            const x = norm(p.x, minX, maxX, W);
            const y = norm(p.y, minY, maxY, H);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 18);
            grad.addColorStop(0, "rgba(78,203,160,0.25)");
            grad.addColorStop(1, "rgba(78,203,160,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();
        });

        // Desenha cliques (pontos maiores e mais intensos)
        const cliques = heatmap.clicks || [];
        cliques.forEach((c) => {
            const x = norm(c.x, minX, maxX, W);
            const y = norm(c.y, minY, maxY, H);
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 28);
            grad.addColorStop(0, "rgba(252,129,129,0.6)");
            grad.addColorStop(0.5, "rgba(246,173,85,0.3)");
            grad.addColorStop(1, "rgba(252,129,129,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 28, 0, Math.PI * 2);
            ctx.fill();

            // Ponto central do clique
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [heatmap]);

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

    // Ícone por tipo de evento
    const iconeEvento = (tipo) => {
        const mapa = {
            CategorySelected: "📂",
            PhaseStarted: "▶️",
            DragAttempt: "🖐️",
            CorrectMatch: "✅",
            WrongMatch: "❌",
            PhaseCompleted: "🏁",
            InactivityDetected: "💤",
            SessionEnded: "🔚",
        };
        return mapa[tipo] || "📌";
    };

    return (
        <div>
            <Header titulo="Detalhes da Sessão" subtitulo={sessionId} />

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
                                <h3>Mapa de Interações</h3>
                                <p
                                    className="texto-leve"
                                    style={{ marginBottom: "1rem" }}
                                >
                                    🟢 Caminho do mouse &nbsp;|&nbsp; 🔴 Cliques
                                </p>
                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={300}
                                    className="canvas-heatmap"
                                />
                            </div>
                        </div>

                        {/* Coluna direita — eventos */}
                        <div className="detalhes-coluna">
                            <div className="card secao-card">
                                <h3>Linha do Tempo de Eventos</h3>
                                <div className="timeline">
                                    {(sessao.gameEvents || []).map(
                                        (evento, i) => {
                                            let payload = {};
                                            try {
                                                payload = JSON.parse(
                                                    evento.payload,
                                                );
                                            } catch (_) {}

                                            return (
                                                <div
                                                    key={i}
                                                    className="timeline-item"
                                                >
                                                    <div className="timeline-icone">
                                                        {iconeEvento(
                                                            evento.eventType,
                                                        )}
                                                    </div>
                                                    <div className="timeline-conteudo">
                                                        <div className="timeline-tipo">
                                                            {evento.eventType}
                                                        </div>
                                                        <div className="timeline-tempo texto-leve">
                                                            {(
                                                                evento.timestamp /
                                                                1000
                                                            ).toFixed(1)}
                                                            s
                                                        </div>
                                                        {Object.keys(payload)
                                                            .length > 0 && (
                                                            <div className="timeline-payload">
                                                                {Object.entries(
                                                                    payload,
                                                                ).map(
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
                                                                            {k}:{" "}
                                                                            <strong>
                                                                                {String(
                                                                                    v,
                                                                                )}
                                                                            </strong>
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
