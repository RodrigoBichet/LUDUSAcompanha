import { useEffect, useRef } from "react";
import "./ConfirmacaoHistorico.css";

export default function ConfirmacaoHistorico({ nome, quantidade, ocupado, erro, onCancelar, onConfirmar, focoAlternativo }) {
    const dialogo = useRef(null);
    const cancelar = useRef(null);

    useEffect(() => {
        const origem = document.activeElement;
        const alternativa = focoAlternativo.current;
        const elemento = dialogo.current;
        elemento.showModal();
        cancelar.current.focus();
        return () => {
            elemento.close();
            if (origem?.isConnected && !origem.disabled) origem.focus();
            else if (alternativa?.isConnected) alternativa.focus();
        };
    }, [focoAlternativo]);

    useEffect(() => {
        if (ocupado) dialogo.current.focus();
        else cancelar.current.focus();
    }, [ocupado]);

    return (
        <dialog
            ref={dialogo}
            className="confirmacao-historico"
            tabIndex={-1}
            aria-labelledby="titulo-confirmacao-historico"
            aria-describedby="descricao-confirmacao-historico"
            aria-busy={ocupado}
            onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onCancelar();
            }}
        >
            <h2 id="titulo-confirmacao-historico">Adicionar ao histórico?</h2>
            <p id="descricao-confirmacao-historico">
                Você vai adicionar <strong>{quantidade} {quantidade === 1 ? "sessão" : "sessões"}</strong> ao histórico de <strong>{nome}</strong>.
            </p>
            <p className="confirmacao-historico-ajuda">Cada jogo será mantido separado. Confira o aluno antes de confirmar.</p>
            {erro && <p className="confirmacao-historico-erro" role="alert">{erro}</p>}
            {ocupado && <p role="status">Adicionando sessões. Aguarde a confirmação…</p>}
            <div className="confirmacao-historico-acoes">
                <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
                <button className="confirmacao-historico-confirmar" type="button" disabled={ocupado} onClick={onConfirmar}>
                    {ocupado ? "Adicionando…" : "Adicionar ao histórico"}
                </button>
            </div>
        </dialog>
    );
}
