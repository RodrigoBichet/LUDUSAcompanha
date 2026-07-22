// =============================================================================
// AuthProvider.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Provider global de autenticação.
// Gerencia token JWT, dados do usuário logado e funções de login/logout.
// =============================================================================

import { useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
    const [tokenInicial] = useState(() => localStorage.getItem("ludus_token"));
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(Boolean(tokenInicial));

    // Ao iniciar, verifica se há token salvo e carrega o usuário
    useEffect(() => {
        if (!tokenInicial) return;

        // Configura o token no header padrão do axios
        api.defaults.headers.common["Authorization"] = `Bearer ${tokenInicial}`;

        // Busca dados do usuário logado
        api.get("/auth/me")
            .then((res) => {
                setUsuario(res.data.usuario);
            })
            .catch(() => {
                // Token inválido ou expirado — limpa tudo
                localStorage.removeItem("ludus_token");
                delete api.defaults.headers.common["Authorization"];
            })
            .finally(() => setCarregando(false));
    }, [tokenInicial]);

    // -------------------------------------------------------------------------
    // login — salva token e carrega dados do usuário
    // -------------------------------------------------------------------------
    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });

        const { token, usuario } = res.data;

        localStorage.setItem("ludus_token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUsuario(usuario);

        return usuario;
    };

    // -------------------------------------------------------------------------
    // logout — limpa token e dados
    // -------------------------------------------------------------------------
    const logout = () => {
        localStorage.removeItem("ludus_token");
        delete api.defaults.headers.common["Authorization"];
        setUsuario(null);
    };

    return (
        <AuthContext.Provider
            value={{ usuario, setUsuario, carregando, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}
