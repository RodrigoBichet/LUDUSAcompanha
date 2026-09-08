import { useEffect, useRef } from "react";
import "./ConfirmacaoExcluirJogo.css";

export default function ConfirmacaoExcluirJogo({
    jogo,
    ocupado,
    erro,
    onCancelar,
    onArquivar,
    onExcluir,
}) {
    const dialogo = useRef(null);
    const cancelar = useRef(null);
    const ativo = jogo.ativo ?? jogo.active !== false;

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

    return (
        <dialog
            ref={dialogo}
            className="confirmacao-excluir-jogo"
            aria-labelledby="titulo-excluir-jogo"
            aria-describedby="descricao-excluir-jogo"
            aria-busy={ocupado}
            onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onCancelar();
            }}
        >
            <h2 id="titulo-excluir-jogo">Excluir jogo definitivamente?</h2>
            <p id="descricao-excluir-jogo">
                O cadastro de <strong>“{jogo.nome ?? jogo.name}”</strong> desaparecerá do catálogo.
            </p>
            <p className="confirmacao-excluir-jogo-ajuda">
                As sessões e os dados dos alunos serão preservados. Você poderá cadastrar o jogo novamente, mas esta exclusão do catálogo não pode ser desfeita.
            </p>
            {ativo && (
                <p className="confirmacao-excluir-jogo-recomendacao">
                    Se deseja apenas esconder o jogo das novas coletas, escolha <strong>Arquivar</strong>.
                </p>
            )}
            {erro && <p className="confirmacao-excluir-jogo-erro" role="alert">{erro}</p>}
            {ocupado && <p role="status">Processando. Aguarde…</p>}
            <div className="confirmacao-excluir-jogo-acoes">
                <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
                {ativo && (
                    <button className="confirmar-arquivo" type="button" disabled={ocupado} onClick={onArquivar}>
                        Arquivar jogo
                    </button>
                )}
                <button className="confirmar-exclusao" type="button" disabled={ocupado} onClick={onExcluir}>
                    Excluir definitivamente
                </button>
            </div>
        </dialog>
    );
}
