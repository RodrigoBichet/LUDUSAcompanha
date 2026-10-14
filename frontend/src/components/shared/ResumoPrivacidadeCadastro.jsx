import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icone from "./Icone";
import "./ResumoPrivacidadeCadastro.css";

export const VERSAO_AVISO_PRIVACIDADE = "2026-10-09";

export default function ResumoPrivacidadeCadastro({ aberto, onClose, onConcluir }) {
    const conteudoRef = useRef(null);
    const [leituraConcluida, setLeituraConcluida] = useState(false);

    useEffect(() => {
        if (!aberto) return undefined;
        const fecharComEscape = (evento) => {
            if (evento.key === "Escape") onClose();
        };
        document.addEventListener("keydown", fecharComEscape);
        return () => document.removeEventListener("keydown", fecharComEscape);
    }, [aberto, onClose]);

    if (!aberto) return null;

    const acompanharRolagem = () => {
        const elemento = conteudoRef.current;
        if (!elemento) return;
        const chegouAoFim =
            elemento.scrollTop + elemento.clientHeight >= elemento.scrollHeight - 8;
        if (chegouAoFim) setLeituraConcluida(true);
    };

    return (
        <div className="modal-fundo" role="presentation">
            <section
                className="privacidade-resumo-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="privacidade-resumo-titulo"
            >
                <button
                    type="button"
                    className="modal-fechar"
                    aria-label="Fechar aviso de privacidade"
                    onClick={onClose}
                >
                    <Icone nome="fechar" tamanho={19} />
                </button>
                <span className="privacidade-resumo-etiqueta">Antes de criar a conta</span>
                <h2 id="privacidade-resumo-titulo">Privacidade e uso responsável</h2>
                <p className="privacidade-resumo-instrucao">
                    Leia o resumo até o final para liberar a confirmação.
                </p>

                <div
                    ref={conteudoRef}
                    className="privacidade-resumo-conteudo"
                    tabIndex="0"
                    onScroll={acompanharRolagem}
                >
                    <h3>O que o cadastro guarda</h3>
                    <p>
                        A conta registra nome, e-mail, perfil de acesso e, para
                        professores, a instituição solicitada. A senha é armazenada
                        de forma protegida por hash.
                    </p>
                    <h3>O que as ferramentas podem registrar</h3>
                    <p>
                        O SDK LUDUS, o LUDUS Observa e o dashboard podem tratar
                        interações da atividade, duração, trajetórias, eventos
                        informados pelo jogo e capturas visuais opcionais. Cada coleta
                        deve ter finalidade definida e usar somente o necessário.
                    </p>
                    <h3>Limite pedagógico</h3>
                    <p>
                        O LUDUS Acompanha oferece evidências parciais para a observação
                        do professor. Ele não diagnostica, não classifica clinicamente
                        e não mede aprendizagem de forma conclusiva.
                    </p>
                    <h3>Responsabilidades e direitos</h3>
                    <p>
                        Ao trabalhar com participantes reais, utilize somente dados
                        autorizados, evite informações clínicas ou familiares
                        desnecessárias e habilite imagens apenas com finalidade e
                        autorização adequadas. A aceitação deste aviso confirma que
                        você conhece esses cuidados, mas não substitui as autorizações
                        institucionais, o consentimento ou o assentimento aplicáveis.
                        No laboratório de testes, utilize sempre dados fictícios.
                        Solicitações sobre acesso, correção ou eliminação serão tratadas
                        pelo canal do projeto e pela instituição responsável pela aplicação.
                    </p>
                    <p className="privacidade-resumo-final">
                        O aviso completo explica as três ferramentas, os tipos de dados,
                        acessos, segurança, limitações atuais e referências da LGPD e da
                        ética em pesquisa.
                    </p>
                </div>

                <div className="privacidade-resumo-acoes">
                    <Link to="/privacidade" target="_blank" rel="noreferrer">
                        Abrir aviso completo
                    </Link>
                    <button
                        type="button"
                        disabled={!leituraConcluida}
                        onClick={onConcluir}
                    >
                        {leituraConcluida
                            ? "Concluir leitura"
                            : "Role até o final para continuar"}
                    </button>
                </div>
            </section>
        </div>
    );
}
