import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmarEmail, reenviarConfirmacao } from "../services/api";
import "./Login.css";

export default function ConfirmarEmail() {
    const [params] = useSearchParams(); const token = params.get("token") || ""; const executado = useRef(false);
    const [estado, setEstado] = useState(token ? "Confirmando seu e-mail..." : ""); const [erro, setErro] = useState("");
    const [email, setEmail] = useState(""); const [link, setLink] = useState(""); const [carregando, setCarregando] = useState(false);
    useEffect(() => { if (!token || executado.current) return; executado.current = true;
        confirmarEmail(token).then((r) => setEstado(r.data.mensagem)).catch((f) => { setEstado(""); setErro(f.response?.data?.mensagem || "Não foi possível confirmar o e-mail."); });
    }, [token]);
    const reenviar = async (evento) => { evento.preventDefault(); setErro(""); try { setCarregando(true); const r = await reenviarConfirmacao(email); setEstado(r.data.mensagem); setLink(r.data.linkDesenvolvimento || ""); } catch (f) { setErro(f.response?.data?.mensagem || "Não foi possível reenviar a confirmação."); } finally { setCarregando(false); } };
    return <div className="login-fundo"><div className="login-card"><h1 className="login-titulo">Confirmar e-mail</h1>
        {estado && <div className="auth-sucesso">{estado}</div>}{erro && <div className="login-erro" role="alert">{erro}</div>}
        {!token && <form className="login-form" onSubmit={reenviar}><p className="auth-ajuda">Se o link expirou, informe seu e-mail para solicitar outro.</p><input type="email" className="campo-input" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={carregando}/><button className="login-btn" disabled={carregando}>{carregando ? "Enviando..." : "Reenviar confirmação"}</button></form>}
        {link && <a className="login-btn auth-dev-link" href={link}>Abrir nova confirmação de teste</a>}<Link className="auth-link" to="/login">← Voltar ao login</Link>
    </div></div>;
}
