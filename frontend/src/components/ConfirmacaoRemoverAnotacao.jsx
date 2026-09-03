import { useEffect, useRef } from "react";
import "./ConfirmacaoRemoverAnotacao.css";

export default function ConfirmacaoRemoverAnotacao({ anotacao, ocupado, erro, focoAlternativo, onCancelar, onConfirmar }) {
    const dialogo = useRef(null);
    const cancelar = useRef(null);

    useEffect(() => {
        const origem = anotacao.origemFoco;
        const alternativa = focoAlternativo.current;
        const elemento = dialogo.current;
        elemento.showModal();
        cancelar.current.focus();
        return () => {
            elemento.close();
            if (origem?.isConnected && !origem.disabled) origem.focus();
            else if (alternativa?.isConnected) alternativa.focus();
        };
    }, [anotacao.origemFoco, focoAlternativo]);

    useEffect(() => {
        if (ocupado) dialogo.current.focus();
        else cancelar.current.focus();
    }, [ocupado]);

    return (
        <dialog
            ref={dialogo}
            className="confirmacao-remover-anotacao"
            tabIndex={-1}
            aria-labelledby="titulo-remover-anotacao"
            aria-describedby="descricao-remover-anotacao"
            aria-busy={ocupado}
            onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onCancelar();
            }}
        >
            <h2 id="titulo-remover-anotacao">Remover anotação?</h2>
            <p id="descricao-remover-anotacao">
                Esta anotação do professor será removida permanentemente.
            </p>
            <blockquote>{anotacao.texto}</blockquote>
            {erro && <p className="confirmacao-remover-anotacao-erro" role="alert">{erro}</p>}
            {ocupado && <p role="status">Removendo anotação. Aguarde…</p>}
            <div className="confirmacao-remover-anotacao-acoes">
                <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
                <button className="confirmar-remocao" type="button" disabled={ocupado} onClick={onConfirmar}>
                    {ocupado ? "Removendo…" : "Remover anotação"}
                </button>
            </div>
        </dialog>
    );
}
