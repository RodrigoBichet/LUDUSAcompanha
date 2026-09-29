const URL_LOCAL = new Set(["localhost", "127.0.0.1", "::1"]);

const urlValida = (valor, { exigirHttps = false } = {}) => {
    try {
        const url = new URL(valor);
        if (exigirHttps && url.protocol !== "https:") return false;
        if (url.username || url.password || url.hash) return false;
        return !exigirHttps || !URL_LOCAL.has(url.hostname);
    } catch {
        return false;
    }
};

const segredoFraco = (valor) => {
    if (typeof valor !== "string" || valor.length < 32) return true;
    return /(secret_2026|segredo|exemplo|troque|change.?me|ludus_acompanha_secret)/i.test(valor);
};

const remetenteValido = (valor) => {
    const texto = String(valor || "").trim();
    const correspondencia = texto.match(/^(?:[^<>\r\n]{1,120}\s*)?<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>$/) ||
        texto.match(/^([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)$/);
    return Boolean(correspondencia);
};

const validarAmbiente = (ambiente = process.env) => {
    const erros = [];
    const producao = ambiente.NODE_ENV === "production";

    if (!/^mongodb(?:\+srv)?:\/\//.test(ambiente.MONGODB_URI || "")) {
        erros.push("MONGODB_URI ausente ou incompatível.");
    }

    if (!ambiente.JWT_SECRET) {
        erros.push("JWT_SECRET não configurado.");
    } else if (producao && segredoFraco(ambiente.JWT_SECRET)) {
        erros.push("JWT_SECRET de produção deve ser aleatório e possuir pelo menos 32 caracteres.");
    }

    if (ambiente.PORT && (!/^\d+$/.test(ambiente.PORT) || Number(ambiente.PORT) < 1 || Number(ambiente.PORT) > 65535)) {
        erros.push("PORT deve ser um número entre 1 e 65535.");
    }

    if (producao) {
        if (!urlValida(ambiente.FRONTEND_URL, { exigirHttps: true })) {
            erros.push("FRONTEND_URL de produção deve ser uma URL HTTPS pública.");
        }
        if (ambiente.AUTH_EXPOSE_DEV_LINKS === "true") {
            erros.push("AUTH_EXPOSE_DEV_LINKS não pode ser ativado em produção.");
        }
        if (!/^re_[A-Za-z0-9_-]{16,}$/.test(ambiente.RESEND_API_KEY || "")) {
            erros.push("RESEND_API_KEY de produção ausente ou incompatível.");
        }
        if (!remetenteValido(ambiente.EMAIL_FROM)) {
            erros.push("EMAIL_FROM ausente ou incompatível.");
        }
        if (ambiente.CORS_ALLOW_BROWSER_EXTENSIONS !== "true") {
            erros.push("CORS_ALLOW_BROWSER_EXTENSIONS deve ser true para receber a extensão em produção.");
        }
    }

    if (erros.length > 0) {
        const erro = new Error(`Configuração inválida: ${erros.join(" ")}`);
        erro.codigo = "CONFIGURACAO_INVALIDA";
        throw erro;
    }

    return Object.freeze({ producao, porta: Number(ambiente.PORT || 3000) });
};

module.exports = { validarAmbiente };
