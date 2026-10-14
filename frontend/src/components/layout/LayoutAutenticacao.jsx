import { Link } from "react-router-dom";
import ApresentacaoAutenticacao from "../shared/ApresentacaoAutenticacao";
import BotaoContato from "../shared/BotaoContato";
import MarcaLudus from "../shared/MarcaLudus";

export default function LayoutAutenticacao({ children, cadastro = false }) {
    return (
        <div className={`login-fundo${cadastro ? " login-fundo-cadastro" : ""}`}>
            <ApresentacaoAutenticacao cadastro={cadastro} />
            <main className="auth-formulario-area">
                <div className={`login-card${cadastro ? " cadastro-card" : ""}`}>
                    <Link
                        className="login-marca"
                        to="/"
                        aria-label="Voltar para a página inicial"
                    >
                        <MarcaLudus />
                    </Link>
                    {children}
                    <div className="auth-contato">
                        <span>Projeto de mestrado · UFPel · 2026</span>
                        <BotaoContato />
                    </div>
                </div>
            </main>
        </div>
    );
}
