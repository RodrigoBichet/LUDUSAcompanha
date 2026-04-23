// =============================================================================
// RotaProtegida.jsx
// LUDUS Acompanha — UFPel (2026)
//
// Componente que protege rotas — redireciona para login se não autenticado.
// =============================================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RotaProtegida({ children }) {
    const { usuario, carregando } = useAuth();

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

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
