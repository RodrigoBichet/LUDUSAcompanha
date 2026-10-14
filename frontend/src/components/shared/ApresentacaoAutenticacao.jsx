import { Link } from "react-router-dom";
import MarcaLudus from "./MarcaLudus";

export default function ApresentacaoAutenticacao() {
    return (
        <aside className="auth-apresentacao">
            <Link to="/" className="auth-apresentacao-marca" aria-label="Voltar para a página inicial">
                <MarcaLudus clara />
            </Link>
            <div className="auth-apresentacao-conteudo">
                <h1>Bem-vindo(a)!</h1>
                <p>Acompanhe e registre as atividades dos seus jogos</p>
            </div>
            <Link className="auth-apresentacao-link" to="/documentacao">
                Conhecer a documentação →
            </Link>
        </aside>
    );
}
