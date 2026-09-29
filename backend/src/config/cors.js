const ORIGENS_EXTENSAO = ["chrome-extension://", "moz-extension://"];

const obterOrigemHttp = (valor) => {
    try {
        const url = new URL(String(valor || "").trim());
        return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
    } catch {
        return null;
    }
};

const criarPoliticaCors = (ambiente = process.env) => {
    const origens = new Set();
    const frontend = obterOrigemHttp(ambiente.FRONTEND_URL);
    if (frontend) origens.add(frontend);

    for (const item of String(ambiente.CORS_ORIGINS || "").split(",")) {
        const origem = obterOrigemHttp(item);
        if (origem) origens.add(origem);
    }

    if (ambiente.NODE_ENV !== "production") {
        origens.add("http://localhost:5173");
        origens.add("http://127.0.0.1:5173");
    }

    const aceitarExtensoes = ambiente.CORS_ALLOW_BROWSER_EXTENSIONS === "true" ||
        ambiente.NODE_ENV !== "production";
    const origemPermitida = (origem) =>
        !origem ||
        origens.has(origem) ||
        (aceitarExtensoes && ORIGENS_EXTENSAO.some((prefixo) => origem.startsWith(prefixo)));

    return Object.freeze({
        origens: Object.freeze([...origens]),
        aceitarExtensoes,
        opcoes: {
            origin: (origem, callback) => callback(null, origemPermitida(origem)),
            methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Authorization", "Content-Type"],
            maxAge: 600,
        },
    });
};

module.exports = { criarPoliticaCors };
