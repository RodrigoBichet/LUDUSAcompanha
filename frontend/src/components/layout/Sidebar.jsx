import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
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
            </nav>

            {/* Rodapé */}
            <div className="sidebar-rodape">
                <div className="texto-leve">UFPel — 2026</div>
                <div className="texto-leve">LUDUS Acompanha v1.0</div>
            </div>
        </aside>
    );
}
