import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { redefinirSenha } from "../services/api";
import "./Login.css";

export default function RedefinirSenha() {
    const [params] = useSearchParams(); const token = params.get("token") || "";
    const [senha, setSenha] = useState(""); const [confirmacao, setConfirmacao] = useState("");
    const [mensagem, setMensagem] = useState(""); const [erro, setErro] = useState(""); const [carregando, setCarregando] = useState(false);
    const enviar = async (evento) => { evento.preventDefault(); setErro(""); if (senha !== confirmacao) return setErro("As senhas informadas não são iguais."); try {
        setCarregando(true); const resposta = await redefinirSenha(token, senha); setMensagem(resposta.data.mensagem);
    } catch (falha) { setErro(falha.response?.data?.mensagem || "Não foi possível redefinir a senha."); } finally { setCarregando(false); } };
    return <div className="login-fundo"><div className="login-card"><h1 className="login-titulo">Criar nova senha</h1>
        {!token && <div className="login-erro">O link não contém um código de recuperação.</div>}
        {mensagem ? <><div className="auth-sucesso">{mensagem}</div><Link className="login-btn auth-dev-link" to="/login">Entrar</Link></> : <form className="login-form" onSubmit={enviar}>
            <label className="campo-grupo"><span className="campo-label">Nova senha</span><input type="password" minLength="8" className="campo-input" value={senha} onChange={(e) => setSenha(e.target.value)} required disabled={carregando || !token}/><small className="auth-ajuda">Use pelo menos 8 caracteres.</small></label>
            <label className="campo-grupo"><span className="campo-label">Repita a nova senha</span><input type="password" minLength="8" className="campo-input" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required disabled={carregando || !token}/></label>
            {erro && <div className="login-erro" role="alert">{erro}</div>}<button className="login-btn" disabled={carregando || !token}>{carregando ? "Salvando..." : "Salvar nova senha"}</button>
        </form>}<Link className="auth-link" to="/login">← Voltar ao login</Link></div></div>;
}
