// =============================================================================
// PerfilAluno.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de perfil completo do aluno.
// Dados cadastrais, anotações do professor e monitoramento.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import ConfirmacaoRemoverAnotacao from "../components/ConfirmacaoRemoverAnotacao";
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
    previsualizarImportacaoLote,
    confirmarImportacaoLote,
    removerSessaoImportada,
    criarJogoDetectado,
    listarJogos,
} from "../services/api";
import { criarMapaNomesJogos, obterNomeJogo } from "../utils/jogos";
import "./PerfilAluno.css";
import RelatorioPDF from "../components/shared/RelatorioPDF";
import { MODO_ANONIMO } from "../config/modoAnonimo";

const obterPayloadEvento = (evento) => {
    if (evento?.payloadData && typeof evento.payloadData === "object") {
        return evento.payloadData;
    }
    if (evento?.payload && typeof evento.payload === "object") {
        return evento.payload;
    }

    try {
        return JSON.parse(evento?.payload || "{}");
    } catch {
        return {};
    }
};

const humanizarIdentificador = (valor) =>
    String(valor || "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Za-zÀ-ÿ])(\d)/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

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
    const [jogosDoAluno, setJogosDoAluno] = useState([]);
    const [nomesJogos, setNomesJogos] = useState(new Map());

    // Edição de dados
    const [editando, setEditando] = useState(false);
    const [formAluno, setFormAluno] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [erroEdicaoAluno, setErroEdicaoAluno] = useState("");

    // Anotações
    const [novaAnotacao, setNovaAnotacao] = useState("");
    const [salvandoAnot, setSalvandoAnot] = useState(false);
    const [erroNovaAnotacao, setErroNovaAnotacao] = useState("");
    const [anotacaoParaRemover, setAnotacaoParaRemover] = useState(null);
    const [removendoAnotacao, setRemovendoAnotacao] = useState(false);
    const [erroRemocaoAnotacao, setErroRemocaoAnotacao] = useState("");
    const remocaoAnotacaoEmCurso = useRef(false);
    const tituloAnotacoes = useRef(null);

    // Captura de screenshots
    const [solicitandoCaptura, setSolicitandoCaptura] = useState(false);

    const [modalCaptura, setModalCaptura] = useState(null);

    // Importação de telemetria: o arquivo permanece somente no estado do navegador
    // até a confirmação explícita da pessoa usuária.
    const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
    const [arquivosImportacao, setArquivosImportacao] = useState([]);
    const [erroImportacao, setErroImportacao] = useState("");
    const [jogoIncompativel, setJogoIncompativel] = useState(null);
    const [criandoJogoDetectado, setCriandoJogoDetectado] = useState(false);
    const [importandoJogoDetectado, setImportandoJogoDetectado] =
        useState(false);
    const [jogoDetectadoJaCadastrado, setJogoDetectadoJaCadastrado] =
        useState(null);
    const [sucessoImportacao, setSucessoImportacao] = useState("");
    const [processandoImportacao, setProcessandoImportacao] = useState(false);
    const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
    const [modalOrientacaoImportacao, setModalOrientacaoImportacao] =
        useState(importacaoPronta);
    const [sessaoParaExcluir, setSessaoParaExcluir] = useState(null);
    const [excluindoSessao, setExcluindoSessao] = useState(false);
    const [erroExclusaoSessao, setErroExclusaoSessao] = useState("");

    //Alertas
    const [alertas, setAlertas] = useState([]);

    //Usuario
    const { usuario } = useAuth();

    const temDadosDesempenho = resumo?.temDadosDesempenho === true;
    const evolucaoComDesempenho =
        resumo?.evolucaoTemporal?.filter(
            (sessao) => sessao.temDadosDesempenho,
        ) || [];
    const sessaoTemDadosDesempenho = (sessao) => {
        if (sessao?.capabilities) {
            return sessao.capabilities.correctWrong === true;
        }

        return (sessao?.gameEvents || []).some((evento) =>
            ["CorrectMatch", "WrongMatch"].includes(evento.eventType),
        );
    };

    const carregarDados = useCallback(async () => {
        try {
            setCarregando(true);
            const [resAluno, resJogos] = await Promise.all([
                buscarAluno(id),
                listarJogos().catch(() => null),
            ]);
            const aluno = resAluno.data.aluno;
            setAluno(aluno);
            setNomesJogos(
                criarMapaNomesJogos(resJogos?.data?.jogos || []),
            );

            const jogosAgrupados = new Map();
            for (const sessao of resAluno.data.sessoes || []) {
                if (!sessao.gameId) continue;
                const atual = jogosAgrupados.get(sessao.gameId) || {
                    gameId: sessao.gameId,
                    totalSessoes: 0,
                    ultimaSessao: null,
                };
                atual.totalSessoes += 1;
                if (
                    !atual.ultimaSessao ||
                    new Date(sessao.startedAt) > new Date(atual.ultimaSessao)
                ) {
                    atual.ultimaSessao = sessao.startedAt;
                }
                jogosAgrupados.set(sessao.gameId, atual);
            }
            setJogosDoAluno(
                [...jogosAgrupados.values()].sort(
                    (a, b) =>
                        new Date(b.ultimaSessao).getTime() -
                        new Date(a.ultimaSessao).getTime(),
                ),
            );
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

    const solicitarExclusaoSessao = (sessao) => {
        setSessaoParaExcluir(sessao);
        setErroExclusaoSessao("");
    };

    const cancelarExclusaoSessao = () => {
        if (excluindoSessao) return;
        setSessaoParaExcluir(null);
        setErroExclusaoSessao("");
    };

    const confirmarExclusaoSessao = async () => {
        if (!sessaoParaExcluir?.sessionId) return;

        try {
            setExcluindoSessao(true);
            setErroExclusaoSessao("");
            await removerSessaoImportada(sessaoParaExcluir.sessionId);
            setSessaoParaExcluir(null);
            await carregarDados();
            setModalCaptura({
                titulo: "Sessão removida",
                mensagem:
                    "A sessão importada por JSON foi removida do acompanhamento.",
            });
        } catch (erro) {
            setErroExclusaoSessao(
                erro.response?.data?.mensagem ||
                    "Não foi possível remover esta sessão.",
            );
        } finally {
            setExcluindoSessao(false);
        }
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
            setErroEdicaoAluno("");
            await atualizarAluno(id, formAluno);
            setEditando(false);
            carregarDados();
        } catch {
            setErroEdicaoAluno("Não foi possível salvar os dados. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const handleAdicionarAnotacao = async (e) => {
        e.preventDefault();
        if (!novaAnotacao.trim()) return;
        try {
            setSalvandoAnot(true);
            setErroNovaAnotacao("");
            await adicionarAnotacao(id, novaAnotacao.trim());
            setNovaAnotacao("");
            carregarDados();
        } catch {
            setErroNovaAnotacao("Não foi possível adicionar a anotação. Tente novamente.");
        } finally {
            setSalvandoAnot(false);
        }
    };

    const abrirRemocaoAnotacao = (anotacao, origemFoco) => {
        if (remocaoAnotacaoEmCurso.current) return;
        setErroRemocaoAnotacao("");
        setAnotacaoParaRemover({ ...anotacao, origemFoco });
    };

    const handleDeletarAnotacao = async () => {
        if (!anotacaoParaRemover || remocaoAnotacaoEmCurso.current) return;
        remocaoAnotacaoEmCurso.current = true;
        try {
            setRemovendoAnotacao(true);
            setErroRemocaoAnotacao("");
            await deletarAnotacao(id, anotacaoParaRemover._id);
            await carregarDados();
            setAnotacaoParaRemover(null);
        } catch {
            setErroRemocaoAnotacao("Não foi possível remover a anotação. Tente novamente.");
        } finally {
            remocaoAnotacaoEmCurso.current = false;
            setRemovendoAnotacao(false);
        }
    };

    const handleSolicitarCaptura = async () => {
        if (!aluno?._id) return;

        if (
            aluno.capturaSolicitada &&
            aluno.capturaSolicitadaOrigem === "unity"
        ) {
            setModalCaptura({
                titulo: "Captura visual já ativada no jogo",
                mensagem:
                    "A captura visual já foi ativada no jogo. Aguarde a próxima sessão ser registrada ou desative a opção no jogo.",
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
                    "Não foi possível atualizar a solicitação de captura visual.",
            });
        } finally {
            setSolicitandoCaptura(false);
        }
    };

    const abrirImportacao = () => {
        setModalImportacaoAberto(true);
        setArquivosImportacao([]);
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
        setArrastandoArquivo(false);
    };

    const processarArquivosImportacao = async (listaArquivos) => {
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
        const arquivos = Array.from(listaArquivos || []);
        if (arquivos.length === 0) return;

        const processados = await Promise.all(
            arquivos.map(async (arquivo, indice) => {
                const itemBase = {
                    id: `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${Date.now()}-${indice}`,
                    nome: arquivo.name,
                    sessao: null,
                    lote: null,
                    tipo: "sessao",
                    preview: null,
                    status: "invalido",
                    mensagem: "",
                };

                if (!arquivo.name.toLowerCase().endsWith(".json")) {
                    return {
                        ...itemBase,
                        mensagem: "O arquivo precisa ter extensão .json.",
                    };
                }

                try {
                    const conteudo = await arquivo.text();
                    const dados = JSON.parse(conteudo);

                    if (
                        !dados ||
                        Array.isArray(dados) ||
                        typeof dados !== "object"
                    ) {
                        throw new Error(
                            "O arquivo deve conter um objeto JSON de sessão ou lote.",
                        );
                    }

                    const ehLote =
                        Object.hasOwn(dados, "batchSchemaVersion") ||
                        Object.hasOwn(dados, "batchType");

                    return {
                        ...itemBase,
                        sessao: ehLote ? null : dados,
                        lote: ehLote ? dados : null,
                        tipo: ehLote ? "lote" : "sessao",
                        status: "anexado",
                    };
                } catch (erro) {
                    return {
                        ...itemBase,
                        mensagem:
                            erro.message ||
                            "Não foi possível ler o arquivo JSON.",
                    };
                }
            }),
        );

        setArquivosImportacao((atuais) => {
            const idsSessao = new Set(
                atuais.flatMap((item) =>
                    item.lote
                        ? (Array.isArray(item.lote.sessions)
                              ? item.lote.sessions
                              : []
                          )
                              .map((sessao) => sessao?.sessionId)
                              .filter(Boolean)
                        : [item.sessao?.sessionId].filter(Boolean),
                ),
            );

            const novos = processados.map((item) => {
                const idsDoItem = item.lote
                    ? (Array.isArray(item.lote.sessions)
                          ? item.lote.sessions
                          : []
                      )
                          .map((sessao) => sessao?.sessionId)
                          .filter(Boolean)
                    : [item.sessao?.sessionId].filter(Boolean);
                const possuiRepeticaoInterna =
                    new Set(idsDoItem).size !== idsDoItem.length;
                const jaAdicionada = idsDoItem.some((sessionId) =>
                    idsSessao.has(sessionId),
                );

                if (!possuiRepeticaoInterna && !jaAdicionada) {
                    idsDoItem.forEach((sessionId) => idsSessao.add(sessionId));
                    return item;
                }

                return {
                    ...item,
                    sessao: null,
                    lote: null,
                    status: "invalido",
                    mensagem:
                        "Este arquivo repete uma sessão já adicionada à seleção.",
                };
            });

            return [...atuais, ...novos];
        });
    };

    const handleArquivoImportacao = async (evento) => {
        const input = evento.target;
        await processarArquivosImportacao(input.files);
        input.value = "";
    };

    const limparArquivoImportacao = () => {
        setArquivosImportacao([]);
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
    };

    const removerArquivoImportacao = (idArquivo) => {
        setArquivosImportacao((atuais) =>
            atuais.filter((item) => item.id !== idArquivo),
        );
        setErroImportacao("");
        setJogoIncompativel(null);
        setJogoDetectadoJaCadastrado(null);
        setSucessoImportacao("");
    };

    const handleArrastarArquivo = (evento) => {
        evento.preventDefault();

        if (!processandoImportacao) {
            setArrastandoArquivo(true);
        }
    };

    const handleSairDaZonaArquivo = (evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) {
            setArrastandoArquivo(false);
        }
    };

    const handleSoltarArquivo = async (evento) => {
        evento.preventDefault();
        setArrastandoArquivo(false);

        if (processandoImportacao) return;

        await processarArquivosImportacao(evento.dataTransfer.files);
    };

    const handlePrevisualizarImportacao = async () => {
        const pendentes = arquivosImportacao.filter(
            (item) => item.status === "anexado",
        );
        if (pendentes.length === 0 || !aluno?._id) return;

        try {
            setProcessandoImportacao(true);
            setErroImportacao("");
            setJogoIncompativel(null);
            setJogoDetectadoJaCadastrado(null);
            setSucessoImportacao("");
            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.status === "anexado"
                        ? { ...item, status: "validando", mensagem: "" }
                        : item,
                ),
            );

            const resultados = await Promise.all(
                pendentes.map(async (item) => {
                    try {
                        const resposta = item.lote
                            ? await previsualizarImportacaoLote(
                                  aluno._id,
                                  item.lote,
                              )
                            : await previsualizarImportacaoSessao(
                                  aluno._id,
                                  item.sessao,
                                  gameIdSelecionado,
                              );
                        const preview = resposta.data.preview;
                        const nomeDivergente = Boolean(
                            item.lote &&
                                preview.participante?.requerConfirmacao,
                        );
                        const tudoRegistrado = item.lote
                            ? preview.totalImportaveis === 0
                            : preview.jaRegistrada;
                        return {
                            id: item.id,
                            preview,
                            status: tudoRegistrado
                                ? "ja-registrado"
                                : nomeDivergente
                                  ? "conflito-participante"
                                  : "validado",
                            mensagem: tudoRegistrado
                                ? item.lote
                                    ? "Todas as sessões deste lote já estão registradas."
                                    : "Esta sessão já está registrada."
                                : nomeDivergente
                                  ? "Confira o participante antes de importar."
                                  : item.lote
                                    ? `${preview.totalImportaveis} sessões prontas para importar.`
                                    : "Pronto para importar.",
                            confirmarNomeDiferente: false,
                        };
                    } catch (erro) {
                        return {
                            id: item.id,
                            preview: null,
                            status: "erro-validacao",
                            mensagem:
                                erro.response?.data?.mensagem ||
                                "Não foi possível validar esta sessão.",
                            jogoIncompativel:
                                erro.response?.data?.codigo ===
                                "JOGO_INCOMPATIVEL"
                                    ? erro.response.data.jogoDetectado
                                    : null,
                        };
                    }
                }),
            );

            const resultadosPorId = new Map(
                resultados.map((resultado) => [resultado.id, resultado]),
            );
            setArquivosImportacao((atuais) =>
                atuais.map((item) => {
                    const resultado = resultadosPorId.get(item.id);
                    return resultado ? { ...item, ...resultado } : item;
                }),
            );

            if (arquivosImportacao.length === 1) {
                setJogoIncompativel(
                    resultados[0]?.jogoIncompativel || null,
                );
            }

            const falhas = resultados.filter(
                (resultado) =>
                    resultado.status === "erro-validacao" ||
                    resultado.status === "conflito-participante",
            ).length;
            if (falhas > 0) {
                setErroImportacao(
                    falhas === 1
                        ? "Um arquivo precisa de atenção antes da importação."
                        : `${falhas} arquivos precisam de atenção antes da importação.`,
                );
            }
        } finally {
            setProcessandoImportacao(false);
        }
    };

    const handleConfirmarImportacao = async () => {
        const validados = arquivosImportacao.filter(
            (item) => item.status === "validado" && item.preview,
        );
        if (validados.length === 0 || !aluno?._id) return;

        try {
            setProcessandoImportacao(true);
            setErroImportacao("");
            setSucessoImportacao("");
            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.status === "validado"
                        ? { ...item, status: "importando", mensagem: "" }
                        : item,
                ),
            );

            const resultados = [];
            for (const item of validados) {
                try {
                    const resposta = item.lote
                        ? await confirmarImportacaoLote(
                              aluno._id,
                              item.lote,
                              item.confirmarNomeDiferente,
                          )
                        : await confirmarImportacaoSessao(
                              aluno._id,
                              item.sessao,
                              gameIdSelecionado,
                          );
                    const totalImportadas = item.lote
                        ? resposta.data.totalImportadas
                        : 1;
                    const totalJaRegistradas = item.lote
                        ? resposta.data.totalJaRegistradas
                        : 0;
                    const totalErros = item.lote
                        ? resposta.data.totalErros
                        : 0;
                    resultados.push({
                        id: item.id,
                        status:
                            totalErros > 0
                                ? "erro-importacao"
                                : "importado",
                        quantidadeImportada: totalImportadas,
                        quantidadeFalhas: totalErros,
                        mensagem: item.lote
                            ? `${totalImportadas} sessões importadas${
                                  totalJaRegistradas > 0
                                      ? ` e ${totalJaRegistradas} já registradas`
                                      : ""
                              }${
                                  totalErros > 0
                                      ? `; ${totalErros} não puderam ser importadas`
                                      : ""
                              }.`
                            : "Importado com sucesso.",
                    });
                } catch (erro) {
                    resultados.push({
                        id: item.id,
                        status: "erro-importacao",
                        quantidadeFalhas: 1,
                        mensagem:
                            erro.response?.data?.mensagem ||
                            "Não foi possível importar esta sessão.",
                    });
                }
            }

            const resultadosPorId = new Map(
                resultados.map((resultado) => [resultado.id, resultado]),
            );
            setArquivosImportacao((atuais) =>
                atuais.map((item) => {
                    const resultado = resultadosPorId.get(item.id);
                    return resultado ? { ...item, ...resultado } : item;
                }),
            );

            const importados = resultados
                .filter((resultado) => resultado.quantidadeImportada > 0)
                .reduce(
                    (total, resultado) =>
                        total + resultado.quantidadeImportada,
                    0,
                );
            const falhas = resultados.reduce(
                (total, resultado) =>
                    total + (resultado.quantidadeFalhas || 0),
                0,
            );

            if (importados > 0) {
                await carregarDados();
                setSucessoImportacao(
                    importados === 1
                        ? "Uma sessão foi importada com sucesso."
                        : `${importados} sessões foram importadas com sucesso.`,
                );
            }

            if (falhas > 0) {
                setErroImportacao(
                    falhas === 1
                        ? "Uma sessão não pôde ser importada."
                        : `${falhas} sessões não puderam ser importadas.`,
                );
            }
        } finally {
            setProcessandoImportacao(false);
        }
    };

    const descreverStatusArquivo = (item) => {
        if (item.mensagem) return item.mensagem;

        const descricoes = {
            anexado: "Pronto para validar.",
            validando: "Validando...",
            validado: "Pronto para importar.",
            "ja-registrado": "Esta sessão já está registrada.",
            importando: "Importando...",
            importado: "Importado com sucesso.",
            invalido: "Arquivo inválido.",
            "conflito-participante":
                "O nome do lote difere do aluno selecionado.",
            "erro-validacao": "Não foi possível validar esta sessão.",
            "erro-importacao": "Não foi possível importar esta sessão.",
        };

        return descricoes[item.status] || "Arquivo adicionado.";
    };

    const classeStatusArquivo = (status) => {
        if (["validado", "importado"].includes(status)) return "sucesso";
        if (["anexado", "validando", "importando"].includes(status)) {
            return "pendente";
        }
        if (["ja-registrado", "conflito-participante"].includes(status)) {
            return "aviso";
        }
        return "erro";
    };

    const arquivosValidosImportacao = arquivosImportacao.filter(
        (item) => item.sessao || item.lote,
    );
    const arquivosPendentesImportacao = arquivosImportacao.filter(
        (item) => item.status === "anexado",
    );
    const arquivosProntosImportacao = arquivosImportacao.filter(
        (item) => item.status === "validado",
    );

    const confirmarParticipanteDoLote = (idArquivo) => {
        setArquivosImportacao((atuais) =>
            atuais.map((item) =>
                item.id === idArquivo &&
                item.status === "conflito-participante"
                    ? {
                          ...item,
                          status: "validado",
                          confirmarNomeDiferente: true,
                          mensagem:
                              "Associação confirmada para o aluno selecionado.",
                      }
                    : item,
            ),
        );
        setErroImportacao("");
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

    const handleVincularEImportarJogoDetectado = async () => {
        if (!jogoIncompativel || !aluno?._id) return;
        const gameIdDetectado = jogoIncompativel.gameId;

        const arquivo = arquivosImportacao.find(
            (item) =>
                item.sessao &&
                item.jogoIncompativel?.gameId === gameIdDetectado,
        );
        if (!arquivo) {
            setErroImportacao(
                "Não foi possível localizar o arquivo que identificou este jogo.",
            );
            return;
        }

        try {
            setImportandoJogoDetectado(true);
            setProcessandoImportacao(true);
            setErroImportacao("");
            setSucessoImportacao("");
            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.id === arquivo.id
                        ? { ...item, status: "validando", mensagem: "" }
                        : item,
                ),
            );

            const respostaPreview = await previsualizarImportacaoSessao(
                aluno._id,
                arquivo.sessao,
                gameIdDetectado,
            );
            if (respostaPreview.data.preview?.jaRegistrada) {
                setArquivosImportacao((atuais) =>
                    atuais.map((item) =>
                        item.id === arquivo.id
                            ? {
                                  ...item,
                                  status: "ja-registrado",
                                  preview: respostaPreview.data.preview,
                                  mensagem:
                                      "Esta sessão já está registrada para este aluno.",
                              }
                            : item,
                    ),
                );
                setErroImportacao(
                    "Esta sessão já está registrada para este aluno e jogo.",
                );
                return;
            }

            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.id === arquivo.id
                        ? { ...item, status: "importando", mensagem: "" }
                        : item,
                ),
            );
            await confirmarImportacaoSessao(
                aluno._id,
                arquivo.sessao,
                gameIdDetectado,
            );
            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.id === arquivo.id
                        ? {
                              ...item,
                              status: "importado",
                              mensagem: "Importado com sucesso.",
                          }
                        : item,
                ),
            );
            setModalImportacaoAberto(false);
            setJogoIncompativel(null);
            navegar(
                `/aluno/${aluno._id}?gameId=${encodeURIComponent(
                    gameIdDetectado,
                )}`,
            );
        } catch (erro) {
            setArquivosImportacao((atuais) =>
                atuais.map((item) =>
                    item.id === arquivo.id
                        ? {
                              ...item,
                              status: "erro-importacao",
                              mensagem:
                                  erro.response?.data?.mensagem ||
                                  "Não foi possível importar esta sessão.",
                          }
                        : item,
                ),
            );
            setErroImportacao(
                erro.response?.data?.mensagem ||
                    "Não foi possível vincular o aluno e importar a sessão.",
            );
        } finally {
            setImportandoJogoDetectado(false);
            setProcessandoImportacao(false);
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

    const selecionarJogoDoAluno = (gameId = null) => {
        const parametros = new URLSearchParams();
        if (gameId) parametros.set("gameId", gameId);
        const query = parametros.toString();
        navegar(`/aluno/${id}${query ? `?${query}` : ""}`);
    };

    const capturaAtivaPelaUnity =
        aluno?.capturaSolicitada && aluno?.capturaSolicitadaOrigem === "unity";

    const textoCaptura = capturaAtivaPelaUnity
        ? "Solicitação ativada pelo jogo. Se a próxima sessão for compatível, as capturas visuais estarão disponíveis no mapa de interações."
        : aluno?.capturaSolicitada
          ? "Solicitação ativada nesta tela. Ela será atendida somente por jogos compatíveis com capturas visuais."
          : "Recurso opcional para jogos compatíveis com capturas visuais.";

    const textoBotaoCaptura = solicitandoCaptura
        ? "Salvando..."
        : capturaAtivaPelaUnity
          ? "Ativado no jogo"
          : aluno?.capturaSolicitada
            ? "Cancelar solicitação"
            : "Solicitar captura";

    const desempenho = temDadosDesempenho ? indicadorDesempenho() : null;

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
        const payload = obterPayloadEvento(evento);
        return payload.category || null;
    };

    const extrairTituloSessao = (sessao) => {
        const categoria = extrairCategoria(sessao);
        if (categoria) return traduzirCategoria(categoria);

        const contextos = (sessao.gameEvents || [])
            .filter((evento) => evento.eventType === "CaptureContextStarted")
            .map((evento) =>
                humanizarIdentificador(
                    obterPayloadEvento(evento).displayName,
                ),
            )
            .filter(Boolean)
            .filter((nome, indice, todos) => todos.indexOf(nome) === indice);

        if (contextos.length === 1) return contextos[0];
        if (contextos.length > 1) {
            return `${contextos[0]} → ${contextos[contextos.length - 1]}`;
        }

        const eventoFase = (sessao.gameEvents || []).find(
            (evento) => evento.eventType === "PhaseStarted",
        );
        if (eventoFase) {
            const payload = obterPayloadEvento(eventoFase);
            const fase =
                payload.displayName || payload.phaseName || payload.phaseId;
            if (fase) return humanizarIdentificador(fase);
        }

        if (sessao.captureMode === "observational") {
            return "Sessão observacional";
        }
        if (sessao.captureMode === "sdk") {
            return "Sessão instrumentada";
        }
        return "Sessão registrada";
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
                        <section className="card jogos-aluno-card">
                            <div>
                                <h2>Jogos acompanhados</h2>
                                <p className="texto-leve">
                                    Veja o conjunto do acompanhamento ou filtre
                                    as sessões por jogo.
                                </p>
                            </div>
                            <div className="jogos-aluno-opcoes">
                                <button
                                    type="button"
                                    className={`jogo-aluno-filtro${
                                        !gameIdSelecionado ? " ativo" : ""
                                    }`}
                                    onClick={() => selecionarJogoDoAluno()}
                                >
                                    Todos os jogos
                                </button>
                                {jogosDoAluno.map((jogo) => (
                                    <button
                                        type="button"
                                        className={`jogo-aluno-filtro${
                                            gameIdSelecionado === jogo.gameId
                                                ? " ativo"
                                                : ""
                                        }`}
                                        key={jogo.gameId}
                                        onClick={() =>
                                            selecionarJogoDoAluno(jogo.gameId)
                                        }
                                    >
                                        <span>
                                            {obterNomeJogo(
                                                jogo.gameId,
                                                nomesJogos,
                                            )}
                                        </span>
                                        <small>
                                            {jogo.totalSessoes === 1
                                                ? "1 sessão"
                                                : `${jogo.totalSessoes} sessões`}
                                        </small>
                                    </button>
                                ))}
                                {jogosDoAluno.length === 0 && (
                                    <span className="texto-leve">
                                        Nenhuma sessão registrada até o momento.
                                    </span>
                                )}
                            </div>
                        </section>

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
                                                Solicitar captura visual para a
                                                próxima sessão
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
                                        {erroEdicaoAluno && <p className="form-erro" role="alert">{erroEdicaoAluno}</p>}
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
                                <h3 ref={tituloAnotacoes} tabIndex={-1}>📝 Anotações do Professor</h3>

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
                                    {erroNovaAnotacao && <p className="form-erro" role="alert">{erroNovaAnotacao}</p>}
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
                                                        type="button"
                                                        aria-label="Remover anotação"
                                                        disabled={removendoAnotacao}
                                                        onClick={(evento) => abrirRemocaoAnotacao(anot, evento.currentTarget)}
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

                            {/* Sessões registradas */}
                            {sessoes.length > 0 && (
                                <div className="card secao-card">
                                    <h3>Sessões registradas</h3>
                                    <p className="texto-leve descricao-sessoes-registradas">
                                        {gameIdSelecionado
                                            ? "Telemetrias salvas para este aluno e jogo."
                                            : "Telemetrias de todos os jogos acompanhados por este aluno."}{" "}
                                        Importações por JSON podem ser removidas
                                        em caso de engano.
                                    </p>
                                    <div className="lista-sessoes">
                                        {sessoes.map((sessao) => {
                                            const tituloSessao =
                                                extrairTituloSessao(sessao);
                                            const importadaPorArquivo =
                                                sessao.ingestionMethod ===
                                                "file-import";
                                            return (
                                                <div
                                                    key={sessao.sessionId}
                                                    className="item-sessao"
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn-abrir-sessao"
                                                        onClick={() =>
                                                            navegar(
                                                                montarUrlSessao(
                                                                    sessao.sessionId,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <div className="sessao-info">
                                                            <span className="sessao-categoria">
                                                                🎮{" "}
                                                                {tituloSessao}
                                                            </span>
                                                            <span className="texto-leve sessao-data-menor">
                                                                {formatarData(
                                                                    sessao.startedAt,
                                                                )}
                                                            </span>
                                                            {!gameIdSelecionado && (
                                                                <span className="jogo-sessao-identificacao">
                                                                    {obterNomeJogo(
                                                                        sessao.gameId,
                                                                        nomesJogos,
                                                                    )}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`origem-sessao ${
                                                                    importadaPorArquivo
                                                                        ? "arquivo"
                                                                        : "jogo"
                                                                }`}
                                                            >
                                                                {importadaPorArquivo
                                                                    ? "JSON importado"
                                                                    : "Enviada pelo jogo"}
                                                            </span>
                                                        </div>
                                                        <div className="sessao-metricas">
                                                            <span className="chip-cliques">
                                                                {sessao.metrics
                                                                    ?.totalClicks ||
                                                                    0}{" "}
                                                                {sessao.metrics
                                                                    ?.totalClicks ===
                                                                1
                                                                    ? "clique"
                                                                    : "cliques"}
                                                            </span>
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
                                                    </button>
                                                    {importadaPorArquivo &&
                                                        !aluno?.deletionProtected && (
                                                            <button
                                                                type="button"
                                                                className="btn-excluir-sessao"
                                                                onClick={() =>
                                                                    solicitarExclusaoSessao(
                                                                        sessao,
                                                                    )
                                                                }
                                                                aria-label="Remover sessão importada"
                                                                title="Remover sessão importada"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
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

                {anotacaoParaRemover && (
                    <ConfirmacaoRemoverAnotacao
                        anotacao={anotacaoParaRemover}
                        ocupado={removendoAnotacao}
                        erro={erroRemocaoAnotacao}
                        focoAlternativo={tituloAnotacoes}
                        onCancelar={() => {
                            if (!remocaoAnotacaoEmCurso.current) setAnotacaoParaRemover(null);
                        }}
                        onConfirmar={handleDeletarAnotacao}
                    />
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

                {sessaoParaExcluir && (
                    <div className="modal-captura-backdrop" role="presentation">
                        <div
                            className="modal-exclusao-sessao"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-exclusao-sessao"
                        >
                            <div className="modal-exclusao-icone" aria-hidden="true">
                                🗑️
                            </div>
                            <div>
                                <h3 id="titulo-exclusao-sessao">
                                    Remover sessão importada?
                                </h3>
                                <p>
                                    Essa ação exclui permanentemente a sessão
                                    adicionada por JSON.
                                </p>
                            </div>
                            <div className="resumo-exclusao-sessao">
                                <strong>
                                    {extrairTituloSessao(sessaoParaExcluir)}
                                </strong>
                                <span>
                                    {formatarData(sessaoParaExcluir.startedAt)} •{" "}
                                    {formatarDuracao(
                                        sessaoParaExcluir.durationMs,
                                    )}
                                </span>
                            </div>
                            {erroExclusaoSessao && (
                                <p className="mensagem-importacao erro-importacao">
                                    {erroExclusaoSessao}
                                </p>
                            )}
                            <div className="acoes-exclusao-sessao">
                                <button
                                    type="button"
                                    className="btn-cancelar-importacao"
                                    onClick={cancelarExclusaoSessao}
                                    disabled={excluindoSessao}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn-confirmar-exclusao-sessao"
                                    onClick={confirmarExclusaoSessao}
                                    disabled={excluindoSessao}
                                >
                                    {excluindoSessao
                                        ? "Removendo..."
                                        : "Sim, remover sessão"}
                                </button>
                            </div>
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
                                    Selecione JSONs de sessão ou um lote
                                    multi-jogo do LUDUS Observa. O sistema
                                    valida tudo antes de salvar qualquer dado.
                                </p>
                            </div>

                            <div
                                className={`zona-arquivo-importacao${
                                    arrastandoArquivo ? " arrastando" : ""
                                }${
                                    processandoImportacao ? " desativada" : ""
                                }${
                                    arquivosValidosImportacao.length > 0
                                        ? " arquivo-selecionado"
                                        : ""
                                }`}
                                onDragEnter={handleArrastarArquivo}
                                onDragOver={handleArrastarArquivo}
                                onDragLeave={handleSairDaZonaArquivo}
                                onDrop={handleSoltarArquivo}
                                aria-live="polite"
                            >
                                <span
                                    className="zona-arquivo-icone"
                                    aria-hidden="true"
                                >
                                    {arquivosValidosImportacao.length > 0
                                        ? "✓"
                                        : "📄"}
                                </span>
                                <strong>
                                    {arquivosImportacao.length > 0
                                        ? arquivosImportacao.length === 1
                                            ? "1 arquivo adicionado"
                                            : `${arquivosImportacao.length} arquivos adicionados`
                                        : "Arraste um ou mais JSONs para esta área"}
                                </strong>
                                {arquivosImportacao.length > 0 ? (
                                    <span className="resumo-arquivos-importacao">
                                        {arquivosValidosImportacao.length === 1
                                            ? "1 JSON lido com sucesso"
                                            : `${arquivosValidosImportacao.length} JSONs lidos com sucesso`}
                                    </span>
                                ) : (
                                    <span className="texto-leve">
                                        ou escolha os arquivos no computador
                                    </span>
                                )}
                                <div className="acoes-arquivo-importacao">
                                    <label
                                        className="btn-escolher-arquivo"
                                        htmlFor="arquivo-telemetria"
                                    >
                                        {arquivosImportacao.length > 0
                                            ? "Adicionar arquivos"
                                            : "Escolher arquivos"}
                                    </label>
                                    {arquivosImportacao.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn-remover-arquivo"
                                            onClick={limparArquivoImportacao}
                                            disabled={processandoImportacao}
                                        >
                                            Remover todos
                                        </button>
                                    )}
                                </div>
                                <input
                                    id="arquivo-telemetria"
                                    className="input-arquivo-importacao"
                                    type="file"
                                    accept="application/json,.json"
                                    multiple
                                    onChange={handleArquivoImportacao}
                                    disabled={processandoImportacao}
                                />
                            </div>

                            {arquivosImportacao.length > 0 && (
                                <div className="lista-arquivos-importacao">
                                    {arquivosImportacao.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`item-arquivo-importacao ${classeStatusArquivo(item.status)}`}
                                        >
                                            <div className="conteudo-arquivo-importacao">
                                                <strong>{item.nome}</strong>
                                                <span>
                                                    {descreverStatusArquivo(
                                                        item,
                                                    )}
                                                </span>
                                                {item.preview?.tipo ===
                                                "lote-observacional" ? (
                                                    <div className="resumo-lote-importacao">
                                                        <small>
                                                            Participante: {" "}
                                                            <strong>
                                                                {
                                                                    item.preview
                                                                        .participante
                                                                        .nomeInformado
                                                                }
                                                            </strong>
                                                        </small>
                                                        <small>
                                                            {
                                                                item.preview
                                                                    .totalSessoes
                                                            }{" "}
                                                            sessões • {" "}
                                                            {
                                                                item.preview
                                                                    .jogos.length
                                                            }{" "}
                                                            jogos • {" "}
                                                            {
                                                                item.preview
                                                                    .totalJaRegistradas
                                                            }{" "}
                                                            já registradas
                                                        </small>
                                                        <small>
                                                            {item.preview.jogos
                                                                .map(
                                                                    (jogo) =>
                                                                        `${jogo.gameId} (${jogo.totalSessoes})`,
                                                                )
                                                                .join(" • ")}
                                                        </small>
                                                        {item.status ===
                                                            "conflito-participante" && (
                                                            <div className="confirmacao-participante-lote">
                                                                <span>
                                                                    O lote informa
                                                                    “
                                                                    {
                                                                        item
                                                                            .preview
                                                                            .participante
                                                                            .nomeInformado
                                                                    }
                                                                    ”, mas o perfil
                                                                    aberto é “
                                                                    {
                                                                        item
                                                                            .preview
                                                                            .participante
                                                                            .alunoSelecionado
                                                                    }
                                                                    ”.
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        confirmarParticipanteDoLote(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processandoImportacao
                                                                    }
                                                                >
                                                                    Usar este perfil
                                                                    mesmo assim
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : item.preview ? (
                                                    <small>
                                                        {item.preview.gameId} •{" "}
                                                        {
                                                            item.preview
                                                                .totalClicks
                                                        }{" "}
                                                        cliques •{" "}
                                                        {
                                                            item.preview
                                                                .totalEventos
                                                        }{" "}
                                                        eventos
                                                    </small>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-remover-item-arquivo"
                                                onClick={() =>
                                                    removerArquivoImportacao(
                                                        item.id,
                                                    )
                                                }
                                                disabled={
                                                    processandoImportacao
                                                }
                                                aria-label={`Remover ${item.nome}`}
                                                title="Remover arquivo"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
                                    <p className="texto-leve">
                                        Você pode manter este mesmo aluno no
                                        novo jogo e concluir a importação agora,
                                        ou criar outro perfil com um nome
                                        diferente.
                                    </p>
                                    {jogoDetectadoJaCadastrado && (
                                        <p className="mensagem-importacao sucesso-importacao">
                                            Este jogo já está registrado como “
                                            {jogoDetectadoJaCadastrado.name}”.
                                        </p>
                                    )}
                                    <div className="acoes-jogo-incompativel">
                                        <button
                                            type="button"
                                            className="btn-captura"
                                            onClick={
                                                handleVincularEImportarJogoDetectado
                                            }
                                            disabled={
                                                importandoJogoDetectado ||
                                                criandoJogoDetectado
                                            }
                                        >
                                            {importandoJogoDetectado
                                                ? "Importando..."
                                                : "Vincular este aluno e importar agora"}
                                        </button>
                                    {!jogoDetectadoJaCadastrado && (
                                            <button
                                                type="submit"
                                                className="btn-cancelar-importacao"
                                                disabled={
                                                    criandoJogoDetectado ||
                                                    importandoJogoDetectado
                                                }
                                            >
                                                {criandoJogoDetectado
                                                    ? "Preparando..."
                                                    : "Criar outro perfil neste jogo"}
                                            </button>
                                    )}
                                    {jogoDetectadoJaCadastrado && (
                                            <button
                                                type="button"
                                                className="btn-cancelar-importacao"
                                                onClick={() =>
                                                    continuarParaCadastroNoJogo(
                                                        jogoDetectadoJaCadastrado,
                                                    )
                                                }
                                                disabled={
                                                    importandoJogoDetectado
                                                }
                                            >
                                                Criar outro perfil neste jogo
                                            </button>
                                    )}
                                    </div>
                                </form>
                            )}

                            {sucessoImportacao && (
                                <p className="mensagem-importacao sucesso-importacao">
                                    {sucessoImportacao}
                                </p>
                            )}

                            <div className="acoes-importacao">
                                <button
                                    type="button"
                                    className="btn-cancelar-importacao"
                                    onClick={() =>
                                        setModalImportacaoAberto(false)
                                    }
                                    disabled={processandoImportacao}
                                >
                                    {sucessoImportacao ? "Fechar" : "Cancelar"}
                                </button>
                                {arquivosPendentesImportacao.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn-captura"
                                        onClick={handlePrevisualizarImportacao}
                                        disabled={processandoImportacao}
                                    >
                                        {processandoImportacao
                                            ? "Validando..."
                                            : arquivosPendentesImportacao.length ===
                                                1
                                              ? "Validar arquivo"
                                              : `Validar ${arquivosPendentesImportacao.length} arquivos`}
                                    </button>
                                )}
                                {arquivosPendentesImportacao.length === 0 &&
                                    arquivosProntosImportacao.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn-captura"
                                            onClick={handleConfirmarImportacao}
                                            disabled={processandoImportacao}
                                        >
                                            {processandoImportacao
                                                ? "Importando..."
                                                : arquivosProntosImportacao.length ===
                                                    1
                                                  ? "Importar sessão"
                                                  : `Importar ${arquivosProntosImportacao.length} sessões`}
                                        </button>
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
