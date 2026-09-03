import { useEffect, useRef } from "react";
import "./ConfirmacaoRemocao.css";

export default function ConfirmacaoRemocao({ alvo, ocupado, erro, onCancelar, onConfirmar }) {
    const dialogo = useRef(null);
    const cancelar = useRef(null);
    useEffect(() => {
        const origem = alvo.origemFoco;
        const elemento = dialogo.current;
        elemento.showModal();
        cancelar.current.focus();
        return () => {
            elemento.close();
            if (origem?.isConnected && !origem.disabled) origem.focus();
            else document.querySelector(".pagina-conteudo button:not(:disabled)")?.focus();
        };
    }, [alvo.origemFoco]);
    useEffect(() => {
        if (ocupado) dialogo.current.focus();
        else cancelar.current.focus();
    }, [ocupado]);
    return (
        <dialog ref={dialogo} className="confirmacao-remocao" tabIndex={-1}
            aria-labelledby="titulo-confirmacao-remocao" aria-describedby="descricao-confirmacao-remocao"
            aria-busy={ocupado} onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onCancelar();
            }}>
            <h2 id="titulo-confirmacao-remocao">{alvo.titulo}</h2>
            <p id="descricao-confirmacao-remocao"><strong>“{alvo.nome}”</strong></p>
            <p className="confirmacao-remocao-aviso">{alvo.descricao}</p>
            {erro && <p className="confirmacao-remocao-erro" role="alert">{erro}</p>}
            {ocupado && <p role="status">Processando a remoção. Aguarde…</p>}
            <div className="confirmacao-remocao-acoes">
                <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
                <button className="confirmar-remocao" type="button" disabled={ocupado} onClick={onConfirmar}>
                    {ocupado ? "Removendo…" : alvo.rotuloConfirmacao}
                </button>
            </div>
        </dialog>
    );
}
