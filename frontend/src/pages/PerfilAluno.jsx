// =============================================================================
// PerfilAluno.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de perfil completo do aluno.
// Dados cadastrais, anotações do professor e monitoramento.
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
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
import {
    buscarAluno,
    atualizarAluno,
    adicionarAnotacao,
    deletarAnotacao,
    resumoJogador,
    buscarSessao,
    historicoJogador,
    alertasAluno,
} from "../services/api";
import "./PerfilAluno.css";
import { useRef } from "react";
import RelatorioPDF from "../components/shared/RelatorioPDF";

export default function PerfilAluno() {
    const { id } = useParams();
    const navegar = useNavigate();

    const [aluno, setAluno] = useState(null);
    const [resumo, setResumo] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Edição de dados
    const [editando, setEditando] = useState(false);
    const [formAluno, setFormAluno] = useState({});
    const [salvando, setSalvando] = useState(false);

    // Anotações
    const [novaAnotacao, setNovaAnotacao] = useState("");
    const [salvandoAnot, setSalvandoAnot] = useState(false);

    useEffect(() => {
        carregarDados();
    }, [id]);

    //Alertas
    const [alertas, setAlertas] = useState([]);

    //PDF
    const refRelatorio = useRef(null);

    //Usuario
    const { usuario } = useAuth();

    const carregarDados = async () => {
        try {
            setCarregando(true);
            const resAluno = await buscarAluno(id);
            const aluno = resAluno.data.aluno;
            setAluno(aluno);
            setFormAluno({
                name: aluno.name,
                birthDate: aluno.birthDate?.split("T")[0] || "",
                supportLevel: aluno.supportLevel || "Não informado",
                otherConditions: aluno.otherConditions || "",
                guardianName: aluno.guardianName || "",
                guardianContact: aluno.guardianContact || "",
            });

            // Busca dados de monitoramento pelo nome do aluno
            try {
                const [resResumo, resSessoes, resAlertas] = await Promise.all([
                    resumoJogador(aluno.name),
                    historicoJogador(aluno.name),
                    alertasAluno(aluno.name),
                ]);
                console.log("RESUMO:", resResumo.data);
                console.log("SESSOES:", resSessoes.data);
                console.log("ALERTAS:", resAlertas.data);
                setResumo(resResumo.data);
                setSessoes(resSessoes.data.sessoes || []);
                setAlertas(resAlertas.data.alertas || []);
            } catch (err) {
                console.log("ERRO MONITORAMENTO:", err);
                setResumo(null);
                setSessoes([]);
                setAlertas([]);
            }
        } catch {
            setErro("Erro ao carregar perfil do aluno.");
        } finally {
            setCarregando(false);
        }
    };

    const calcularIdade = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
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

    const indicadorDesempenho = () => {
        if (!resumo) return null;
        const taxa = parseFloat(resumo.taxaAcerto);
        if (taxa >= 75)
            return { cor: "#4ECBA0", icone: "🟢", label: "Bom desempenho" };
        if (taxa >= 50)
            return { cor: "#F6AD55", icone: "🟡", label: "Desempenho regular" };
        return { cor: "#FC8181", icone: "🔴", label: "Requer atenção" };
    };

    const handleSalvarDados = async (e) => {
        e.preventDefault();
        try {
            setSalvando(true);
            await atualizarAluno(id, formAluno);
            setEditando(false);
            carregarDados();
        } catch {
            alert("Erro ao salvar dados.");
        } finally {
            setSalvando(false);
        }
    };

    const handleAdicionarAnotacao = async (e) => {
        e.preventDefault();
        if (!novaAnotacao.trim()) return;
        try {
            setSalvandoAnot(true);
            await adicionarAnotacao(id, novaAnotacao.trim());
            setNovaAnotacao("");
            carregarDados();
        } catch {
            alert("Erro ao adicionar anotação.");
        } finally {
            setSalvandoAnot(false);
        }
    };

    const handleDeletarAnotacao = async (anotacaoId) => {
        if (!window.confirm("Remover esta anotação?")) return;
        try {
            await deletarAnotacao(id, anotacaoId);
            carregarDados();
        } catch {
            alert("Erro ao remover anotação.");
        }
    };

    const desempenho = indicadorDesempenho();

    const traduzirCategoria = (cat) => {
        const mapa = {
            Fase01: "Ações",
            Fase02: "Alimentos",
            Fase03: "Cotidiano",
            Fase04: "Diversão",
            Fase05: "Higiene",
        };
        return mapa[cat] || cat;
    };

    // Extrai o nome da categoria a partir dos gameEvents da sessão
    const extrairCategoria = (sessao) => {
        if (!sessao.gameEvents || sessao.gameEvents.length === 0) return null;
        const evento = sessao.gameEvents.find(
            (e) => e.eventType === "CategorySelected",
        );
        if (!evento) return null;
        try {
            const payload = JSON.parse(evento.payload);
            return payload.category || null;
        } catch {
            return null;
        }
    };

    const gerarPDF = async () => {
        const elemento = document.getElementById("relatorio-pdf");
        if (!elemento) return;

        const html2pdf = (await import("html2pdf.js")).default;

        const opcoes = {
            margin: 10,
            filename: `Relatorio_${aluno?.name}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        html2pdf().set(opcoes).from(elemento).save();
    };

    return (
        <div>
            <Header
                titulo={aluno?.name || "Perfil do Aluno"}
                subtitulo="Dados cadastrais, anotações e monitoramento"
            />

            <div className="pagina-conteudo">
                <button className="btn-voltar" onClick={() => navegar(-1)}>
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

                {!carregando && !erro && aluno && (
                    <div className="perfil-layout">
                        {/* ===== COLUNA ESQUERDA ===== */}
                        <div className="perfil-coluna">
                            {/* Dados do aluno */}
                            <div className="card secao-card">
                                <div className="perfil-cabecalho">
                                    <div className="perfil-avatar">
                                        {aluno.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="perfil-ident">
                                        <h2>{aluno.name}</h2>
                                        {calcularIdade(aluno.birthDate) !==
                                            null && (
                                            <p className="texto-leve">
                                                {calcularIdade(aluno.birthDate)}{" "}
                                                anos
                                            </p>
                                        )}
                                        {desempenho && (
                                            <span
                                                className="chip-desempenho"
                                                style={{
                                                    color: desempenho.cor,
                                                }}
                                            >
                                                {desempenho.icone}{" "}
                                                {desempenho.label}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className="btn-editar"
                                        onClick={() => setEditando(!editando)}
                                    >
                                        {editando ? "✕" : "✏️"}
                                    </button>
                                </div>

                                {/* Modo visualização */}
                                {!editando && (
                                    <div className="info-lista">
                                        <div className="info-item">
                                            <span className="texto-leve">
                                                Grau de suporte
                                            </span>
                                            <span>{aluno.supportLevel}</span>
                                        </div>
                                        {aluno.otherConditions && (
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Outras condições
                                                </span>
                                                <span>
                                                    {aluno.otherConditions}
                                                </span>
                                            </div>
                                        )}
                                        {aluno.guardianName && (
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Responsável
                                                </span>
                                                <span>
                                                    {aluno.guardianName}
                                                </span>
                                            </div>
                                        )}
                                        {aluno.guardianContact && (
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Contato
                                                </span>
                                                <span>
                                                    {aluno.guardianContact}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Modo edição */}
                                {editando && (
                                    <form
                                        onSubmit={handleSalvarDados}
                                        className="form-inline"
                                        style={{ marginTop: "1rem" }}
                                    >
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                className="campo-input"
                                                value={formAluno.name}
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Data de nascimento
                                            </label>
                                            <input
                                                type="date"
                                                className="campo-input"
                                                value={formAluno.birthDate}
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        birthDate:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Grau de suporte
                                            </label>
                                            <select
                                                className="campo-input"
                                                value={formAluno.supportLevel}
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        supportLevel:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <option>Não informado</option>
                                                <option>Nível 1</option>
                                                <option>Nível 2</option>
                                                <option>Nível 3</option>
                                            </select>
                                        </div>
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Outras condições
                                            </label>
                                            <input
                                                type="text"
                                                className="campo-input"
                                                value={
                                                    formAluno.otherConditions
                                                }
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        otherConditions:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Responsável
                                            </label>
                                            <input
                                                type="text"
                                                className="campo-input"
                                                value={formAluno.guardianName}
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        guardianName:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campo-grupo">
                                            <label className="campo-label">
                                                Contato
                                            </label>
                                            <input
                                                type="text"
                                                className="campo-input"
                                                value={
                                                    formAluno.guardianContact
                                                }
                                                onChange={(e) =>
                                                    setFormAluno({
                                                        ...formAluno,
                                                        guardianContact:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn-primario"
                                            disabled={salvando}
                                        >
                                            {salvando
                                                ? "Salvando..."
                                                : "Salvar alterações"}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Categorias jogadas */}
                            {resumo &&
                                resumo.categorias &&
                                Object.keys(resumo.categorias).length > 0 && (
                                    <div className="card secao-card">
                                        <h3>Categorias Jogadas</h3>
                                        <div className="grid-categorias">
                                            {Object.entries(
                                                resumo.categorias,
                                            ).map(([cat, qtd]) => (
                                                <div
                                                    key={cat}
                                                    className="chip-categoria"
                                                >
                                                    <span>
                                                        {traduzirCategoria(cat)}
                                                    </span>
                                                    <span className="chip-qtd">
                                                        {qtd}x
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* Alertas pedagógicos */}
                            {alertas.length > 0 && (
                                <div className="card secao-card">
                                    <h3>⚠️ Alertas Pedagógicos</h3>
                                    <div className="lista-alertas">
                                        {alertas.map((alerta, i) => (
                                            <div
                                                key={i}
                                                className={`card-alerta alerta-${alerta.severidade}`}
                                            >
                                                <div className="alerta-cabecalho">
                                                    <span className="alerta-icone">
                                                        {alerta.icone}
                                                    </span>
                                                    <span className="alerta-titulo">
                                                        {alerta.titulo}
                                                    </span>
                                                </div>
                                                <p className="alerta-descricao">
                                                    {alerta.descricao}
                                                </p>
                                                <p className="alerta-sugestao">
                                                    💡 {alerta.sugestao}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sem alertas */}
                            {alertas.length === 0 && resumo && (
                                <div className="card secao-card alerta-ok">
                                    <span>🟢</span>
                                    <p>
                                        Nenhum alerta no momento — aluno com bom
                                        desempenho!
                                    </p>
                                </div>
                            )}

                            {/* Métricas de monitoramento */}
                            {resumo && (
                                <div className="card secao-card">
                                    <h3>Resumo de Monitoramento</h3>
                                    <div className="grid-metricas-mini">
                                        <div className="metrica-mini">
                                            <span className="metrica-mini-valor">
                                                {resumo.totalSessoes}
                                            </span>
                                            <span className="metrica-mini-label">
                                                Sessões
                                            </span>
                                        </div>
                                        <div className="metrica-mini">
                                            <span className="metrica-mini-valor texto-verde">
                                                {resumo.totalCorrect}
                                            </span>
                                            <span className="metrica-mini-label">
                                                Acertos
                                            </span>
                                        </div>
                                        <div className="metrica-mini">
                                            <span
                                                className="metrica-mini-valor"
                                                style={{
                                                    color: "var(--cor-erro)",
                                                }}
                                            >
                                                {resumo.totalWrong}
                                            </span>
                                            <span className="metrica-mini-label">
                                                Erros
                                            </span>
                                        </div>
                                        <div className="metrica-mini destaque">
                                            <span className="metrica-mini-valor">
                                                {resumo.taxaAcerto}
                                            </span>
                                            <span className="metrica-mini-label">
                                                Taxa de Acerto
                                            </span>
                                        </div>
                                    </div>

                                    {/* Última sessão */}
                                    {sessoes.length > 0 && (
                                        <div className="ultima-sessao">
                                            <p className="texto-leve">
                                                Última sessão
                                            </p>
                                            <p className="ultima-sessao-data">
                                                {formatarData(
                                                    sessoes[0].startedAt,
                                                )}
                                            </p>
                                            <div className="ultima-sessao-meta">
                                                <span className="chip-acerto">
                                                    ✅{" "}
                                                    {sessoes[0].metrics
                                                        ?.totalCorrect || 0}
                                                </span>
                                                <span className="chip-erro">
                                                    ❌{" "}
                                                    {sessoes[0].metrics
                                                        ?.totalWrong || 0}
                                                </span>
                                                <span className="texto-leve">
                                                    {formatarDuracao(
                                                        sessoes[0].durationMs,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gráfico de evolução */}
                            {resumo &&
                                resumo.evolucaoTemporal &&
                                resumo.evolucaoTemporal.length > 1 && (
                                    <div className="card secao-card">
                                        <h3>Evolução ao Longo do Tempo</h3>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={220}
                                        >
                                            <LineChart
                                                data={resumo.evolucaoTemporal}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#E2D9CE"
                                                />
                                                <XAxis
                                                    dataKey="startedAt"
                                                    tickFormatter={(v) =>
                                                        new Date(
                                                            v,
                                                        ).toLocaleDateString(
                                                            "pt-BR",
                                                        )
                                                    }
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    labelFormatter={(v) =>
                                                        new Date(
                                                            v,
                                                        ).toLocaleString(
                                                            "pt-BR",
                                                        )
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

                            {/* Sem sessões */}
                            {!resumo && (
                                <div className="card secao-card">
                                    <h3>Monitoramento</h3>
                                    <div
                                        className="estado-vazio"
                                        style={{ padding: "1.5rem 0" }}
                                    >
                                        <span className="estado-vazio-icone">
                                            🎮
                                        </span>
                                        <p>Nenhuma sessão registrada ainda.</p>
                                        <p className="texto-leve">
                                            Os dados aparecerão após o aluno
                                            jogar.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ===== COLUNA DIREITA ===== */}
                        <div className="perfil-coluna">
                            {/* Anotações */}
                            <div className="card secao-card">
                                <h3>📝 Anotações do Professor</h3>

                                {/* Nova anotação */}
                                <form
                                    onSubmit={handleAdicionarAnotacao}
                                    className="form-anotacao"
                                >
                                    <textarea
                                        className="campo-textarea"
                                        placeholder="Escreva uma observação sobre este aluno..."
                                        value={novaAnotacao}
                                        onChange={(e) =>
                                            setNovaAnotacao(e.target.value)
                                        }
                                        disabled={salvandoAnot}
                                        rows={3}
                                    />
                                    <button
                                        type="submit"
                                        className="btn-primario"
                                        disabled={
                                            salvandoAnot || !novaAnotacao.trim()
                                        }
                                    >
                                        {salvandoAnot
                                            ? "Salvando..."
                                            : "+ Adicionar Anotação"}
                                    </button>
                                </form>

                                {/* Lista de anotações */}
                                <div className="lista-anotacoes">
                                    {aluno.anotacoes?.length === 0 && (
                                        <p
                                            className="texto-leve"
                                            style={{
                                                textAlign: "center",
                                                padding: "1rem 0",
                                            }}
                                        >
                                            Nenhuma anotação ainda.
                                        </p>
                                    )}
                                    {[...(aluno.anotacoes || [])]
                                        .reverse()
                                        .map((anot) => (
                                            <div
                                                key={anot._id}
                                                className="card-anotacao"
                                            >
                                                <div className="anotacao-cabecalho">
                                                    <span className="anotacao-autor">
                                                        {anot.autorNome}
                                                    </span>
                                                    <span className="texto-leve anotacao-data">
                                                        {formatarData(
                                                            anot.createdAt,
                                                        )}
                                                    </span>
                                                    <button
                                                        className="btn-deletar-anot"
                                                        onClick={() =>
                                                            handleDeletarAnotacao(
                                                                anot._id,
                                                            )
                                                        }
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <p className="anotacao-texto">
                                                    {anot.texto}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Histórico de sessões */}
                            {sessoes.length > 0 && (
                                <div className="card secao-card">
                                    <h3>Histórico de Sessões</h3>
                                    <div className="lista-sessoes">
                                        {sessoes.map((sessao) => {
                                            const categoria =
                                                extrairCategoria(sessao);
                                            return (
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
                                                        {/* Categoria em destaque ou fallback */}
                                                        <span className="sessao-categoria">
                                                            🎮{" "}
                                                            {categoria ||
                                                                "Sessão de jogo"}
                                                        </span>
                                                        {/* Data menor, secundária */}
                                                        <span className="texto-leve sessao-data-menor">
                                                            {formatarData(
                                                                sessao.startedAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="sessao-metricas">
                                                        <span className="chip-acerto">
                                                            ✅{" "}
                                                            {sessao.metrics
                                                                ?.totalCorrect ||
                                                                0}
                                                        </span>
                                                        <span className="chip-erro">
                                                            ❌{" "}
                                                            {sessao.metrics
                                                                ?.totalWrong ||
                                                                0}
                                                        </span>
                                                        <span className="texto-leve">
                                                            {formatarDuracao(
                                                                sessao.durationMs,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <span className="jogador-seta">
                                                        →
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Botão de gerar PDF */}
                {aluno && resumo && (
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        <button className="btn-pdf" onClick={gerarPDF}>
                            📄 Gerar Relatório PDF
                        </button>
                    </div>
                )}

                {/* Template do PDF — invisível na tela */}
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <RelatorioPDF
                        aluno={aluno}
                        resumo={resumo}
                        sessoes={sessoes}
                        alertas={alertas}
                        professor={usuario}
                    />
                </div>
            </div>
        </div>
    );
}
