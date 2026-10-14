import { useEffect, useState } from "react";
import Icone from "./Icone";
import "./BotaoContato.css";

const EMAIL_CONTATO = "rodrigobichet39@gmail.com";

export default function BotaoContato({ className = "" }) {
    const [aberto, setAberto] = useState(false);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (!aberto) return undefined;
        const fecharComEscape = (evento) => {
            if (evento.key === "Escape") setAberto(false);
        };
        document.addEventListener("keydown", fecharComEscape);
        return () => document.removeEventListener("keydown", fecharComEscape);
    }, [aberto]);

    const copiarEmail = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL_CONTATO);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1800);
        } catch {
            setCopiado(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`contato-acionador ${className}`.trim()}
                onClick={() => setAberto(true)}
            >
                Entrar em contato
            </button>

            {aberto && (
                <div
                    className="modal-fundo"
                    role="presentation"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) setAberto(false);
                    }}
                >
                    <section
                        className="contato-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contato-titulo"
                    >
                        <button
                            type="button"
                            className="modal-fechar"
                            aria-label="Fechar contato"
                            onClick={() => setAberto(false)}
                        >
                            <Icone nome="fechar" tamanho={19} />
                        </button>
                        <span className="contato-modal-etiqueta">Contato do projeto</span>
                        <h2 id="contato-titulo">Fale conosco</h2>
                        <p>
                            Para dúvidas sobre o LUDUS Acompanha, documentação,
                            privacidade ou colaboração acadêmica, escreva para o
                            projeto. A mensagem será recebida por Rodrigo Bichet.
                        </p>
                        <div className="contato-email">
                            <span>{EMAIL_CONTATO}</span>
                            <button type="button" onClick={copiarEmail}>
                                {copiado ? "Copiado!" : "Copiar"}
                            </button>
                        </div>
                        <p className="contato-copiado" role="status" aria-live="polite">
                            {copiado ? "Endereço copiado para a área de transferência." : ""}
                        </p>
                    </section>
                </div>
            )}
        </>
    );
}
