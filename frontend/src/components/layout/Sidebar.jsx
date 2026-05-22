import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { textosAnonimos } from "../../config/modoAnonimo";
import "./Sidebar.css";

export default function Sidebar() {
    const { usuario, logout } = useAuth();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <span className="logo-icone">🎮</span>
                <div>
                    <div className="logo-titulo">LUDUS</div>
                    <div className="logo-subtitulo">Acompanha</div>
                </div>
            </div>

            {/* Navegação */}
            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <span className="nav-icone">📊</span>
                    <span>Visão Geral</span>
                </NavLink>

                <NavLink
                    to="/turmas"
                    className={({ isActive }) =>
                        isActive ? "nav-item ativo" : "nav-item"
                    }
                >
                    <span className="nav-icone">📚</span>
                    <span>Minhas Turmas</span>
                </NavLink>
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
                        <span className="nav-icone">🏫</span>
                        <span>Instituições</span>
                    </NavLink>

                    <NavLink
                        to="/admin/usuarios"
                        className={({ isActive }) =>
                            isActive ? "nav-item ativo" : "nav-item"
                        }
                    >
                        <span className="nav-icone">👥</span>
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
                            {usuario.role === "admin"
                                ? "⚙️ Admin"
                                : "👨‍🏫 Professor"}
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
