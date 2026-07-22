// =============================================================================
// Login.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Tela de login do dashboard.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { textosAnonimos } from "../config/modoAnonimo";
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const { login } = useAuth();
    const navegar = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            await login(email, password);
            navegar("/");
        } catch {
            setErro("Email ou senha incorretos. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-fundo">
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <span className="login-logo-icone">🎮</span>
                    <div>
                        <div className="login-logo-titulo">LUDUS</div>
                        <div className="login-logo-subtitulo">ACOMPANHA</div>
                    </div>
                </div>

                <h2 className="login-titulo">Entrar no dashboard</h2>
                <p className="login-subtitulo texto-leve">
                    Acesse com suas credenciais de professor ou administrador
                </p>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="campo-grupo">
                        <label className="campo-label">Email</label>
                        <input
                            type="email"
                            className="campo-input"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={carregando}
                        />
                    </div>

                    <div className="campo-grupo">
                        <label className="campo-label">Senha</label>
                        <input
                            type="password"
                            className="campo-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={carregando}
                        />
                    </div>

                    {/* Mensagem de erro */}
                    {erro && <div className="login-erro">⚠️ {erro}</div>}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={carregando}
                    >
                        {carregando ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <p className="login-rodape texto-leve">
                    {textosAnonimos.loginRodape}
                </p>
            </div>
        </div>
    );
}
