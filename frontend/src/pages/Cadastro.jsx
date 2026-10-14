import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cadastrarConta } from "../services/api";
import LayoutAutenticacao from "../components/layout/LayoutAutenticacao";
import ResumoPrivacidadeCadastro, {
    VERSAO_AVISO_PRIVACIDADE,
} from "../components/shared/ResumoPrivacidadeCadastro";
import "./Login.css";

const DADOS_INICIAIS = {
    role: "professor",
    name: "",
    email: "",
    institutionName: "",
    institutionCity: "",
    password: "",
    confirmar: "",
};

export default function Cadastro() {
    const [parametros] = useSearchParams();
    const [dados, setDados] = useState(() => ({
        ...DADOS_INICIAIS,
        role: parametros.get("perfil") === "developer" ? "developer" : "professor",
    }));
    const [erro, setErro] = useState("");
    const [resultado, setResultado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [privacidadeAberta, setPrivacidadeAberta] = useState(false);
    const [privacidadeLida, setPrivacidadeLida] = useState(false);
    const [privacidadeAceita, setPrivacidadeAceita] = useState(false);
    const desenvolvedor = dados.role === "developer";

    const alterar = (campo) => (evento) =>
        setDados((atual) => ({ ...atual, [campo]: evento.target.value }));

    const selecionarPerfil = (role) => {
        setDados((atual) => ({
            ...atual,
            role,
            ...(role === "developer" && {
                institutionName: "",
                institutionCity: "",
            }),
        }));
        setErro("");
    };

    const enviar = async (evento) => {
        evento.preventDefault();
        setErro("");
        if (dados.password !== dados.confirmar) {
            setErro("As senhas informadas não são iguais.");
            return;
        }
        if (!privacidadeAceita) {
            setErro("Leia e aceite o aviso de privacidade antes de criar a conta.");
            return;
        }

        try {
            setCarregando(true);
            const resposta = await cadastrarConta({
                role: dados.role,
                name: dados.name,
                email: dados.email,
                password: dados.password,
                privacyAccepted: true,
                privacyNoticeVersion: VERSAO_AVISO_PRIVACIDADE,
                ...(!desenvolvedor && {
                    institutionName: dados.institutionName,
                    institutionCity: dados.institutionCity,
                }),
            });
            setResultado(resposta.data);
        } catch (erroCadastro) {
            setErro(
                erroCadastro.response?.data?.mensagem ||
                    "Não foi possível criar a conta.",
            );
        } finally {
            setCarregando(false);
        }
    };

    return (
        <LayoutAutenticacao cadastro>
                <h1 className="login-titulo">Criar conta</h1>
                <p className="login-subtitulo texto-leve">
                    Escolha como você utilizará o LUDUS Acompanha.
                </p>

                {resultado ? (
                    <div className="auth-acoes">
                        <div className="auth-sucesso">{resultado.mensagem}</div>
                        {resultado.linkDesenvolvimento && (
                            <a
                                className="login-btn auth-dev-link"
                                href={resultado.linkDesenvolvimento}
                            >
                                Abrir confirmação de teste
                            </a>
                        )}
                        <Link className="auth-link" to="/login">
                            Voltar ao login
                        </Link>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={enviar}>
                        <fieldset className="cadastro-perfis" disabled={carregando}>
                            <legend className="campo-label">Tipo de conta</legend>
                            <button
                                type="button"
                                className={
                                    dados.role === "professor"
                                        ? "cadastro-perfil ativo"
                                        : "cadastro-perfil"
                                }
                                aria-pressed={dados.role === "professor"}
                                onClick={() => selecionarPerfil("professor")}
                            >
                                <strong>Professor(a)</strong>
                                <span>
                                    Acompanha turmas, alunos, coletas e indicadores.
                                </span>
                            </button>
                            <button
                                type="button"
                                className={
                                    desenvolvedor
                                        ? "cadastro-perfil ativo"
                                        : "cadastro-perfil"
                                }
                                aria-pressed={desenvolvedor}
                                onClick={() => selecionarPerfil("developer")}
                            >
                                <strong>Desenvolvedor(a)</strong>
                                <span>
                                    Integra jogos ao LUDUS sem acessar dados escolares.
                                </span>
                            </button>
                        </fieldset>

                        <div className="auth-contexto-perfil" role="status">
                            <strong>
                                {desenvolvedor
                                    ? "Conta de desenvolvedor"
                                    : "Conta de professor"}
                            </strong>
                            <span>
                                {desenvolvedor
                                    ? "Você poderá cadastrar e configurar seus próprios jogos."
                                    : "Você poderá organizar turmas, alunos, coletas e consultar os registros das atividades. Após confirmar o e-mail, aguarde: uma pessoa administradora precisará vincular sua conta à instituição antes de liberar esses recursos."}
                            </span>
                        </div>

                        <label className="campo-grupo">
                            <span className="campo-label">Nome completo</span>
                            <input
                                className="campo-input"
                                value={dados.name}
                                onChange={alterar("name")}
                                required
                                maxLength="160"
                                disabled={carregando}
                            />
                        </label>
                        <label className="campo-grupo">
                            <span className="campo-label">E-mail</span>
                            <input
                                type="email"
                                className="campo-input"
                                value={dados.email}
                                onChange={alterar("email")}
                                required
                                disabled={carregando}
                            />
                        </label>

                        {!desenvolvedor && (
                            <>
                                <label className="campo-grupo">
                                    <span className="campo-label">Instituição</span>
                                    <input
                                        className="campo-input"
                                        placeholder="Nome da escola ou instituição"
                                        maxLength="160"
                                        value={dados.institutionName}
                                        onChange={alterar("institutionName")}
                                        required
                                        disabled={carregando}
                                    />
                                    <small className="auth-ajuda">
                                        Depois do cadastro e da confirmação do e-mail,
                                        aguarde a análise do vínculo institucional.
                                    </small>
                                </label>
                                <label className="campo-grupo">
                                    <span className="campo-label">
                                        Cidade da instituição
                                    </span>
                                    <input
                                        className="campo-input"
                                        placeholder="Cidade (opcional)"
                                        maxLength="120"
                                        value={dados.institutionCity}
                                        onChange={alterar("institutionCity")}
                                        disabled={carregando}
                                    />
                                </label>
                            </>
                        )}

                        <label className="campo-grupo">
                            <span className="campo-label">Senha</span>
                            <input
                                type="password"
                                minLength="8"
                                className="campo-input"
                                value={dados.password}
                                onChange={alterar("password")}
                                required
                                disabled={carregando}
                            />
                            <small className="auth-ajuda">
                                Use pelo menos 8 caracteres.
                            </small>
                        </label>

                        <label className="campo-grupo">
                            <span className="campo-label">Repita a senha</span>
                            <input
                                type="password"
                                minLength="8"
                                className="campo-input"
                                value={dados.confirmar}
                                onChange={alterar("confirmar")}
                                required
                                disabled={carregando}
                            />
                        </label>

                        <div className="cadastro-privacidade">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={privacidadeAceita}
                                    disabled={!privacidadeLida || carregando}
                                    onChange={(evento) =>
                                        setPrivacidadeAceita(evento.target.checked)
                                    }
                                />
                                <span>
                                    Li e aceito o aviso de privacidade e uso responsável.
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setPrivacidadeAberta(true)}
                            >
                                {privacidadeLida ? "Ler novamente" : "Ler para liberar o aceite"}
                            </button>
                        </div>

                        {erro && (
                            <div className="login-erro" role="alert">
                                {erro}
                            </div>
                        )}
                        <button className="login-btn" disabled={carregando}>
                            {carregando ? "Criando conta..." : "Criar conta"}
                        </button>
                    </form>
                )}

                <p className="auth-alternativa">
                    Já possui conta?{" "}
                    <Link className="auth-link" to="/login">
                        Entrar
                    </Link>
                </p>
                <ResumoPrivacidadeCadastro
                    aberto={privacidadeAberta}
                    onClose={() => setPrivacidadeAberta(false)}
                    onConcluir={() => {
                        setPrivacidadeLida(true);
                        setPrivacidadeAberta(false);
                    }}
                />
        </LayoutAutenticacao>
    );
}
