import { useState } from "react";
import { Link } from "react-router-dom";
import { solicitarRedefinicaoSenha } from "../services/api";
import "./Login.css";

export default function EsqueciSenha() {
    const [email, setEmail] = useState(""); const [resultado, setResultado] = useState(null);
    const [erro, setErro] = useState(""); const [carregando, setCarregando] = useState(false);
    const enviar = async (evento) => { evento.preventDefault(); setErro(""); try {
        setCarregando(true); const resposta = await solicitarRedefinicaoSenha(email); setResultado(resposta.data);
    } catch (falha) { setErro(falha.response?.data?.mensagem || "Não foi possível processar a solicitação."); } finally { setCarregando(false); } };
    return <div className="login-fundo"><div className="login-card">
        <h1 className="login-titulo">Recuperar senha</h1><p className="login-subtitulo texto-leve">Informe o e-mail usado no dashboard.</p>
        {resultado && <><div className="auth-sucesso">{resultado.mensagem}</div>{resultado.linkDesenvolvimento && <a className="login-btn auth-dev-link" href={resultado.linkDesenvolvimento}>Abrir redefinição de teste</a>}</>}
        <form className="login-form" onSubmit={enviar}><label className="campo-grupo"><span className="campo-label">E-mail</span><input type="email" className="campo-input" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={carregando}/></label>
        {erro && <div className="login-erro" role="alert">{erro}</div>}<button className="login-btn" disabled={carregando}>{carregando ? "Enviando..." : "Enviar instruções"}</button></form>
        <Link className="auth-link" to="/login">← Voltar ao login</Link>
    </div></div>;
}
