// =============================================================================
// Home.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página inicial — visão geral dos alunos monitorados.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfirmacaoEstadoJogo from "../components/ConfirmacaoEstadoJogo";
import Header from "../components/layout/Header";
import { useAuth } from "../contexts/AuthContext";
import {
    listarJogos,
    criarJogo,
    atualizarJogo,
    arquivarJogo,
    atualizarSolicitacaoInstituicao,
} from "../services/api";
import "./Home.css";

const JOGOS_DISPONIVEIS = [
    {
        id: "para-que-serve",
        nome: "Para Que Serve?",
        descricao: "Jogo atual do projeto LUDUS Acompanha.",
        ativo: true,
    },
    {
        id: "historietas-divertidas",
        nome: "Historietas Divertidas",
        descricao: "Preparado para integração futura.",
        ativo: true,
    },
];

export default function Home() {
    const { usuario, recarregarUsuario } = useAuth();
    const vinculoPendente = Boolean(
        usuario?.role === "professor" &&
        !usuario?.institutionId &&
        usuario?.institutionRequest,
    );
    const solicitacaoRecusada =
        usuario?.institutionRequest?.status === "rejected";
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();
    const nomeJogoSugerido = searchParams.get("novoJogo") || "";
    const [jogos, setJogos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [verificandoVinculo, setVerificandoVinculo] = useState(false);
    const [mensagemVinculo, setMensagemVinculo] = useState("");
    const [salvandoSolicitacao, setSalvandoSolicitacao] = useState(false);
    const [instituicaoSolicitada, setInstituicaoSolicitada] = useState(
        usuario?.institutionRequest?.name || "",
    );
    const [cidadeSolicitada, setCidadeSolicitada] = useState(
        usuario?.institutionRequest?.city || "",
    );
    const [mostrarCadastroJogo, setMostrarCadastroJogo] = useState(
        Boolean(nomeJogoSugerido),
    );
    const [salvandoJogo, setSalvandoJogo] = useState(false);
    const [erroJogo, setErroJogo] = useState("");
    const [formJogo, setFormJogo] = useState({ name: nomeJogoSugerido });
    const [jogoEmEdicao, setJogoEmEdicao] = useState(null);
    const [formEdicaoJogo, setFormEdicaoJogo] = useState({});
    const [processandoJogoId, setProcessandoJogoId] = useState(null);
    const [confirmacaoJogo, setConfirmacaoJogo] = useState(null);
    const [erroConfirmacao, setErroConfirmacao] = useState("");
    const alteracaoEmCurso = useRef(false);

    const jogosDisponiveis = useMemo(() => {
        const cadastrados = jogos.map((jogo) => ({
            id: jogo.gameId,
            nome: jogo.name,
            descricao:
                jogo.description ||
                `Jogo cadastrado (${jogo.sourceType || "origem não informada"}).`,
            descricaoEditavel: jogo.description || "",
            ativo: jogo.active !== false,
            escopo: jogo.scopeType,
            registroId: jogo._id,
            entryUrl: jogo.observationTarget?.entryUrl || "",
            captureOrigins: jogo.observationTarget?.captureOrigins || [],
        }));

        return [
            ...(usuario?.role === "admin" ? JOGOS_DISPONIVEIS : []).filter(
                (jogo) => !cadastrados.some((item) => item.id === jogo.id),
            ),
            ...cadastrados,
        ];
    }, [jogos, usuario?.role]);

    useEffect(() => {
        const carregarJogos = async () => {
        if (vinculoPendente) {
            setCarregando(false);
            return;
        }
        try {
            setCarregando(true);
            const resJogos = await listarJogos();
            setJogos(resJogos.data.jogos || []);
        } catch {
            setErro("Não foi possível carregar os jogos.");
        } finally {
            setCarregando(false);
        }
        };

        void carregarJogos();
    }, [vinculoPendente]);

    const selecionarJogo = (jogo) => {
        if (!jogo.ativo) return;

        navegar(`/jogos/${encodeURIComponent(jogo.id)}/alunos`);
    };

    const verificarAprovacao = async () => {
        try {
            setVerificandoVinculo(true);
            setMensagemVinculo("");
            const usuarioAtualizado = await recarregarUsuario();
            if (!usuarioAtualizado?.institutionId) {
                setMensagemVinculo("O vínculo ainda aguarda análise da administração.");
            }
        } catch {
            setMensagemVinculo("Não foi possível verificar agora. Tente novamente em alguns instantes.");
        } finally {
            setVerificandoVinculo(false);
        }
    };

    const reenviarSolicitacao = async (evento) => {
        evento.preventDefault();
        try {
            setSalvandoSolicitacao(true);
            setMensagemVinculo("");
            await atualizarSolicitacaoInstituicao({
                institutionName: instituicaoSolicitada,
                institutionCity: cidadeSolicitada,
            });
            await recarregarUsuario();
            setMensagemVinculo("Solicitação corrigida e reenviada para análise.");
        } catch (erroSolicitacao) {
            setMensagemVinculo(
                erroSolicitacao.response?.data?.mensagem ||
                    "Não foi possível reenviar a solicitação.",
            );
        } finally {
            setSalvandoSolicitacao(false);
        }
    };

    const handleCadastrarJogo = async (evento) => {
        evento.preventDefault();

        try {
            setSalvandoJogo(true);
            setErroJogo("");
            const resposta = await criarJogo({
                ...formJogo,
                scopeType: "personal",
                sourceType: "external-json",
            });
            const jogo = resposta.data.jogo;
            setJogos((atuais) => [...atuais, jogo]);
            setFormJogo({ name: "" });
            setMostrarCadastroJogo(false);
        } catch (erroCadastro) {
            setErroJogo(
                erroCadastro.response?.data?.mensagem ||
                    "Não foi possível cadastrar o jogo.",
            );
        } finally {
            setSalvandoJogo(false);
        }
    };

    const abrirEdicaoJogo = (jogo) => {
        setJogoEmEdicao(jogo);
        setFormEdicaoJogo({
            name: jogo.nome,
            description: jogo.descricaoEditavel || "",
            entryUrl: jogo.entryUrl || "",
            captureOrigins: (jogo.captureOrigins || []).join("\n"),
        });
        setErroJogo("");
    };

    const handleSalvarEdicaoJogo = async (evento) => {
        evento.preventDefault();
        if (!jogoEmEdicao) return;

        try {
            setProcessandoJogoId(jogoEmEdicao.registroId);
            setErroJogo("");
            const resposta = await atualizarJogo(
                jogoEmEdicao.registroId,
                {
                    name: formEdicaoJogo.name,
                    description: formEdicaoJogo.description,
                    observationTarget: {
                        entryUrl: formEdicaoJogo.entryUrl,
                        captureOrigins: formEdicaoJogo.captureOrigins
                            .split(/\r?\n/)
                            .filter((item) => item.trim()),
                    },
                },
            );
            setJogos((atuais) => atuais.map((jogo) =>
                jogo._id === jogoEmEdicao.registroId ? resposta.data.jogo : jogo,
            ));
            setJogoEmEdicao(null);
        } catch (erroEdicao) {
            setErroJogo(
                erroEdicao.response?.data?.mensagem ||
                    "Não foi possível atualizar o jogo.",
            );
        } finally {
            setProcessandoJogoId(null);
        }
    };

    const abrirConfirmacaoArquivo = (jogo, origemFoco) => {
        if (alteracaoEmCurso.current) return;
        setErroConfirmacao("");
        setConfirmacaoJogo({ ...jogo, origemFoco });
    };

    const handleAlternarArquivoJogo = async () => {
        if (!confirmacaoJogo || alteracaoEmCurso.current) return;
        alteracaoEmCurso.current = true;
        const jogo = confirmacaoJogo;
        try {
            setProcessandoJogoId(jogo.registroId);
            setErroJogo("");
            const resposta = jogo.ativo
                ? await arquivarJogo(jogo.registroId)
                : await atualizarJogo(jogo.registroId, { active: true });
            setJogos((atuais) => atuais.map((item) =>
                item._id === jogo.registroId ? resposta.data.jogo : item,
            ));
            setConfirmacaoJogo(null);
        } catch (erroArquivo) {
            setErroConfirmacao(
                erroArquivo.response?.data?.mensagem ||
                    "Não foi possível alterar o estado do jogo.",
            );
        } finally {
            alteracaoEmCurso.current = false;
            setProcessandoJogoId(null);
        }
    };

    return (
        <div>
            <Header
                titulo="Jogos"
                subtitulo="Selecione um jogo para acompanhar os alunos"
            />

            <div className="pagina-conteudo">
                {vinculoPendente && (
                    <section className="card vinculo-pendente" role="status">
                        <div className="vinculo-pendente-icone" aria-hidden="true">🏫</div>
                        <div>
                            <span className="vinculo-pendente-etapa">
                                {solicitacaoRecusada ? "Correção necessária" : "Cadastro confirmado"}
                            </span>
                            <h2>
                                {solicitacaoRecusada
                                    ? "Revise sua solicitação institucional"
                                    : "Vínculo institucional em análise"}
                            </h2>
                            <p>
                                Sua solicitação para <strong>{usuario.institutionRequest.name}</strong>
                                {usuario.institutionRequest.city ? `, em ${usuario.institutionRequest.city}` : ""}, foi registrada.
                            </p>
                            {solicitacaoRecusada ? (
                                <>
                                    <p className="vinculo-motivo">
                                        <strong>Motivo informado:</strong>{" "}
                                        {usuario.institutionRequest.rejectionReason}
                                    </p>
                                    <form className="vinculo-correcao" onSubmit={reenviarSolicitacao}>
                                        <label>
                                            Instituição
                                            <input
                                                className="campo-input"
                                                value={instituicaoSolicitada}
                                                maxLength={160}
                                                required
                                                onChange={(evento) => setInstituicaoSolicitada(evento.target.value)}
                                            />
                                        </label>
                                        <label>
                                            Cidade (opcional)
                                            <input
                                                className="campo-input"
                                                value={cidadeSolicitada}
                                                maxLength={120}
                                                onChange={(evento) => setCidadeSolicitada(evento.target.value)}
                                            />
                                        </label>
                                        <button className="btn-primario" disabled={salvandoSolicitacao}>
                                            {salvandoSolicitacao ? "Reenviando..." : "Corrigir e reenviar"}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <p className="texto-leve">
                                    Uma pessoa administradora precisa confirmar a instituição antes de liberar as turmas e coletas. Você não precisa enviar o cadastro novamente.
                                </p>
                            )}
                            <div className="vinculo-pendente-acoes">
                                {!solicitacaoRecusada && (
                                <button
                                    type="button"
                                    className="btn-primario"
                                    onClick={verificarAprovacao}
                                    disabled={verificandoVinculo}
                                >
                                    {verificandoVinculo ? "Verificando..." : "Verificar aprovação"}
                                </button>
                                )}
                                {mensagemVinculo && <span role="status">{mensagemVinculo}</span>}
                            </div>
                        </div>
                    </section>
                )}

                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando jogos...</p>
                    </div>
                )}

                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {!vinculoPendente && !carregando && !erro && (
                    <>
                        <div className="jogos-selecao">
                            <div>
                                <h2>Jogo acompanhado</h2>
                                <p className="texto-leve">
                                    Escolha o jogo para visualizar os dados dos
                                    alunos.
                                </p>
                            </div>

                            <div className="acoes-jogos">
                                <button
                                    type="button"
                                    className="btn-primario"
                                    onClick={() => {
                                        setMostrarCadastroJogo((aberto) => !aberto);
                                        setErroJogo("");
                                    }}
                                >
                                    {mostrarCadastroJogo
                                        ? "Fechar cadastro"
                                        : "+ Cadastrar jogo"}
                                </button>
                            </div>

                            {mostrarCadastroJogo && (
                                <form
                                    className="form-cadastro-jogo"
                                    onSubmit={handleCadastrarJogo}
                                >
                                    <label className="campo-grupo">
                                        <span className="campo-label">
                                            Nome do jogo
                                        </span>
                                        <input
                                            className="campo-input"
                                            value={formJogo.name}
                                            onChange={(evento) =>
                                                setFormJogo((atual) => ({
                                                    ...atual,
                                                    name: evento.target.value,
                                                }))
                                            }
                                            required
                                            maxLength={120}
                                        />
                                    </label>
                                    {erroJogo && (
                                        <p className="erro-cadastro-jogo">
                                            {erroJogo}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn-primario"
                                        disabled={salvandoJogo}
                                    >
                                        {salvandoJogo
                                            ? "Cadastrando..."
                                            : "Salvar jogo"}
                                    </button>
                                </form>
                            )}

                            <div className="jogos-opcoes">
                                {jogosDisponiveis.length === 0 && (
                                    <div className="card estado-vazio">
                                        <span className="estado-vazio-icone">🎮</span>
                                        <p>Nenhum jogo cadastrado ainda.</p>
                                        <p className="texto-leve">
                                            Cadastre um jogo ou importe o primeiro JSON de uma sessão.
                                        </p>
                                    </div>
                                )}
                                {jogosDisponiveis.map((jogo) => (
                                    <div
                                        key={jogo.id}
                                        className="jogo-opcao"
                                    >
                                        <button
                                            type="button"
                                            className="jogo-opcao-principal"
                                            onClick={() => selecionarJogo(jogo)}
                                            disabled={!jogo.ativo}
                                        >
                                            <span className="jogo-opcao-nome">
                                                {jogo.nome}
                                            </span>
                                            <span className="jogo-opcao-descricao">
                                                {jogo.descricao}
                                            </span>
                                            {!jogo.ativo && (
                                                <span className="jogo-opcao-badge">
                                                    Arquivado
                                                </span>
                                            )}
                                            {jogo.escopo === "personal" && (
                                                <span className="jogo-opcao-escopo">
                                                    Pessoal
                                                </span>
                                            )}
                                        </button>
                                        {jogo.registroId && (
                                            <div className="jogo-opcao-acoes">
                                                <button
                                                    type="button"
                                                    title="Editar jogo"
                                                    aria-label={`Editar ${jogo.nome}`}
                                                    onClick={() => abrirEdicaoJogo(jogo)}
                                                    disabled={Boolean(processandoJogoId)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    type="button"
                                                    title={jogo.ativo ? "Arquivar jogo" : "Reativar jogo"}
                                                    aria-label={jogo.ativo ? `Arquivar ${jogo.nome}` : `Reativar ${jogo.nome}`}
                                                    onClick={(evento) => abrirConfirmacaoArquivo(jogo, evento.currentTarget)}
                                                    disabled={Boolean(processandoJogoId)}
                                                >
                                                    {processandoJogoId === jogo.registroId
                                                        ? "…"
                                                        : jogo.ativo ? "🗑️" : "↩️"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {jogoEmEdicao && (
                                <div className="modal-edicao-jogo-backdrop">
                                    <form className="modal-edicao-jogo" onSubmit={handleSalvarEdicaoJogo}>
                                        <h3>Editar jogo</h3>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Nome do jogo</span>
                                            <input className="campo-input" value={formEdicaoJogo.name} required maxLength={120}
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, name: evento.target.value }))} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Descrição (opcional)</span>
                                            <input className="campo-input" value={formEdicaoJogo.description}
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, description: evento.target.value }))} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Link do jogo (opcional)</span>
                                            <input className="campo-input" type="url" value={formEdicaoJogo.entryUrl}
                                                placeholder="https://portal.exemplo.org/jogos/meu-jogo"
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, entryUrl: evento.target.value }))} />
                                            <small className="texto-leve">Copie aqui o endereço que aparece no navegador quando o jogo está aberto.</small>
                                        </label>
                                        <details className="configuracao-avancada-jogo">
                                            <summary>O jogo abre dentro de outra página?</summary>
                                            <label className="campo-grupo">
                                                <span className="campo-label">Endereço onde o jogo é carregado</span>
                                                <textarea className="campo-input" value={formEdicaoJogo.captureOrigins}
                                                    placeholder="https://conteudo.exemplo.org"
                                                    onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, captureOrigins: evento.target.value }))} />
                                                <small className="texto-leve">Normalmente você pode deixar este espaço vazio. Preencha somente se receber essa orientação ao preparar o jogo.</small>
                                            </label>
                                        </details>
                                        <div className="modal-edicao-jogo-acoes">
                                            <button type="button" className="btn-secundario" onClick={() => setJogoEmEdicao(null)} disabled={Boolean(processandoJogoId)}>
                                                Cancelar
                                            </button>
                                            <button className="btn-primario" disabled={Boolean(processandoJogoId)}>
                                                {processandoJogoId ? "Salvando..." : "Salvar alterações"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                    </>
                )}
            </div>
            {confirmacaoJogo && (
                <ConfirmacaoEstadoJogo
                    jogo={confirmacaoJogo}
                    ocupado={Boolean(processandoJogoId)}
                    erro={erroConfirmacao}
                    onCancelar={() => {
                        if (!alteracaoEmCurso.current) setConfirmacaoJogo(null);
                    }}
                    onConfirmar={handleAlternarArquivoJogo}
                />
            )}
        </div>
    );
}
