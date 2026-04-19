// =============================================================================
// PerfilJogador.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de perfil individual do jogador.
// Mostra métricas consolidadas e histórico de sessões.
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { resumoJogador, historicoJogador } from "../services/api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import "./PerfilJogador.css";

export default function PerfilJogador() {
    const { playerId } = useParams();
    const navegar = useNavigate();
    const nomeDecoded = decodeURIComponent(playerId);

    const [resumo, setResumo] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        Promise.all([resumoJogador(nomeDecoded), historicoJogador(nomeDecoded)])
            .then(([resResumo, resSessoes]) => {
                setResumo(resResumo.data);
                setSessoes(resSessoes.data.sessoes || []);
                setCarregando(false);
            })
            .catch(() => {
                setErro("Não foi possível carregar o perfil do jogador.");
                setCarregando(false);
            });
    }, [nomeDecoded]);

    // Formata duração em segundos para exibição
    const formatarDuracao = (ms) => {
        if (!ms) return "0s";
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}s`;
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    };

    // Formata data para exibição
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

    return (
        <div>
            <Header
                titulo={nomeDecoded}
                subtitulo="Perfil individual do jogador"
            />

            <div className="pagina-conteudo">
                {/* Botão voltar */}
                <button className="btn-voltar" onClick={() => navegar("/")}>
                    ← Voltar
                </button>

                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando perfil...</p>
                    </div>
                )}

                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {!carregando && !erro && resumo && (
                    <>
                        {/* Cards de métricas */}
                        <div className="grid-metricas">
                            <div className="card card-metrica">
                                <span className="metrica-icone">🎮</span>
                                <div className="metrica-valor">
                                    {resumo.totalSessoes}
                                </div>
                                <div className="metrica-label">Sessões</div>
                            </div>
                            <div className="card card-metrica">
                                <span className="metrica-icone">✅</span>
                                <div className="metrica-valor texto-verde">
                                    {resumo.totalCorrect}
                                </div>
                                <div className="metrica-label">Acertos</div>
                            </div>
                            <div className="card card-metrica">
                                <span className="metrica-icone">❌</span>
                                <div
                                    className="metrica-valor"
                                    style={{ color: "var(--cor-erro)" }}
                                >
                                    {resumo.totalWrong}
                                </div>
                                <div className="metrica-label">Erros</div>
                            </div>
                            <div className="card card-metrica destaque">
                                <span className="metrica-icone">🎯</span>
                                <div className="metrica-valor">
                                    {resumo.taxaAcerto}
                                </div>
                                <div className="metrica-label">
                                    Taxa de Acerto
                                </div>
                            </div>
                            <div className="card card-metrica">
                                <span className="metrica-icone">⏱️</span>
                                <div className="metrica-valor">
                                    {formatarDuracao(resumo.totalDuracaoMs)}
                                </div>
                                <div className="metrica-label">Tempo Total</div>
                            </div>
                            <div className="card card-metrica">
                                <span className="metrica-icone">💤</span>
                                <div className="metrica-valor">
                                    {resumo.totalInatividade}
                                </div>
                                <div className="metrica-label">
                                    Inatividades
                                </div>
                            </div>
                        </div>

                        {/* Categorias jogadas */}
                        {Object.keys(resumo.categorias).length > 0 && (
                            <div className="card secao-card">
                                <h3>Categorias Jogadas</h3>
                                <div className="grid-categorias">
                                    {Object.entries(resumo.categorias).map(
                                        ([cat, qtd]) => (
                                            <div
                                                key={cat}
                                                className="chip-categoria"
                                            >
                                                <span>{cat}</span>
                                                <span className="chip-qtd">
                                                    {qtd}x
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Gráfico de evolução */}
                        {resumo.evolucaoTemporal.length > 1 && (
                            <div className="card secao-card">
                                <h3>Evolução ao Longo do Tempo</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={resumo.evolucaoTemporal}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#E2D9CE"
                                        />
                                        <XAxis
                                            dataKey="startedAt"
                                            tickFormatter={(v) =>
                                                new Date(v).toLocaleDateString(
                                                    "pt-BR",
                                                )
                                            }
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            labelFormatter={(v) =>
                                                formatarData(v)
                                            }
                                            formatter={(val, name) => [
                                                val,
                                                name === "totalCorrect"
                                                    ? "Acertos"
                                                    : "Erros",
                                            ]}
                                        />
                                        <Legend
                                            formatter={(v) =>
                                                v === "totalCorrect"
                                                    ? "Acertos"
                                                    : "Erros"
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="totalCorrect"
                                            stroke="#4ECBA0"
                                            strokeWidth={2}
                                            dot
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="totalWrong"
                                            stroke="#FC8181"
                                            strokeWidth={2}
                                            dot
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Histórico de sessões */}
                        <div className="card secao-card">
                            <h3>Histórico de Sessões</h3>
                            <div className="lista-sessoes">
                                {sessoes.map((sessao) => (
                                    <div
                                        key={sessao.sessionId}
                                        className="item-sessao"
                                        onClick={() =>
                                            navegar(
                                                `/sessao/${sessao.sessionId}`,
                                            )
                                        }
                                    >
                                        <div className="sessao-info">
                                            <span className="sessao-data">
                                                {formatarData(sessao.startedAt)}
                                            </span>
                                            <span className="texto-leve sessao-id">
                                                {sessao.sessionId.substring(
                                                    0,
                                                    8,
                                                )}
                                                ...
                                            </span>
                                        </div>
                                        <div className="sessao-metricas">
                                            <span className="chip-acerto">
                                                ✅{" "}
                                                {sessao.metrics?.totalCorrect ||
                                                    0}
                                            </span>
                                            <span className="chip-erro">
                                                ❌{" "}
                                                {sessao.metrics?.totalWrong ||
                                                    0}
                                            </span>
                                            <span className="texto-leve">
                                                {formatarDuracao(
                                                    sessao.durationMs,
                                                )}
                                            </span>
                                        </div>
                                        <span className="jogador-seta">→</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
