const enviarEmail = async ({ para, assunto, html, texto }) => {
    const chave = process.env.RESEND_API_KEY;
    const remetente = process.env.EMAIL_FROM;

    if (!chave || !remetente) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Serviço de email não configurado.");
        }
        return { enviado: false, modo: "desenvolvimento" };
    }

    const resposta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html, text: texto }),
    });
    if (!resposta.ok) throw new Error(`O provedor de email respondeu com status ${resposta.status}.`);
    return { enviado: true, modo: "resend" };
};

module.exports = { enviarEmail };
