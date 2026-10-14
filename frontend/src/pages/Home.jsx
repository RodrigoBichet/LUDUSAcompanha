// =============================================================================
// Home.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página inicial — visão geral dos alunos monitorados.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmacaoEstadoJogo from "../components/ConfirmacaoEstadoJogo";
import ConfirmacaoExcluirJogo from "../components/ConfirmacaoExcluirJogo";
import Header from "../components/layout/Header";
import Icone from "../components/shared/Icone";
import { useAuth } from "../contexts/AuthContext";
import {
    listarJogos,
    atualizarJogo,
    arquivarJogo,
    excluirJogo,
    atualizarSolicitacaoInstituicao,
} from "../services/api";
import { humanizarGameId } from "../utils/jogos";
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

const ORIGEM_WEBGL_UNITY_PLAY = "https://play-prod.struckd.com";
const preencherOrigemUnityPlay = (entryUrl, origensAtuais) => {
    try {
        if (new URL(entryUrl).hostname !== "play.unity.com") return origensAtuais;
        const origens = origensAtuais.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
        return origens.includes(ORIGEM_WEBGL_UNITY_PLAY)
            ? origensAtuais
            : [...origens, ORIGEM_WEBGL_UNITY_PLAY].join("\n");
    } catch {
        return origensAtuais;
    }
};

export default function Home() {
    const { usuario, recarregarUsuario } = useAuth();
    const desenvolvedor = usuario?.role === "developer";
    const vinculoPendente = Boolean(
        usuario?.role === "professor" &&
        !usuario?.institutionId &&
        usuario?.institutionRequest,
    );
    const solicitacaoRecusada =
        usuario?.institutionRequest?.status === "rejected";
    const navegar = useNavigate();
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
    const [erroJogo, setErroJogo] = useState("");
    const [jogoEmEdicao, setJogoEmEdicao] = useState(null);
    const [formEdicaoJogo, setFormEdicaoJogo] = useState({});
    const [processandoJogoId, setProcessandoJogoId] = useState(null);
    const [confirmacaoJogo, setConfirmacaoJogo] = useState(null);
    const [erroConfirmacao, setErroConfirmacao] = useState("");
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);
    const [erroExclusao, setErroExclusao] = useState("");
    const alteracaoEmCurso = useRef(false);

    const jogosDisponiveis = useMemo(() => {
        const cadastrados = jogos.map((jogo) => ({
            id: jogo.gameId,
            nome:
                String(jogo.name || "").trim() && jogo.name !== jogo.gameId
                    ? jogo.name
                    : humanizarGameId(jogo.gameId),
            descricao:
                jogo.description ||
                "Jogo disponível para acompanhamento.",
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

    const abrirConfirmacaoExclusao = (jogo, origemFoco) => {
        if (alteracaoEmCurso.current) return;
        setErroExclusao("");
        setConfirmacaoExclusao({ ...jogo, origemFoco });
    };

    const processarExclusao = async (somenteArquivar) => {
        if (!confirmacaoExclusao || alteracaoEmCurso.current) return;
        alteracaoEmCurso.current = true;
        const jogo = confirmacaoExclusao;
        try {
            setProcessandoJogoId(jogo.registroId);
            setErroExclusao("");
            if (somenteArquivar) {
                const resposta = await arquivarJogo(jogo.registroId);
                setJogos((atuais) => atuais.map((item) =>
                    item._id === jogo.registroId ? resposta.data.jogo : item,
                ));
            } else {
                await excluirJogo(jogo.registroId);
                setJogos((atuais) => atuais.filter((item) => item._id !== jogo.registroId));
                if (jogoEmEdicao?.registroId === jogo.registroId) setJogoEmEdicao(null);
            }
            setConfirmacaoExclusao(null);
        } catch (erroProcessamento) {
            setErroExclusao(
                erroProcessamento.response?.data?.mensagem ||
                    "Não foi possível processar o jogo.",
            );
        } finally {
            alteracaoEmCurso.current = false;
            setProcessandoJogoId(null);
        }
    };

    return (
        <div>
            <Header
                titulo={desenvolvedor ? "Área do desenvolvedor" : "Meus jogos"}
                subtitulo={
                    desenvolvedor
                        ? "Gerencie os jogos que você integrará ao LUDUS Acompanha"
                        : "Selecione um jogo para acompanhar os alunos"
                }
            />

            <div className="pagina-conteudo">
                {desenvolvedor && (
                    <section className="card portal-dev-introducao">
                        <div className="portal-dev-cabecalho">
                            <span className="portal-dev-selo">
                                Perfil de desenvolvedor
                            </span>
                            <h2>Prepare seu jogo para a integração</h2>
                            <p>
                                Siga a documentação, envie uma atividade de teste e
                                confira aqui o jogo reconhecido automaticamente. Esta
                                área permite corrigir as informações quando necessário.
                            </p>
                        </div>
                        <ol className="portal-dev-etapas">
                            <li>
                                <strong>1. Consulte o guia</strong>
                                <span>Comece pelo tutorial isolado da documentação.</span>
                            </li>
                            <li>
                                <strong>2. Integre o SDK</strong>
                                <span>Configure cenas, atividades e eventos relevantes.</span>
                            </li>
                            <li>
                                <strong>3. Valide o envio</strong>
                                <span>Confira a sessão e o cadastro automático do jogo.</span>
                            </li>
                        </ol>
                    </section>
                )}

                {vinculoPendente && (
                    <section className="card vinculo-pendente" role="status">
                        <div className="vinculo-pendente-icone">
                            <Icone nome="instituicao" tamanho={26} />
                        </div>
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
                        <Icone nome="aviso" titulo="Atenção" />
                        <p>{erro}</p>
                    </div>
                )}

                {!vinculoPendente && !carregando && !erro && (
                    <>
                        <div className="jogos-selecao">
                            <div>
                                <h2>Meus jogos</h2>
                                <p className="texto-leve">
                                    {desenvolvedor
                                        ? "Confira os jogos reconhecidos pelas sessões e corrija suas informações quando necessário."
                                        : "Consulte os jogos reconhecidos nas atividades e acompanhe os dados dos alunos."}
                                </p>
                            </div>

                            <div className="jogos-opcoes">
                                {jogosDisponiveis.length === 0 && (
                                    <div className="card estado-vazio">
                                        <Icone
                                            nome="jogo"
                                            tamanho={34}
                                            className="estado-vazio-icone"
                                        />
                                        <p>Nenhum jogo cadastrado ainda.</p>
                                        <p className="texto-leve">
                                            O jogo aparecerá automaticamente após a
                                            primeira sessão recebida ser adicionada ao histórico.
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
                                            onClick={() =>
                                                desenvolvedor
                                                    ? abrirEdicaoJogo(jogo)
                                                    : selecionarJogo(jogo)
                                            }
                                            disabled={!jogo.ativo}
                                            aria-label={
                                                desenvolvedor
                                                    ? `Editar ${jogo.nome}`
                                                    : `Abrir ${jogo.nome}`
                                            }
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
                                                    <Icone nome="editar" />
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
                                                        : <Icone nome={jogo.ativo ? "arquivar" : "restaurar"} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="jogo-opcao-excluir"
                                                    title="Excluir jogo definitivamente"
                                                    aria-label={`Excluir ${jogo.nome} definitivamente`}
                                                    onClick={(evento) => abrirConfirmacaoExclusao(jogo, evento.currentTarget)}
                                                    disabled={Boolean(processandoJogoId)}
                                                >
                                                    <Icone nome="excluir" />
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
                                            <span className="campo-label">Nome que aparecerá no LUDUS</span>
                                            <input className="campo-input" value={formEdicaoJogo.name} required maxLength={120}
                                                placeholder="Ex.: Nome do seu jogo"
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, name: evento.target.value }))} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Breve descrição (opcional)</span>
                                            <input className="campo-input" value={formEdicaoJogo.description}
                                                placeholder="Ex.: Jogo para relacionar objetos às suas funções"
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, description: evento.target.value }))} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Página onde a criança abre o jogo (opcional)</span>
                                            <input className="campo-input" type="url" value={formEdicaoJogo.entryUrl}
                                                placeholder="Ex.: https://play.unity.com/pt/games/..."
                                                onChange={(evento) => setFormEdicaoJogo((atual) => ({
                                                    ...atual,
                                                    entryUrl: evento.target.value,
                                                    captureOrigins: preencherOrigemUnityPlay(
                                                        evento.target.value,
                                                        atual.captureOrigins,
                                                    ),
                                                }))} />
                                            <small className="texto-leve">Cole o endereço que aparece no navegador quando o jogo está aberto. Você pode deixar vazio e informar depois.</small>
                                        </label>
                                        <details className="configuracao-avancada-jogo">
                                            <summary>Configuração técnica do site (normalmente automática)</summary>
                                            <label className="campo-grupo">
                                                <span className="campo-label">Endereço interno do jogo</span>
                                                <textarea className="campo-input" value={formEdicaoJogo.captureOrigins}
                                                    placeholder="Ex.: https://play-prod.struckd.com"
                                                    onChange={(evento) => setFormEdicaoJogo((atual) => ({ ...atual, captureOrigins: evento.target.value }))} />
                                                <small className="texto-leve">No Unity Play, este endereço é preenchido automaticamente. Só altere se receber orientação técnica.</small>
                                            </label>
                                        </details>
                                        {erroJogo && (
                                            <p className="erro-cadastro-jogo" role="alert">
                                                {erroJogo}
                                            </p>
                                        )}
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
            {confirmacaoExclusao && (
                <ConfirmacaoExcluirJogo
                    jogo={confirmacaoExclusao}
                    ocupado={Boolean(processandoJogoId)}
                    erro={erroExclusao}
                    onCancelar={() => {
                        if (!alteracaoEmCurso.current) setConfirmacaoExclusao(null);
                    }}
                    onArquivar={() => processarExclusao(true)}
                    onExcluir={() => processarExclusao(false)}
                />
            )}
        </div>
    );
}
