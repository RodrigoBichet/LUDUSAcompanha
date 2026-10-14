import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BotaoContato from "../shared/BotaoContato";
import MarcaLudus from "../shared/MarcaLudus";
import "./LayoutPublico.css";

export default function LayoutPublico({ children }) {
    const { usuario } = useAuth();
    const location = useLocation();
    const irParaSecao = (id) => () => {
        if (["/", "/inicio"].includes(location.pathname)) {
            window.requestAnimationFrame(() => {
                document.getElementById(id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        }
    };

    return (
        <div className="site-publico">
            <a className="atalho-conteudo" href="#conteudo-publico">
                Pular para o conteúdo principal
            </a>
            <header className="site-cabecalho">
                <Link className="site-marca-link" to="/inicio" aria-label="Ir para a página inicial">
                    <MarcaLudus compacta />
                </Link>
                <nav className="site-navegacao" aria-label="Navegação pública">
                    <Link to="/inicio#projeto" onClick={irParaSecao("projeto")}>O projeto</Link>
                    <Link to="/inicio#ferramentas" onClick={irParaSecao("ferramentas")}>Ferramentas e perfis</Link>
                    <Link to="/inicio#como-funciona" onClick={irParaSecao("como-funciona")}>Como funciona</Link>
                    <Link to="/inicio#maisludus" onClick={irParaSecao("maisludus")}>MaisLUDUS</Link>
                    <NavLink
                        to="/documentacao"
                        className={({ isActive }) => isActive ? "ativo" : undefined}
                    >
                        Documentação
                    </NavLink>
                    <NavLink
                        to="/privacidade"
                        className={({ isActive }) => isActive ? "ativo" : undefined}
                    >
                        Privacidade
                    </NavLink>
                </nav>
                <div className="site-acoes">
                    {usuario ? (
                        <Link className="site-acao-primaria" to="/">
                            Ir ao dashboard
                        </Link>
                    ) : (
                        <>
                            <Link className="site-acao-secundaria" to="/login">
                                Entrar
                            </Link>
                            <Link className="site-acao-primaria" to="/cadastro">
                                Criar conta
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main id="conteudo-publico">{children}</main>

            <footer className="site-rodape" id="maisludus">
                <div className="site-rodape-apresentacao">
                    <MarcaLudus clara compacta />
                    <p>
                        O MaisLUDUS é um grupo de pesquisa que está ligado à
                        Universidade Federal de Pelotas e que reúne estudos sobre
                        jogos, educação e tecnologia. Inserido nesse ecossistema, o
                        projeto apresentado neste site está sendo desenvolvido por
                        Rodrigo Bichet durante o mestrado em Ciência da Computação da
                        UFPel.
                    </p>
                    <div className="site-rodape-maisludus">
                        <a href="https://maisludus.com.br/projeto" target="_blank" rel="noreferrer">Conheça o projeto MaisLUDUS ↗</a>
                        <a href="https://maisludus.com.br/equipe/" target="_blank" rel="noreferrer">Equipe MaisLUDUS ↗</a>
                        <a href="https://maisludus.com.br/parceiros" target="_blank" rel="noreferrer">Parceiros ↗</a>
                    </div>
                </div>
                <div className="site-rodape-acoes">
                    <Link to="/documentacao">Documentação do SDK</Link>
                    <Link to="/privacidade">Privacidade</Link>
                    <BotaoContato className="site-rodape-contato" />
                </div>
            </footer>
        </div>
    );
}
