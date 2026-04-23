import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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

            {/* Usuário logado */}
            {usuario && (
                <div className="sidebar-usuario">
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
                </div>
            )}

            {/* Rodapé */}
            <div className="sidebar-rodape">
                <button className="btn-sair" onClick={logout}>
                    → Sair
                </button>
                <div className="texto-leve">UFPel — 2026</div>
                <div className="texto-leve">LUDUS Acompanha v1.0</div>
            </div>
        </aside>
    );
}
