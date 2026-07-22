// =============================================================================
// PerfilAluno.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de perfil completo do aluno.
// Dados cadastrais, anotações do professor e monitoramento.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
    resumoAluno,
    historicoAluno,
    alertasAluno,
    solicitarCaptura,
    previsualizarImportacaoSessao,
    confirmarImportacaoSessao,
    criarJogoDetectado,
} from "../services/api";
import "./PerfilAluno.css";
import RelatorioPDF from "../components/shared/RelatorioPDF";
import { MODO_ANONIMO } from "../config/modoAnonimo";

export default function PerfilAluno() {
    const { id } = useParams();
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();

    const gameIdSelecionado = searchParams.get("gameId");
    const importacaoPronta = searchParams.get("importacaoPronta") === "1";

    const [aluno, setAluno] = useState(null);
    const [resumo, setResumo] = useState(null);
    const [sessoes, setSessoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [agora] = useState(() => Date.now());
    const [erro, setErro] = useState(null);

    // Edição de dados
    const [editando, setEditando] = useState(false);
    const [formAluno, setFormAluno] = useState({});
    const [salvando, setSalvando] = useState(false);

    // Anotações
    const [novaAnotacao, setNovaAnotacao] = useState("");
    const [salvandoAnot, setSalvandoAnot] = useState(false);

    // Captura de screenshots
    const [solicitandoCaptura, setSolicitandoCaptura] = useState(false);

    const [modalCaptura, setModalCaptura] = useState(null);

    // Importação de telemetria: o arquivo permanece somente no estado do navegador
    // até a confirmação explícita da pessoa usuária.
    const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
    const [sessaoParaImportar, setSessaoParaImportar] = useState(null);
    const [nomeArquivoImportacao, setNomeArquivoImportacao] = useState("");
    const [previewImportacao, setPreviewImportacao] = useState(null);
    const [erroImportacao, setErroImportacao] = useState("");
    const [jogoIncompativel, setJogoIncompativel] = useState(null);
    const [criandoJogoDetectado, setCriandoJogoDetectado] = useState(false);
    const [jogoDetectadoJaCadastrado, setJogoDetectadoJaCadastrado] =
        useState(null);
    const [sucessoImportacao, setSucessoImportacao] = useState("");
    const [processandoImportacao, setProcessandoImportacao] = useState(false);
    const [modalOrientacaoImportacao, setModalOrientacaoImportacao] =
        useState(importacaoPronta);

    //Alertas
    const [alertas, setAlertas] = useState([]);

    //Usuario
    const { usuario } = useAuth();

    const temDadosDesempenho = resumo?.temDadosDesempenho === true;
    const evolucaoComDesempenho =
        resumo?.evolucaoTemporal?.filter(
            (sessao) => sessao.temDadosDesempenho,
        ) || [];
    const sessaoTemDadosDesempenho = (sessao) =>
        sessao?.capabilities?.correctWrong !== false;

    const carregarDados = useCallback(async () => {
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

            // Busca dados de monitoramento pelo ID do aluno
            try {
                const [resResumo, resSessoes, resAlertas] = await Promise.all([
                    resumoAluno(aluno._id, gameIdSelecionado),
                    historicoAluno(aluno._id, gameIdSelecionado),
                    alertasAluno(aluno._id, gameIdSelecionado),
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
    }, [id, gameIdSelecionado]);

    useEffect(() => {
        const iniciarCarregamento = async () => {
            await carregarDados();
        };

        iniciarCarregamento();
    }, [carregarDados]);

    const calcularIdade = (birthDate) => {
        if (!birthDate) return null;
        const diff = agora - new Date(birthDate).getTime();
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
            return {
                cor: "#4ECBA0",
                icone: "🟢",
                label: "Indicadores positivos",
            };
        if (taxa >= 50)
            return { cor: "#F6AD55", icone: "🟡", label: "Em desenvolvimento" };
        return { cor: "#FC8181", icone: "🔴", label: "Sugere atenção" };
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

    const handleSolicitarCaptura = async () => {
        if (!aluno?._id) return;

        if (
            aluno.capturaSolicitada &&
            aluno.capturaSolicitadaOrigem === "unity"
        ) {
            setModalCaptura({
                titulo: "Imagem já ativada no jogo",
                mensagem:
                    "A imagem no mapa de calor já foi ativada no jogo. Aguarde a próxima sessão ser registrada ou desative a opção no jogo.",
            });

            return;
        }

        const novoEstado = !aluno.capturaSolicitada;

        try {
            setSolicitandoCaptura(true);

            const resposta = await solicitarCaptura(aluno._id, novoEstado);

            setAluno((alunoAtual) => ({
                ...alunoAtual,
                capturaSolicitada: resposta.data.capturaSolicitada,
                capturaSolicitadaOrigem: resposta.data.capturaSolicitadaOrigem,
            }));
        } catch (erro) {
            setModalCaptura({
                titulo: "Não foi possível salvar",
                mensagem:
                    erro.response?.data?.mensagem ||
                    "Não foi possível atualizar a imagem no mapa de calor.",
            });
        } finally {
            setSolicitandoCaptura(false);
        }
    };

    const abrirImportacao = () => {
        setModalImportacaoAberto(true);
        setSessaoParaImportar(null);
        setNomeArquivoImportacao("");
        setPreviewImportacao(null);
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
    };

    const handleArquivoImportacao = async (evento) => {
        const arquivo = evento.target.files?.[0];
        setPreviewImportacao(null);
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
        setSessaoParaImportar(null);
        setNomeArquivoImportacao(arquivo?.name || "");

        if (!arquivo) return;

        try {
            const conteudo = await arquivo.text();
            const sessao = JSON.parse(conteudo);

            if (
                !sessao ||
                Array.isArray(sessao) ||
                typeof sessao !== "object"
            ) {
                throw new Error(
                    "O arquivo deve conter um objeto JSON de sessão.",
                );
            }

            setSessaoParaImportar(sessao);
        } catch (erro) {
            setErroImportacao(
                erro.message ||
                    "Não foi possível ler o arquivo JSON selecionado.",
            );
        }
    };

    const handlePrevisualizarImportacao = async () => {
        if (!sessaoParaImportar || !aluno?._id) return;

        try {
            setProcessandoImportacao(true);
            setErroImportacao("");
            setJogoIncompativel(null);
            setJogoDetectadoJaCadastrado(null);
            const resposta = await previsualizarImportacaoSessao(
                aluno._id,
                sessaoParaImportar,
                gameIdSelecionado,
            );
            setPreviewImportacao(resposta.data.preview);
        } catch (erro) {
            setPreviewImportacao(null);
            setJogoIncompativel(
                erro.response?.data?.codigo === "JOGO_INCOMPATIVEL"
                    ? erro.response.data.jogoDetectado
                    : null,
            );
            setErroImportacao(
                erro.response?.data?.mensagem ||
                    "Não foi possível validar a sessão para importação.",
            );
        } finally {
            setProcessandoImportacao(false);
        }
    };

    const handleConfirmarImportacao = async () => {
        if (!sessaoParaImportar || !previewImportacao || !aluno?._id) return;

        if (previewImportacao.jaRegistrada) {
            setErroImportacao(
                "Esta sessão já está registrada para este aluno.",
            );
            return;
        }

        try {
            setProcessandoImportacao(true);
            setErroImportacao("");
            const resposta = await confirmarImportacaoSessao(
                aluno._id,
                sessaoParaImportar,
                gameIdSelecionado,
            );

            await carregarDados();
            const nomeJogoAssociado = resposta.data?.jogo?.name;
            setSucessoImportacao(
                nomeJogoAssociado
                    ? `Sessão importada com sucesso. O aluno foi associado ao jogo “${nomeJogoAssociado}”.`
                    : "Sessão importada com sucesso. O histórico do aluno foi atualizado.",
            );
        } catch (erro) {
            setJogoIncompativel(
                erro.response?.data?.codigo === "JOGO_INCOMPATIVEL"
                    ? erro.response.data.jogoDetectado
                    : null,
            );
            setErroImportacao(
                erro.response?.data?.mensagem ||
                    "Não foi possível confirmar a importação.",
            );
        } finally {
            setProcessandoImportacao(false);
        }
    };

    const handleCriarJogoDetectado = async (evento) => {
        evento.preventDefault();
        if (!jogoIncompativel) return;

        try {
            setCriandoJogoDetectado(true);
            setErroImportacao("");
            const resposta = await criarJogoDetectado({
                name: jogoIncompativel.nome,
                gameId: jogoIncompativel.gameId,
            });
            const jogo = resposta.data.jogo;
            if (!resposta.data.criado) {
                setJogoDetectadoJaCadastrado(jogo);
                return;
            }

            continuarParaCadastroNoJogo(jogo);
        } catch (erro) {
            setErroImportacao(
                erro.response?.data?.mensagem ||
                    "Não foi possível cadastrar o jogo detectado.",
            );
        } finally {
            setCriandoJogoDetectado(false);
        }
    };

    const continuarParaCadastroNoJogo = (jogo) => {
        const parametros = new URLSearchParams({
            novoAluno: aluno.name,
            origem: "importacao",
        });
        navegar(
            `/jogos/${encodeURIComponent(jogo.gameId)}/alunos?${parametros.toString()}`,
        );
    };

    const capturaAtivaPelaUnity =
        aluno?.capturaSolicitada && aluno?.capturaSolicitadaOrigem === "unity";

    const textoCaptura = capturaAtivaPelaUnity
        ? "Ativado no jogo: a próxima sessão deste aluno mostrará as imagens das fases junto ao mapa de calor."
        : aluno?.capturaSolicitada
          ? "Ativado nesta tela: a próxima sessão deste aluno mostrará as imagens das fases junto ao mapa de calor."
          : "Ative para mostrar as imagens da próxima sessão junto ao mapa de calor.";

    const textoBotaoCaptura = solicitandoCaptura
        ? "Salvando..."
        : capturaAtivaPelaUnity
          ? "Ativado no jogo"
          : aluno?.capturaSolicitada
            ? "Desativar imagem"
            : "Ativar imagem";

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

    const montarUrlSessao = (sessionId) => {
        const params = new URLSearchParams();

        if (gameIdSelecionado) {
            params.set("gameId", gameIdSelecionado);
        }

        const query = params.toString();

        return query ? `/sessao/${sessionId}?${query}` : `/sessao/${sessionId}`;
    };

    const gerarPDF = async () => {
        const elemento = document.getElementById("relatorio-pdf");
        if (!elemento) return;

        const html2pdf = (await import("html2pdf.js")).default;

        const dataRelatorio = new Date()
            .toLocaleDateString("pt-BR")
            .replace(/\//g, "-");

        const sufixoAnonimo = MODO_ANONIMO ? "_anonimo" : "";

        const nomeAlunoArquivo = aluno?.name || "Aluno";

        const opcoes = {
            margin: 10,
            filename: `Relatorio_${nomeAlunoArquivo}_${dataRelatorio}${sufixoAnonimo}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        html2pdf().set(opcoes).from(elemento).save();
    };

    const fecharOrientacaoImportacao = () => {
        setModalOrientacaoImportacao(false);
        const parametros = new URLSearchParams();
        if (gameIdSelecionado) parametros.set("gameId", gameIdSelecionado);
        const query = parametros.toString();
        navegar(`/aluno/${id}${query ? `?${query}` : ""}`, { replace: true });
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
                                                Nível de suporte relacionado ao
                                                TEA
                                            </span>
                                            <span>{aluno.supportLevel}</span>
                                        </div>
                                        {aluno.otherConditions && (
                                            <div className="info-item">
                                                <span className="texto-leve">
                                                    Outras condições ou
                                                    informações relevantes
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

                                {!editando && (
                                    <div
                                        className={
                                            aluno.capturaSolicitada
                                                ? "captura-card captura-card-ativo"
                                                : "captura-card"
                                        }
                                    >
                                        <div className="captura-card-icone">
                                            🖼️
                                        </div>

                                        <div className="captura-card-texto">
                                            <strong>
                                                Salvar imagem da próxima sessão
                                            </strong>
                                            <p className="texto-leve">
                                                {textoCaptura}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className={
                                                aluno.capturaSolicitada
                                                    ? "btn-captura ativo"
                                                    : "btn-captura"
                                            }
                                            onClick={handleSolicitarCaptura}
                                            disabled={
                                                solicitandoCaptura ||
                                                capturaAtivaPelaUnity
                                            }
                                        >
                                            {textoBotaoCaptura}
                                        </button>
                                    </div>
                                )}

                                {!editando && (
                                    <div className="importacao-card">
                                        <div className="captura-card-icone">
                                            📥
                                        </div>
                                        <div className="captura-card-texto">
                                            <strong>Importar telemetria</strong>
                                            <p className="texto-leve">
                                                Valide um arquivo JSON antes de
                                                registrá-lo para este aluno.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-captura"
                                            onClick={abrirImportacao}
                                        >
                                            Importar JSON
                                        </button>
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
                                                Nível de suporte relacionado ao
                                                TEA
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
                                                Outras condições ou informações
                                                relevantes (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                className="campo-input"
                                                placeholder="Ex.: TDAH, síndrome de Down ou informação compartilhada pela família/escola"
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
                                    <h3>Indicadores Pedagógicos</h3>
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
                                        {temDadosDesempenho
                                            ? "Nenhum alerta pedagógico no momento — indicadores recentes sem pontos de atenção."
                                            : "Não há alertas semânticos disponíveis para as sessões observacionais registradas."}
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
                                        {temDadosDesempenho && (
                                            <>
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
                                            </>
                                        )}
                                    </div>

                                    {!temDadosDesempenho && (
                                        <p className="texto-leve">
                                            As sessões disponíveis registram
                                            interações observacionais. Acertos,
                                            erros e taxa de acerto não são
                                            calculados sem eventos semânticos do
                                            jogo.
                                        </p>
                                    )}

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
                                                {sessaoTemDadosDesempenho(
                                                    sessoes[0],
                                                ) && (
                                                    <>
                                                        <span className="chip-acerto">
                                                            ✅{" "}
                                                            {sessoes[0].metrics
                                                                ?.totalCorrect ||
                                                                0}
                                                        </span>
                                                        <span className="chip-erro">
                                                            ❌{" "}
                                                            {sessoes[0].metrics
                                                                ?.totalWrong ||
                                                                0}
                                                        </span>
                                                    </>
                                                )}
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
                                                            montarUrlSessao(
                                                                sessao.sessionId,
                                                            ),
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
                                                        {sessaoTemDadosDesempenho(
                                                            sessao,
                                                        ) && (
                                                            <>
                                                                <span className="chip-acerto">
                                                                    ✅{" "}
                                                                    {sessao
                                                                        .metrics
                                                                        ?.totalCorrect ||
                                                                        0}
                                                                </span>
                                                                <span className="chip-erro">
                                                                    ❌{" "}
                                                                    {sessao
                                                                        .metrics
                                                                        ?.totalWrong ||
                                                                        0}
                                                                </span>
                                                            </>
                                                        )}
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

                                        {/* Gráfico de evolução */}
                                        {temDadosDesempenho &&
                                            evolucaoComDesempenho.length >
                                                1 && (
                                                <div className="card secao-card">
                                                    <h3>
                                                        Evolução ao Longo do
                                                        Tempo
                                                    </h3>
                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height={220}
                                                    >
                                                        <LineChart
                                                            data={
                                                                evolucaoComDesempenho
                                                            }
                                                        >
                                                            <CartesianGrid
                                                                strokeDasharray="3 3"
                                                                stroke="#E2D9CE"
                                                            />
                                                            <XAxis
                                                                dataKey="startedAt"
                                                                tickFormatter={(
                                                                    v,
                                                                ) =>
                                                                    new Date(
                                                                        v,
                                                                    ).toLocaleDateString(
                                                                        "pt-BR",
                                                                    )
                                                                }
                                                                tick={{
                                                                    fontSize: 11,
                                                                }}
                                                            />
                                                            <YAxis
                                                                tick={{
                                                                    fontSize: 11,
                                                                }}
                                                            />
                                                            <Tooltip
                                                                labelFormatter={(
                                                                    v,
                                                                ) =>
                                                                    new Date(
                                                                        v,
                                                                    ).toLocaleString(
                                                                        "pt-BR",
                                                                    )
                                                                }
                                                                formatter={(
                                                                    val,
                                                                    name,
                                                                ) => [
                                                                    val,
                                                                    name ===
                                                                    "totalCorrect"
                                                                        ? "Acertos"
                                                                        : "Erros",
                                                                ]}
                                                            />
                                                            <Legend
                                                                formatter={(
                                                                    v,
                                                                ) =>
                                                                    v ===
                                                                    "totalCorrect"
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

                {modalCaptura && (
                    <div className="modal-captura-backdrop">
                        <div className="modal-captura">
                            <div className="modal-captura-icone">🖼️</div>

                            <div>
                                <h3>{modalCaptura.titulo}</h3>
                                <p>{modalCaptura.mensagem}</p>
                            </div>

                            <button
                                type="button"
                                className="btn-captura-modal"
                                onClick={() => {
                                    setModalCaptura(null);
                                    carregarDados();
                                }}
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                )}

                {modalOrientacaoImportacao && !carregando && !erro && aluno && (
                    <div className="modal-captura-backdrop" role="presentation">
                        <div
                            className="modal-orientacao-importacao"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-orientacao-importacao"
                        >
                            <div className="modal-captura-icone">✅</div>
                            <h3 id="titulo-orientacao-importacao">
                                Agora sim!
                            </h3>
                            <p>
                                O aluno está no jogo correto. Anexe novamente o
                                JSON para importá-lo neste perfil.
                            </p>
                            <button
                                type="button"
                                className="btn-captura"
                                onClick={fecharOrientacaoImportacao}
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                )}

                {modalImportacaoAberto && (
                    <div className="modal-captura-backdrop">
                        <div
                            className="modal-importacao"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-importacao"
                        >
                            <div>
                                <h3 id="titulo-importacao">
                                    Importar telemetria
                                </h3>
                                <p>
                                    Selecione um JSON de uma sessão. Primeiro, o
                                    sistema valida o conteúdo sem salvar nada.
                                </p>
                            </div>

                            <label className="campo-arquivo-importacao">
                                <span>Arquivo JSON</span>
                                <input
                                    type="file"
                                    accept="application/json,.json"
                                    onChange={handleArquivoImportacao}
                                    disabled={processandoImportacao}
                                />
                            </label>

                            {nomeArquivoImportacao && (
                                <p className="texto-leve">
                                    Selecionado: {nomeArquivoImportacao}
                                </p>
                            )}

                            {erroImportacao && (
                                <p className="mensagem-importacao erro-importacao">
                                    {erroImportacao}
                                </p>
                            )}

                            {jogoIncompativel && (
                                <form
                                    className="preview-importacao"
                                    onSubmit={handleCriarJogoDetectado}
                                >
                                    <strong>
                                        Identificamos outro jogo neste arquivo.
                                    </strong>
                                    <span>
                                        O arquivo pertence a “
                                        {jogoIncompativel.nome}”, não ao jogo
                                        aberto neste momento.
                                    </span>
                                    {!jogoDetectadoJaCadastrado && (
                                        <>
                                            <p className="texto-leve">
                                                Usaremos o jogo identificado no
                                                JSON e abriremos o cadastro de
                                                um perfil individual para “
                                                {aluno?.name}”.
                                            </p>
                                            <button
                                                type="submit"
                                                className="btn-captura"
                                                disabled={criandoJogoDetectado}
                                            >
                                                {criandoJogoDetectado
                                                    ? "Preparando..."
                                                    : `Usar ${jogoIncompativel.nome} e continuar`}
                                            </button>
                                        </>
                                    )}
                                    {jogoDetectadoJaCadastrado && (
                                        <>
                                            <p className="mensagem-importacao sucesso-importacao">
                                                Este jogo já está registrado
                                                como “
                                                {jogoDetectadoJaCadastrado.name}
                                                ”. Vamos usá-lo para manter as
                                                sessões reunidas no mesmo
                                                acompanhamento.
                                            </p>
                                            <button
                                                type="button"
                                                className="btn-captura"
                                                onClick={() =>
                                                    continuarParaCadastroNoJogo(
                                                        jogoDetectadoJaCadastrado,
                                                    )
                                                }
                                            >
                                                Continuar com aluno
                                            </button>
                                        </>
                                    )}
                                </form>
                            )}

                            {sucessoImportacao && (
                                <p className="mensagem-importacao sucesso-importacao">
                                    {sucessoImportacao}
                                </p>
                            )}

                            {previewImportacao && (
                                <div className="preview-importacao">
                                    <strong>Prévia validada</strong>
                                    <span>
                                        Sessão: {previewImportacao.sessionId}
                                    </span>
                                    <span>
                                        Jogo: {previewImportacao.gameId}
                                    </span>
                                    <span>
                                        Modo:{" "}
                                        {previewImportacao.captureMode ===
                                        "observational"
                                            ? "observacional"
                                            : "SDK instrumentado"}
                                    </span>
                                    <span>
                                        Registros:{" "}
                                        {previewImportacao.totalClicks} cliques
                                        observados,{" "}
                                        {previewImportacao.totalEventos} eventos
                                    </span>
                                    {previewImportacao.jaRegistrada && (
                                        <p className="mensagem-importacao erro-importacao">
                                            Esta sessão já está registrada e não
                                            será duplicada.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="acoes-importacao">
                                {sucessoImportacao ? (
                                    <button
                                        type="button"
                                        className="btn-captura"
                                        onClick={() =>
                                            setModalImportacaoAberto(false)
                                        }
                                    >
                                        Fechar
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="btn-cancelar-importacao"
                                            onClick={() =>
                                                setModalImportacaoAberto(false)
                                            }
                                            disabled={processandoImportacao}
                                        >
                                            Cancelar
                                        </button>
                                        {!previewImportacao ? (
                                            <button
                                                type="button"
                                                className="btn-captura"
                                                onClick={
                                                    handlePrevisualizarImportacao
                                                }
                                                disabled={
                                                    !sessaoParaImportar ||
                                                    processandoImportacao
                                                }
                                            >
                                                {processandoImportacao
                                                    ? "Validando..."
                                                    : "Validar prévia"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-captura"
                                                onClick={
                                                    handleConfirmarImportacao
                                                }
                                                disabled={
                                                    previewImportacao.jaRegistrada ||
                                                    processandoImportacao
                                                }
                                            >
                                                {processandoImportacao
                                                    ? "Importando..."
                                                    : "Confirmar importação"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
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
