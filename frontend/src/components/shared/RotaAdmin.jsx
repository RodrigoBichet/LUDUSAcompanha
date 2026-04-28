// =============================================================================
// RotaAdmin.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Componente que protege rotas exclusivas de administrador.
// Redireciona para /login se não autenticado.
// Redireciona para / se autenticado mas sem permissão de admin.
// =============================================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RotaAdmin({ children }) {
    const { usuario, carregando } = useAuth();

    // Aguarda verificação do token antes de redirecionar
    if (carregando) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}
            >
                <div className="spinner" />
            </div>
        );
    }

    // Não autenticado — vai para o login
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    // Autenticado mas sem permissão admin — volta para home
    if (usuario.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}
