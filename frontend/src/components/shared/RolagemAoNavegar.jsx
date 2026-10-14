import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const posicoesPorEntrada = new Map();

export default function RolagemAoNavegar() {
    const { pathname, hash, key } = useLocation();
    const tipoNavegacao = useNavigationType();

    useEffect(() => {
        if (!("scrollRestoration" in window.history)) return undefined;
        const valorAnterior = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";
        return () => {
            window.history.scrollRestoration = valorAnterior;
        };
    }, []);

    useEffect(() => {
        const salvarPosicao = () => {
            posicoesPorEntrada.set(key, {
                top: window.scrollY,
                left: window.scrollX,
            });
        };

        window.addEventListener("scroll", salvarPosicao, { passive: true });
        document.addEventListener("click", salvarPosicao, true);

        return () => {
            window.removeEventListener("scroll", salvarPosicao);
            document.removeEventListener("click", salvarPosicao, true);
        };
    }, [key]);

    useLayoutEffect(() => {
        const id = window.requestAnimationFrame(() => {
            const posicaoAnterior = posicoesPorEntrada.get(key);
            if (tipoNavegacao === "POP" && hash) {
                const alvoAnterior = document.getElementById(
                    decodeURIComponent(hash.slice(1)),
                );
                if (alvoAnterior) {
                    alvoAnterior.scrollIntoView({ behavior: "auto", block: "start" });
                    return;
                }
            }

            if (tipoNavegacao === "POP" && posicaoAnterior) {
                window.scrollTo(posicaoAnterior);
                return;
            }

            if (hash) {
                const alvo = document.getElementById(decodeURIComponent(hash.slice(1)));
                if (alvo) {
                    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                }
            }
            window.scrollTo({ top: 0, left: 0 });
        });
        return () => window.cancelAnimationFrame(id);
    }, [pathname, hash, key, tipoNavegacao]);

    return null;
}
