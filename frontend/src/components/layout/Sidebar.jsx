import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { textosAnonimos } from "../../config/modoAnonimo";
import logoLudus from "../../assets/logo-ludus.svg";
import Icone from "../shared/Icone";
import "./Sidebar.css";

export default function Sidebar() {
    const { usuario, logout } = useAuth();
    const vinculoPendente = Boolean(
        usuario?.role === "professor" &&
        !usuario?.institutionId &&
        usuario?.institutionRequest,
    );

    return (
        <aside className="sidebar" aria-label="Navegação principal">
            {/* Logo */}
            <div className="sidebar-logo">
                <img
                    src={logoLudus}
                    alt="LUDUS Acompanha"
                    className="sidebar-logo-img"
                />
            </div>

            {/* Navegação */}
            <nav className="sidebar-nav" aria-label="Seções do sistema">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <Icone nome="jogos" className="nav-icone" />
                    <span>Jogos</span>
                </NavLink>

                {!vinculoPendente && (
                    <>
                        <NavLink
                            to="/turmas"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="instituicao" className="nav-icone" />
                            <span>Instituições</span>
                        </NavLink>

                        <NavLink
                            to="/alunos"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="pessoas" className="nav-icone" />
                            <span>Alunos</span>
                        </NavLink>

                        <NavLink
                            to="/coletas"
                            className={({ isActive }) =>
                                isActive ? "nav-item ativo" : "nav-item"
                            }
                        >
                            <Icone nome="coleta" className="nav-icone" />
                            <span>Coletas</span>
                        </NavLink>
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

            {/* Usuário logado — clicável para ir ao perfil */}
            {usuario && (
                <NavLink
                    to="/perfil"
                    className={({ isActive }) =>
                        isActive ? "sidebar-usuario ativo" : "sidebar-usuario"
                    }
                >
                    <div className="usuario-avatar">
                        {usuario.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="usuario-info">
                        <div className="usuario-nome">{usuario.name}</div>
                        <div className="usuario-papel">
                            <Icone
                                nome={
                                    usuario.role === "admin"
                                        ? "configuracao"
                                        : "usuario"
                                }
                                tamanho={13}
                            />
                            {usuario.role === "admin" ? "Admin" : "Professor"}
                        </div>
                    </div>
                </NavLink>
            )}

            {/* Rodapé */}
            <div className="sidebar-rodape">
                <button className="btn-sair" onClick={logout}>
                    → Sair
                </button>
                <div className="texto-leve">
                    {textosAnonimos.sidebarInstitucional}
                </div>
                <div className="texto-leve">{textosAnonimos.sidebarVersao}</div>
            </div>
        </aside>
    );
}
