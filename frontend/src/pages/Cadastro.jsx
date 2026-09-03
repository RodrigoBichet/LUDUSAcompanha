import { useState } from "react";
import { Link } from "react-router-dom";
import { cadastrarConta } from "../services/api";
import "./Login.css";

export default function Cadastro() {
    const [dados, setDados] = useState({ name: "", email: "", institutionName: "", institutionCity: "", password: "", confirmar: "" });
    const [erro, setErro] = useState("");
    const [resultado, setResultado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const alterar = (campo) => (evento) => setDados((atual) => ({ ...atual, [campo]: evento.target.value }));

    const enviar = async (evento) => {
        evento.preventDefault(); setErro("");
        if (dados.password !== dados.confirmar) return setErro("As senhas informadas não são iguais.");
        try {
            setCarregando(true);
            const resposta = await cadastrarConta({
                name: dados.name,
                email: dados.email,
                institutionName: dados.institutionName,
                institutionCity: dados.institutionCity,
                password: dados.password,
            });
            setResultado(resposta.data);
        } catch (erroCadastro) {
            setErro(erroCadastro.response?.data?.mensagem || "Não foi possível criar a conta.");
        } finally { setCarregando(false); }
    };

    return <div className="login-fundo"><div className="login-card">
        <h1 className="login-titulo">Criar conta de professora</h1>
        <p className="login-subtitulo texto-leve">Após confirmar seu e-mail, uma pessoa administradora poderá vincular sua conta à instituição.</p>
        {resultado ? <div className="auth-acoes">
            <div className="auth-sucesso">{resultado.mensagem}</div>
            {resultado.linkDesenvolvimento && <a className="login-btn auth-dev-link" href={resultado.linkDesenvolvimento}>Abrir confirmação de teste</a>}
            <Link className="auth-link" to="/login">Voltar ao login</Link>
        </div> : <form className="login-form" onSubmit={enviar}>
            <label className="campo-grupo"><span className="campo-label">Nome completo</span><input className="campo-input" value={dados.name} onChange={alterar("name")} required disabled={carregando}/></label>
            <label className="campo-grupo"><span className="campo-label">E-mail</span><input type="email" className="campo-input" value={dados.email} onChange={alterar("email")} required disabled={carregando}/></label>
            <label className="campo-grupo"><span className="campo-label">Instituição</span><input className="campo-input" placeholder="Nome da escola ou instituição" maxLength="160" value={dados.institutionName} onChange={alterar("institutionName")} required disabled={carregando}/><small className="auth-ajuda">A administradora confirmará o vínculo depois do cadastro.</small></label>
            <label className="campo-grupo"><span className="campo-label">Cidade da instituição</span><input className="campo-input" placeholder="Cidade (opcional)" maxLength="120" value={dados.institutionCity} onChange={alterar("institutionCity")} disabled={carregando}/></label>
            <label className="campo-grupo"><span className="campo-label">Senha</span><input type="password" minLength="8" className="campo-input" value={dados.password} onChange={alterar("password")} required disabled={carregando}/><small className="auth-ajuda">Use pelo menos 8 caracteres.</small></label>
            <label className="campo-grupo"><span className="campo-label">Repita a senha</span><input type="password" minLength="8" className="campo-input" value={dados.confirmar} onChange={alterar("confirmar")} required disabled={carregando}/></label>
            {erro && <div className="login-erro" role="alert">{erro}</div>}
            <button className="login-btn" disabled={carregando}>{carregando ? "Criando conta..." : "Criar conta"}</button>
        </form>}
        <p className="auth-alternativa">Já possui conta? <Link className="auth-link" to="/login">Entrar</Link></p>
    </div></div>;
}
