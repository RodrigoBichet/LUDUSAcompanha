import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    listarAcessosInstitucionais,
    obterLaboratorioDesenvolvedor,
} from "../../services/api";
import Icone from "../shared/Icone";
import MarcaLudus from "../shared/MarcaLudus";
import ContaUsuario from "./ContaUsuario";
import "./Sidebar.css";

export default function Sidebar() {
    const { usuario } = useAuth();
    const location = useLocation();
    const [recolhida, setRecolhida] = useState(
        () => window.localStorage.getItem("ludus:sidebar-recolhida") === "true",
    );
    const [acessosCompartilhados, setAcessosCompartilhados] = useState([]);
    const [laboratorioId, setLaboratorioId] = useState("");
    const vinculoPendente = Boolean(
        usuario?.role === "professor" &&
        !usuario?.institutionId &&
        usuario?.institutionRequest,
    );
    const desenvolvedor = usuario?.role === "developer";
    const usuarioId = String(usuario?.id || usuario?._id || "");

    const carregarContextos = useCallback(async () => {
        if (!usuarioId) return;
        try {
            const [respostaAcessos, respostaLaboratorio] = await Promise.all([
                listarAcessosInstitucionais(),
                desenvolvedor
                    ? obterLaboratorioDesenvolvedor()
                    : Promise.resolve(null),
            ]);
            const recebidos = (respostaAcessos.data.acessos || []).filter(
                (acesso) =>
                    acesso.status === "active" &&
                    String(
                        acesso.collaborator?._id ||
                            acesso.collaborator?.id ||
                            "",
                    ) === usuarioId,
            );
            setAcessosCompartilhados(recebidos);
            setLaboratorioId(
                respostaLaboratorio?.data?.laboratorio?.instituicao?._id || "",
            );
        } catch {
            setAcessosCompartilhados([]);
            setLaboratorioId("");
        }
    }, [desenvolvedor, usuarioId]);

    useEffect(() => {
        const iniciarCarregamento = async () => {
            await carregarContextos();
        };
        iniciarCarregamento();
        window.addEventListener("ludus:acessos-alterados", carregarContextos);
        window.addEventListener("ludus:laboratorio-alterado", carregarContextos);
        return () => {
            window.removeEventListener(
                "ludus:acessos-alterados",
                carregarContextos,
            );
            window.removeEventListener(
                "ludus:laboratorio-alterado",
                carregarContextos,
            );
        };
    }, [carregarContextos]);

    const institutionIdAtual = new URLSearchParams(location.search).get(
        "institutionId",
    );
    const classeContextoPadrao = (caminho) =>
        location.pathname === caminho && !institutionIdAtual
            ? "nav-item ativo"
            : "nav-item";
    const classeContexto = (caminho, institutionId) =>
        location.pathname === caminho &&
        institutionIdAtual === String(institutionId)
            ? "nav-item subitem ativo"
            : "nav-item subitem";
    const urlContexto = (caminho, institutionId) =>
        institutionId
            ? `${caminho}?institutionId=${encodeURIComponent(institutionId)}`
            : "/laboratorio";
    const alternarSidebar = () => {
        setRecolhida((estadoAtual) => {
            const proximoEstado = !estadoAtual;
            window.localStorage.setItem(
                "ludus:sidebar-recolhida",
                String(proximoEstado),
            );
            return proximoEstado;
        });
    };

    return (
        <aside
            className={`sidebar${recolhida ? " recolhida" : ""}`}
            aria-label="Navegação principal"
        >
            <NavLink
                className="sidebar-logo"
                to="/inicio"
                aria-label="Ir para a página inicial do LUDUS Acompanha"
            >
                <MarcaLudus clara compacta />
            </NavLink>
            <button
                type="button"
                className="sidebar-alternar"
                onClick={alternarSidebar}
                aria-label={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
                aria-expanded={!recolhida}
                title={recolhida ? "Expandir menu" : "Recolher menu"}
            >
                <span aria-hidden="true">{recolhida ? "›" : "‹"}</span>
            </button>

            {/* Navegação */}
            <nav className="sidebar-nav" aria-label="Seções do sistema">
                <NavLink
                    to="/inicio"
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <Icone nome="inicio" className="nav-icone" />
                    <span>Início</span>
                </NavLink>
                <NavLink
                    to="/documentacao"
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <Icone nome="documento" className="nav-icone" />
                    <span>Documentação</span>
                </NavLink>

                <div className="nav-separador">Dashboard</div>
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <Icone nome="jogos" className="nav-icone" />
                    <span>Meus jogos</span>
                </NavLink>

                {!desenvolvedor && !vinculoPendente && (
                    <>
                        <NavLink
                            to="/turmas"
                            className={() => classeContextoPadrao("/turmas")}
                        >
                            <Icone nome="instituicao" className="nav-icone" />
                            <span>Instituições</span>
                        </NavLink>

                        <NavLink
                            to="/alunos"
                            className={() => classeContextoPadrao("/alunos")}
                        >
                            <Icone nome="pessoas" className="nav-icone" />
                            <span>Alunos</span>
                        </NavLink>

                        <NavLink
                            to="/coletas"
                            className={() => classeContextoPadrao("/coletas")}
                        >
                            <Icone nome="coleta" className="nav-icone" />
                            <span>Coletas</span>
                        </NavLink>
                        <NavLink
                            to="/colaboradores"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="pessoas" className="nav-icone" />
                            <span>Colaborações</span>
                        </NavLink>
                    </>
                )}

                {desenvolvedor && (
                    <>
                        <div className="nav-separador">Laboratório</div>
                        <NavLink
                            to="/laboratorio"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="configuracao" className="nav-icone" />
                            <span>Visão geral</span>
                        </NavLink>
                        {laboratorioId ? (
                            <>
                                <NavLink
                                    to={urlContexto("/turmas", laboratorioId)}
                                    className={() => classeContexto("/turmas", laboratorioId)}
                                >
                                    <Icone nome="instituicao" className="nav-icone" />
                                    <span>Turmas de teste</span>
                                </NavLink>
                                <NavLink
                                    to={urlContexto("/alunos", laboratorioId)}
                                    className={() => classeContexto("/alunos", laboratorioId)}
                                >
                                    <Icone nome="pessoas" className="nav-icone" />
                                    <span>Alunos de teste</span>
                                </NavLink>
                                <NavLink
                                    to={urlContexto("/coletas", laboratorioId)}
                                    className={() => classeContexto("/coletas", laboratorioId)}
                                >
                                    <Icone nome="coleta" className="nav-icone" />
                                    <span>Coletas de teste</span>
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <div
                                    className="nav-item subitem indisponivel"
                                    aria-disabled="true"
                                    title="Crie o laboratório de testes na Visão geral"
                                >
                                    <Icone nome="instituicao" className="nav-icone" />
                                    <span>Turmas de teste</span>
                                </div>
                                <div
                                    className="nav-item subitem indisponivel"
                                    aria-disabled="true"
                                    title="Crie o laboratório de testes na Visão geral"
                                >
                                    <Icone nome="pessoas" className="nav-icone" />
                                    <span>Alunos de teste</span>
                                </div>
                                <div
                                    className="nav-item subitem indisponivel"
                                    aria-disabled="true"
                                    title="Crie o laboratório de testes na Visão geral"
                                >
                                    <Icone nome="coleta" className="nav-icone" />
                                    <span>Coletas de teste</span>
                                </div>
                            </>
                        )}
                        <div className="nav-separador">Escolas reais</div>
                        <NavLink
                            to="/colaboradores"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="pessoas" className="nav-icone" />
                            <span>Colaborações</span>
                        </NavLink>
                    </>
                )}

                {!vinculoPendente && acessosCompartilhados.length > 0 && (
                    <>
                        {!desenvolvedor && (
                            <div className="nav-separador">Escolas compartilhadas</div>
                        )}
                        {acessosCompartilhados.map((acesso) => {
                            const id = acesso.institution?._id;
                            if (!id) return null;
                            return (
                                <div className="nav-escola-grupo" key={acesso._id}>
                                    <div
                                        className="nav-escola-nome"
                                        title={acesso.institution?.name}
                                    >
                                        {acesso.institution?.name}
                                    </div>
                                    <NavLink
                                        to={urlContexto("/turmas", id)}
                                        className={() => classeContexto("/turmas", id)}
                                    >
                                        <Icone nome="instituicao" className="nav-icone" />
                                        <span>Turmas</span>
                                    </NavLink>
                                    {acesso.permissions?.prepararColetas && (
                                        <NavLink
                                            to={urlContexto("/coletas", id)}
                                            className={() => classeContexto("/coletas", id)}
                                        >
                                            <Icone nome="coleta" className="nav-icone" />
                                            <span>Coletas</span>
                                        </NavLink>
                                    )}
                                    {acesso.permissions?.visualizarResultados && (
                                        <NavLink
                                            to={urlContexto("/alunos", id)}
                                            className={() => classeContexto("/alunos", id)}
                                        >
                                            <Icone nome="pessoas" className="nav-icone" />
                                            <span>Resultados</span>
                                        </NavLink>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                {vinculoPendente && (
                    <div className="sidebar-vinculo-pendente">
                        Vínculo institucional aguardando aprovação
                    </div>
                )}

            </nav>

            {/* Menu exclusivo para admin */}
            {usuario?.role === "admin" && (
                <>
                    <div className="nav-separador">Admin</div>

                    <NavLink
                        to="/admin/instituicoes"
                        className={({ isActive }) =>
                            isActive ? "nav-item ativo" : "nav-item"
                        }
                    >
                        <Icone nome="instituicao" className="nav-icone" />
                        <span>Instituições</span>
                    </NavLink>

                    <NavLink
                        to="/admin/usuarios"
                        className={({ isActive }) =>
                            isActive ? "nav-item ativo" : "nav-item"
                        }
                    >
                        <Icone nome="pessoas" className="nav-icone" />
                        <span>Usuários</span>
                    </NavLink>
                </>
            )}

            <ContaUsuario />

        </aside>
    );
}
