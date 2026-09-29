const ENDPOINT_RESEND = "https://api.resend.com/emails";
const DEZ_SEGUNDOS = 10_000;
const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());

const criarServicoEmail = ({
    ambiente = process.env,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEZ_SEGUNDOS,
} = {}) => ({
    async enviarEmail({ para, assunto, html, texto }) {
        const chave = ambiente.RESEND_API_KEY;
        const remetente = ambiente.EMAIL_FROM;

        if (!chave || !remetente) {
            if (ambiente.NODE_ENV === "production") {
                throw new Error("Serviço de email não configurado.");
            }
            return { enviado: false, modo: "desenvolvimento" };
        }
        if (!emailValido(para) || !assunto || !html || !texto) {
            throw new Error("Mensagem de email incompatível.");
        }
        if (typeof fetchImpl !== "function" || !Number.isInteger(timeoutMs) || timeoutMs < 1000) {
            throw new Error("Cliente de email incompatível.");
        }

        let resposta;
        try {
            resposta = await fetchImpl(ENDPOINT_RESEND, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${chave}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: remetente,
                    to: [String(para).trim().toLowerCase()],
                    subject: assunto,
                    html,
                    text: texto,
                }),
                signal: AbortSignal.timeout(timeoutMs),
            });
        } catch {
            throw new Error("O serviço de email está temporariamente indisponível.");
        }

        if (!resposta?.ok) {
            throw new Error("O serviço de email recusou a mensagem.");
        }
        return { enviado: true, modo: "resend" };
    },
});

const enviarEmail = (mensagem) => criarServicoEmail().enviarEmail(mensagem);

module.exports = { criarServicoEmail, enviarEmail };
