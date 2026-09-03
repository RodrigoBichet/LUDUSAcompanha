import { useEffect, useRef } from "react";
import "./ConfirmacaoEstadoJogo.css";

export default function ConfirmacaoEstadoJogo({ jogo, ocupado, erro, onCancelar, onConfirmar }) {
    const dialogo = useRef(null);
    const cancelar = useRef(null);
    const arquivar = jogo.ativo ?? jogo.active !== false;
    const acao = arquivar ? "Arquivar" : "Reativar";
    const emAndamento = arquivar ? "Arquivando" : "Reativando";

    useEffect(() => {
        const origem = jogo.origemFoco;
        const elemento = dialogo.current;
        elemento.showModal();
        cancelar.current.focus();
        return () => {
            elemento.close();
            if (origem?.isConnected && !origem.disabled) origem.focus();
        };
    }, [jogo.origemFoco]);

    useEffect(() => {
        if (ocupado) dialogo.current.focus();
        else cancelar.current.focus();
    }, [ocupado]);

    return (
        <dialog
            ref={dialogo}
            className="confirmacao-estado-jogo"
            tabIndex={-1}
            aria-labelledby="titulo-confirmacao-estado-jogo"
            aria-describedby="descricao-confirmacao-estado-jogo"
            aria-busy={ocupado}
            onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onCancelar();
            }}
        >
            <h2 id="titulo-confirmacao-estado-jogo">{acao} jogo?</h2>
            <p id="descricao-confirmacao-estado-jogo">
                Você vai <strong>{acao.toLocaleLowerCase("pt-BR")} “{jogo.nome ?? jogo.name}”</strong>.
            </p>
            <p className="confirmacao-estado-jogo-ajuda">
                {arquivar
                    ? "O jogo deixará de aparecer como opção ativa, mas os alunos e todo o histórico serão preservados."
                    : "O jogo voltará a aparecer como opção ativa. O histórico existente continuará preservado."}
            </p>
            {erro && <p className="confirmacao-estado-jogo-erro" role="alert">{erro}</p>}
            {ocupado && <p role="status">{emAndamento} jogo. Aguarde…</p>}
            <div className="confirmacao-estado-jogo-acoes">
                <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
                <button className={arquivar ? "confirmar-arquivo" : "confirmar-reativacao"} type="button" disabled={ocupado} onClick={onConfirmar}>
                    {ocupado ? `${emAndamento}…` : `${acao} jogo`}
                </button>
            </div>
        </dialog>
    );
}
