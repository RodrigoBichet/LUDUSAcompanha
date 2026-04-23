// =============================================================================
// AuthContext.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Contexto global de autenticação.
// Gerencia token JWT, dados do usuário logado e funções de login/logout.
// =============================================================================

import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Ao iniciar, verifica se há token salvo e carrega o usuário
    useEffect(() => {
        const token = localStorage.getItem("ludus_token");

        if (!token) {
            setCarregando(false);
            return;
        }

        // Configura o token no header padrão do axios
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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
    }, []);

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
        <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar o contexto facilmente
export function useAuth() {
    return useContext(AuthContext);
}
