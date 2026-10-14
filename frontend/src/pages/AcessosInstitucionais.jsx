import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Icone from "../components/shared/Icone";
import { useAuth } from "../contexts/AuthContext";
import {
    aceitarOuRecusarConviteInstitucional,
    atualizarPermissoesInstitucionais,
    convidarColaborador,
    listarAcessosInstitucionais,
    revogarAcessoInstitucional,
} from "../services/api";
import "./AcessosInstitucionais.css";

const permissoesIniciais = {
    gerenciarEstrutura: false,
    prepararColetas: true,
    visualizarResultados: false,
};

const rotuloEstado = {
    pending: "Aguardando resposta",
    active: "Ativo",
    declined: "Recusado",
    revoked: "Revogado",
};

const obterId = (valor) => String(valor?._id || valor?.id || valor || "");

export default function AcessosInstitucionais() {
    const { usuario } = useAuth();
    const usuarioId = obterId(usuario);
    const [acessos, setAcessos] = useState([]);
    const [instituicoes, setInstituicoes] = useState([]);
    const [institutionId, setInstitutionId] = useState("");
    const [email, setEmail] = useState("");
    const [permissions, setPermissions] = useState(permissoesIniciais);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState("");
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const carregar = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");
            const resposta = await listarAcessosInstitucionais();
            const novosAcessos = resposta.data.acessos || [];
            const novasInstituicoes = resposta.data.instituicoesGerenciadas || [];
            setAcessos(novosAcessos);
            setInstituicoes(novasInstituicoes);
            setInstitutionId((atual) => {
                const aindaExiste = novasInstituicoes.some(
                    (instituicao) => obterId(instituicao) === atual,
                );
                return aindaExiste ? atual : obterId(novasInstituicoes[0]);
            });
        } catch (falha) {
            setErro(
                falha.response?.data?.mensagem ||
                    "Não foi possível carregar as colaborações.",
            );
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        const iniciarCarregamento = async () => {
            await carregar();
        };
        iniciarCarregamento();
    }, [carregar]);

    const executar = async (chave, acao) => {
        try {
            setProcessando(chave);
            setErro("");
            setMensagem("");
            const resposta = await acao();
            setMensagem(resposta.data.mensagem || "Alteração concluída.");
            await carregar();
            window.dispatchEvent(new Event("ludus:acessos-alterados"));
            return true;
        } catch (falha) {
            setErro(
                falha.response?.data?.mensagem ||
                    "Não foi possível concluir a operação.",
            );
            return false;
        } finally {
            setProcessando("");
        }
    };

    const enviarConvite = async (evento) => {
        evento.preventDefault();
        const concluiu = await executar("novo", () =>
            convidarColaborador({ institutionId, email, permissions }),
        );
        if (concluiu) setEmail("");
    };

    const alterarPermissao = async (acesso, nome) => {
        const novasPermissoes = {
            gerenciarEstrutura:
                acesso.permissions?.gerenciarEstrutura === true,
            prepararColetas: acesso.permissions?.prepararColetas === true,
            visualizarResultados:
                acesso.permissions?.visualizarResultados === true,
            [nome]: !acesso.permissions?.[nome],
        };
        if (nome === "gerenciarEstrutura" && novasPermissoes.gerenciarEstrutura) {
            novasPermissoes.visualizarResultados = true;
        }
        if (nome === "visualizarResultados" && novasPermissoes.gerenciarEstrutura) {
            return;
        }
        await executar(acesso._id, () =>
            atualizarPermissoesInstitucionais(acesso._id, novasPermissoes),
        );
    };

    const recebidoPorMim = (acesso) =>
        obterId(acesso.collaborator) === usuarioId;
    const convitesRecebidos = acessos.filter(
        (item) => item.status === "pending" && recebidoPorMim(item),
    );
    const acessosRecebidos = acessos.filter(
        (item) => item.status === "active" && recebidoPorMim(item),
    );
    const convitesEnviados = acessos.filter(
        (item) => item.status === "pending" && !recebidoPorMim(item),
    );
    const colaboracoesGerenciadas = acessos.filter(
        (item) => item.status === "active" && !recebidoPorMim(item),
    );
    const historico = acessos.filter(
        (item) => !["pending", "active"].includes(item.status),
    );

    return (
        <div>
            <Header
                titulo="Colaborações institucionais"
                subtitulo="Convide integrantes e acesse somente os ambientes e recursos autorizados"
            />

            <div className="pagina-conteudo acessos-institucionais">
                {erro && <div className="card erro-card" role="alert">{erro}</div>}
                {mensagem && (
                    <div className="card acesso-mensagem" role="status">
                        {mensagem}
                    </div>
                )}

                {instituicoes.length > 0 && (
                    <section className="card acesso-convite">
                        <div>
                            <span className="acesso-selo">Acesso revogável</span>
                            <h2>Convidar colaborador</h2>
                            <p className="texto-leve">
                                O convite vale somente para a instituição escolhida.
                                A pessoa precisa já possuir uma conta de professor ou
                                desenvolvedor no LUDUS Acompanha.
                            </p>
                        </div>
                        <form onSubmit={enviarConvite}>
                            <label className="acesso-campo">
                                <span className="campo-label">Instituição</span>
                                <select
                                    className="campo-input"
                                    value={institutionId}
                                    onChange={(evento) => setInstitutionId(evento.target.value)}
                                    required
                                >
                                    {instituicoes.map((instituicao) => (
                                        <option key={instituicao._id} value={instituicao._id}>
                                            {instituicao.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="acesso-campo">
                                <span className="campo-label">E-mail do colaborador</span>
                                <input
                                    className="campo-input"
                                    type="email"
                                    value={email}
                                    onChange={(evento) => setEmail(evento.target.value)}
                                    placeholder="colaborador@exemplo.com"
                                    required
                                />
                            </label>
                            <fieldset className="acesso-permissoes">
                                <legend>Permissões</legend>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={permissions.gerenciarEstrutura}
                                        onChange={(evento) =>
                                            setPermissions((atual) => ({
                                                ...atual,
                                                gerenciarEstrutura: evento.target.checked,
                                                visualizarResultados:
                                                    evento.target.checked ||
                                                    atual.visualizarResultados,
                                            }))
                                        }
                                    />
                                    Gerenciar turmas e alunos
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={permissions.prepararColetas}
                                        onChange={(evento) =>
                                            setPermissions((atual) => ({
                                                ...atual,
                                                prepararColetas: evento.target.checked,
                                            }))
                                        }
                                    />
                                    Preparar e acompanhar coletas
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={permissions.visualizarResultados}
                                        disabled={permissions.gerenciarEstrutura}
                                        onChange={(evento) =>
                                            setPermissions((atual) => ({
                                                ...atual,
                                                visualizarResultados: evento.target.checked,
                                            }))
                                        }
                                    />
                                    Visualizar alunos, sessões, indicadores e capturas
                                    {permissions.gerenciarEstrutura &&
                                        " (incluído ao gerenciar alunos)"}
                                </label>
                            </fieldset>
                            <button
                                className="btn-primario"
                                type="submit"
                                disabled={processando === "novo" || !institutionId}
                            >
                                {processando === "novo" ? "Enviando..." : "Enviar convite"}
                            </button>
                        </form>
                    </section>
                )}

                {carregando ? (
                    <div className="estado-centro"><div className="spinner" /></div>
                ) : (
                    <>
                        {convitesRecebidos.length > 0 && (
                            <section className="acesso-secao">
                                <h2>Convites recebidos</h2>
                                {convitesRecebidos.map((acesso) => (
                                    <article className="card acesso-card" key={acesso._id}>
                                        <div>
                                            <span className="acesso-selo pendente">Convite</span>
                                            <h3>{acesso.institution?.name}</h3>
                                            <p className="texto-leve">
                                                Enviado por {acesso.invitedBy?.name || "responsável da instituição"}.
                                            </p>
                                            <Permissoes acesso={acesso} />
                                        </div>
                                        <div className="acesso-acoes">
                                            <button
                                                type="button"
                                                className="btn-secundario"
                                                disabled={processando === acesso._id}
                                                onClick={() => executar(acesso._id, () =>
                                                    aceitarOuRecusarConviteInstitucional(acesso._id, "decline"))}
                                            >
                                                Recusar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-primario"
                                                disabled={processando === acesso._id}
                                                onClick={() => executar(acesso._id, () =>
                                                    aceitarOuRecusarConviteInstitucional(acesso._id, "accept"))}
                                            >
                                                Aceitar convite
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}

                        {acessosRecebidos.length > 0 && (
                            <section className="acesso-secao">
                                <h2>Ambientes compartilhados comigo</h2>
                                {acessosRecebidos.map((acesso) => (
                                    <article className="card acesso-card" key={acesso._id}>
                                        <div>
                                            <span className="acesso-selo ativo">Ambiente real</span>
                                            <h3>{acesso.institution?.name}</h3>
                                            <p className="texto-leve">
                                                Compartilhado por {acesso.invitedBy?.name || "responsável da instituição"}.
                                            </p>
                                            <Permissoes acesso={acesso} />
                                        </div>
                                        <LinksAcesso acesso={acesso} />
                                    </article>
                                ))}
                            </section>
                        )}

                        {colaboracoesGerenciadas.length > 0 && (
                            <section className="acesso-secao">
                                <h2>Colaborações ativas</h2>
                                {colaboracoesGerenciadas.map((acesso) => (
                                    <article className="card acesso-card" key={acesso._id}>
                                        <div>
                                            <span className="acesso-selo ativo">Acesso concedido</span>
                                            <h3>{acesso.institution?.name}</h3>
                                            <p className="texto-leve">
                                                {acesso.collaborator?.name} — {acesso.collaborator?.email}
                                            </p>
                                            <Permissoes acesso={acesso} />
                                        </div>
                                        <ControlesAcesso
                                            acesso={acesso}
                                            processando={processando}
                                            alterarPermissao={alterarPermissao}
                                            executar={executar}
                                        />
                                    </article>
                                ))}
                            </section>
                        )}

                        {convitesEnviados.length > 0 && (
                            <section className="acesso-secao">
                                <h2>Convites enviados</h2>
                                {convitesEnviados.map((acesso) => (
                                    <article className="card acesso-card" key={acesso._id}>
                                        <div>
                                            <span className="acesso-selo pendente">Aguardando resposta</span>
                                            <h3>{acesso.collaborator?.name}</h3>
                                            <p className="texto-leve">
                                                {acesso.collaborator?.email} · {acesso.institution?.name}
                                            </p>
                                            <Permissoes acesso={acesso} />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-perigo-texto"
                                            disabled={processando === acesso._id}
                                            onClick={() => executar(acesso._id, () =>
                                                revogarAcessoInstitucional(acesso._id))}
                                        >
                                            Cancelar convite
                                        </button>
                                    </article>
                                ))}
                            </section>
                        )}

                        {acessos.length === 0 && instituicoes.length === 0 && (
                            <div className="card estado-vazio">
                                Nenhum convite ou ambiente compartilhado no momento.
                            </div>
                        )}

                        {historico.length > 0 && (
                            <section className="acesso-secao acesso-historico">
                                <h2>Histórico</h2>
                                {historico.map((acesso) => (
                                    <div className="card acesso-historico-item" key={acesso._id}>
                                        <span>{acesso.institution?.name}</span>
                                        <span>
                                            {recebidoPorMim(acesso)
                                                ? acesso.invitedBy?.name
                                                : acesso.collaborator?.name}
                                        </span>
                                        <strong>{rotuloEstado[acesso.status]}</strong>
                                    </div>
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function LinksAcesso({ acesso }) {
    const institutionId = encodeURIComponent(acesso.institution?._id || "");
    return (
        <div className="acesso-links">
            <Link to={`/turmas?institutionId=${institutionId}`}>
                <Icone nome="instituicao" /> Turmas
            </Link>
            {acesso.permissions?.prepararColetas && (
                <Link to={`/coletas?institutionId=${institutionId}`}>
                    <Icone nome="coleta" /> Coletas
                </Link>
            )}
            {acesso.permissions?.visualizarResultados && (
                <Link to={`/alunos?institutionId=${institutionId}`}>
                    <Icone nome="pessoas" /> Resultados
                </Link>
            )}
        </div>
    );
}

function ControlesAcesso({ acesso, processando, alterarPermissao, executar }) {
    return (
        <div className="acesso-acoes vertical">
            <label>
                <input
                    type="checkbox"
                    checked={acesso.permissions?.gerenciarEstrutura === true}
                    disabled={processando === acesso._id}
                    onChange={() => alterarPermissao(acesso, "gerenciarEstrutura")}
                />
                Turmas e alunos
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={acesso.permissions?.prepararColetas === true}
                    disabled={processando === acesso._id}
                    onChange={() => alterarPermissao(acesso, "prepararColetas")}
                />
                Coletas
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={acesso.permissions?.visualizarResultados === true}
                    disabled={
                        processando === acesso._id ||
                        acesso.permissions?.gerenciarEstrutura === true
                    }
                    onChange={() => alterarPermissao(acesso, "visualizarResultados")}
                />
                Resultados
            </label>
            <button
                type="button"
                className="btn-perigo-texto"
                disabled={processando === acesso._id}
                onClick={() => executar(acesso._id, () =>
                    revogarAcessoInstitucional(acesso._id))}
            >
                Revogar acesso
            </button>
        </div>
    );
}

function Permissoes({ acesso }) {
    return (
        <div className="acesso-tags">
            {acesso.permissions?.gerenciarEstrutura && (
                <span>Turmas e alunos</span>
            )}
            {acesso.permissions?.prepararColetas && <span>Coletas</span>}
            {acesso.permissions?.visualizarResultados && <span>Resultados</span>}
        </div>
    );
}
