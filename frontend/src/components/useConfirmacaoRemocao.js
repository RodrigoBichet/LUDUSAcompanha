import { useRef, useState } from "react";

export const useConfirmacaoRemocao = () => {
    const [alvo, setAlvo] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");
    const emCurso = useRef(false);

    const abrir = (dados, origemFoco) => {
        if (emCurso.current) return;
        setErro("");
        setAlvo({ ...dados, origemFoco });
    };
    const cancelar = () => {
        if (!emCurso.current) setAlvo(null);
    };
    const executar = async (operacao, aoConcluir, mensagemPadrao) => {
        if (!alvo || emCurso.current) return;
        emCurso.current = true;
        setOcupado(true);
        setErro("");
        try {
            await operacao(alvo);
            await aoConcluir?.(alvo);
            setAlvo(null);
        } catch (falha) {
            setErro(falha.response?.data?.mensagem || mensagemPadrao);
        } finally {
            emCurso.current = false;
            setOcupado(false);
        }
    };
    return { alvo, ocupado, erro, abrir, cancelar, executar };
};
