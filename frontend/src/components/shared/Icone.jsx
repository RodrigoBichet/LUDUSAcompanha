const caminhos = {
    jogos: (
        <>
            <path d="M4 19V10" />
            <path d="M10 19V5" />
            <path d="M16 19v-7" />
            <path d="M22 19V8" />
        </>
    ),
    instituicao: (
        <>
            <path d="M3 21h18" />
            <path d="M5 21V9l7-4 7 4v12" />
            <path d="M9 21v-6h6v6" />
        </>
    ),
    pessoas: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    coleta: (
        <>
            <path d="M4 4h16v16H4z" />
            <path d="M8 2v4M16 2v4M8 12h8" />
            <path d="m12 9 3 3-3 3" />
        </>
    ),
    configuracao: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.72.6 1 .3.29.7.43 1.1.4h.1v4h-.1c-.4-.03-.8.11-1.1.4-.26.28-.47.62-.6 1Z" />
        </>
    ),
    usuario: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    editar: (
        <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </>
    ),
    excluir: (
        <>
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2M19 6l-1 15H6L5 6" />
            <path d="M10 11v6M14 11v6" />
        </>
    ),
    arquivar: (
        <>
            <path d="M3 6h18v4H3z" />
            <path d="M5 10v10h14V10M10 14h4" />
        </>
    ),
    restaurar: (
        <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
        </>
    ),
    aviso: (
        <>
            <path d="M12 3 2 21h20Z" />
            <path d="M12 9v5M12 18h.01" />
        </>
    ),
    importar: (
        <>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 19h16" />
        </>
    ),
    imagem: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m21 15-5-5L5 20" />
        </>
    ),
    jogo: (
        <>
            <path d="M8 8h8a5 5 0 0 1 4.8 6.4l-1 3.2a2 2 0 0 1-3.3.8L14 16h-4l-2.5 2.4a2 2 0 0 1-3.3-.8l-1-3.2A5 5 0 0 1 8 8Z" />
            <path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" />
        </>
    ),
    alvo: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" />
        </>
    ),
    sucesso: <path d="m5 12 4 4L19 6" />,
    documento: (
        <>
            <path d="M6 2h8l4 4v16H6z" />
            <path d="M14 2v5h5M9 13h6M9 17h6" />
        </>
    ),
    cadeado: (
        <>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
    ),
    fechar: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icone({ nome, tamanho = 20, className = "", titulo }) {
    return (
        <svg
            className={`icone-vetor ${className}`.trim()}
            width={tamanho}
            height={tamanho}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
            aria-hidden={titulo ? undefined : "true"}
            role={titulo ? "img" : undefined}
        >
            {titulo && <title>{titulo}</title>}
            {caminhos[nome] || caminhos.jogo}
        </svg>
    );
}
