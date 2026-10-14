import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./ContaUsuario.css";

const rotulosPapel = {
    admin: "Admin",
    professor: "Professor",
    developer: "Desenvolvedor",
};

export default function ContaUsuario() {
    const { usuario, logout } = useAuth();

    if (!usuario) return null;

    return (
        <div className="conta-usuario-topo" aria-label="Conta do usuário">
            <NavLink
                to="/perfil"
                className={({ isActive }) =>
                    isActive ? "conta-usuario-link ativo" : "conta-usuario-link"
                }
                title="Abrir perfil"
            >
                <span className="conta-usuario-avatar" aria-hidden="true">
                    {usuario.name?.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="conta-usuario-dados">
                    <strong>{usuario.name}</strong>
                    <small>{rotulosPapel[usuario.role] || "Usuário"}</small>
                </span>
            </NavLink>
            <button type="button" className="conta-usuario-sair" onClick={logout}>
                Sair
            </button>
        </div>
    );
}
