// =============================================================================
// Perfil.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Tela de perfil — qualquer usuário logado pode editar seus dados e senha.
// =============================================================================

import { useState } from "react";
import Header from "../components/layout/Header";
import { useAuth } from "../contexts/AuthContext";
import { atualizarPerfil } from "../services/api";
import "./Perfil.css";

export default function Perfil() {
    const { usuario, setUsuario } = useAuth();

    // -------------------------------------------------------------------------
    // Estado — dados pessoais
    // -------------------------------------------------------------------------
    const [nome, setNome] = useState(usuario?.name || "");
    const [email, setEmail] = useState(usuario?.email || "");
    const [salvandoDados, setSalvandoDados] = useState(false);
    const [erroDados, setErroDados] = useState(null);
    const [sucessoDados, setSucessoDados] = useState(null);

    // -------------------------------------------------------------------------
    // Estado — troca de senha
    // -------------------------------------------------------------------------
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [erroSenha, setErroSenha] = useState(null);
    const [sucessoSenha, setSucessoSenha] = useState(null);

    // -------------------------------------------------------------------------
    // Salva dados pessoais (nome e email)
    // -------------------------------------------------------------------------
    const salvarDados = async () => {
        if (!nome.trim() || !email.trim()) {
            setErroDados("Nome e email são obrigatórios.");
            return;
        }

        try {
            setSalvandoDados(true);
            setErroDados(null);
            setSucessoDados(null);

            const res = await atualizarPerfil({
                name: nome.trim(),
                email: email.trim(),
            });

            // Atualiza o nome exibido na sidebar sem precisar relogar
            if (setUsuario) {
                setUsuario((prev) => ({
                    ...prev,
                    name: res.data.usuario.name,
                    email: res.data.usuario.email,
                }));
            }

            setSucessoDados(res.data.mensagem);
        } catch (err) {
            const msg = err.response?.data?.mensagem;
            setErroDados(msg || "Erro ao atualizar dados. Tente novamente.");
        } finally {
            setSalvandoDados(false);
        }
    };

    // -------------------------------------------------------------------------
    // Salva nova senha
    // -------------------------------------------------------------------------
    const salvarSenha = async () => {
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setErroSenha("Preencha todos os campos de senha.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setErroSenha("A nova senha e a confirmação não coincidem.");
            return;
        }

        if (novaSenha.length < 6) {
            setErroSenha("A nova senha deve ter no mínimo 6 caracteres.");
            return;
        }

        try {
            setSalvandoSenha(true);
            setErroSenha(null);
            setSucessoSenha(null);

            const res = await atualizarPerfil({ senhaAtual, novaSenha });

            setSucessoSenha(res.data.mensagem);
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");
        } catch (err) {
            const msg = err.response?.data?.mensagem;
            setErroSenha(msg || "Erro ao atualizar senha. Tente novamente.");
        } finally {
            setSalvandoSenha(false);
        }
    };

    return (
        <div>
            <Header
                titulo="Meu Perfil"
                subtitulo="Gerencie seus dados e senha de acesso"
            />

            <div className="pagina-conteudo perfil-conteudo">
                {/* Card de identificação */}
                <div className="card perfil-identidade">
                    <div className="perfil-avatar">
                        {usuario?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="perfil-nome">{usuario?.name}</p>
                        <p className="texto-leve">{usuario?.email}</p>
                        <p className="perfil-role">
                            {usuario?.role === "admin"
                                ? "⚙️ Administrador"
                                : "👨‍🏫 Professor"}
                        </p>
                    </div>
                </div>

                <div className="perfil-formularios">
                    {/* Formulário — dados pessoais */}
                    <div className="card perfil-formulario-card">
                        <h3 className="form-titulo">Dados pessoais</h3>

                        <div className="perfil-form-campos">
                            <div className="campo-grupo">
                                <label className="campo-label">Nome *</label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div className="campo-grupo">
                                <label className="campo-label">Email *</label>
                                <input
                                    className="campo-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                    </div>

                    {erroDados && <p className="form-erro">⚠️ {erroDados}</p>}
                    {sucessoDados && (
                        <p className="form-sucesso">✅ {sucessoDados}</p>
                    )}

                    <div className="form-acoes">
                        <button
                            className="btn-primario"
                            onClick={salvarDados}
                            disabled={salvandoDados}
                        >
                            {salvandoDados ? "Salvando..." : "Salvar dados"}
                        </button>
                    </div>
                </div>

                {/* Formulário — troca de senha */}
                <div className="card perfil-formulario-card">
                    <h3 className="form-titulo">Alterar senha</h3>

                    <div className="perfil-senha-campos">
                        <div className="campo-grupo perfil-senha-atual">
                            <label className="campo-label">Senha atual *</label>
                            <input
                                className="campo-input"
                                type="password"
                                placeholder="Sua senha atual"
                                value={senhaAtual}
                                onChange={(e) => setSenhaAtual(e.target.value)}
                            />
                        </div>
                        <div className="campo-grupo">
                            <label className="campo-label">Nova senha *</label>
                            <input
                                className="campo-input"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                            />
                        </div>
                        <div className="campo-grupo">
                            <label className="campo-label">
                                Confirmar nova senha *
                            </label>
                            <input
                                className="campo-input"
                                type="password"
                                placeholder="Repita a nova senha"
                                value={confirmarSenha}
                                onChange={(e) =>
                                    setConfirmarSenha(e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {erroSenha && <p className="form-erro">⚠️ {erroSenha}</p>}
                    {sucessoSenha && (
                        <p className="form-sucesso">✅ {sucessoSenha}</p>
                    )}

                    <div className="form-acoes">
                        <button
                            className="btn-primario"
                            onClick={salvarSenha}
                            disabled={salvandoSenha}
                        >
                            {salvandoSenha ? "Salvando..." : "Alterar senha"}
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
