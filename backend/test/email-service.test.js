const assert = require("node:assert/strict");
const test = require("node:test");

const { criarServicoEmail } = require("../src/services/emailService");

const mensagem = {
    para: "professora.ficticia@exemplo.org",
    assunto: "Confirmação de teste",
    html: "<p>Mensagem fictícia</p>",
    texto: "Mensagem fictícia",
};

test("envia mensagem pelo Resend sem expor a chave no conteúdo", async () => {
    let requisicao;
    const servico = criarServicoEmail({
        ambiente: {
            NODE_ENV: "production",
            RESEND_API_KEY: "re_chave-ficticia-segura",
            EMAIL_FROM: "LUDUS Acompanha <nao-responda@exemplo.org>",
        },
        fetchImpl: async (url, opcoes) => {
            requisicao = { url, opcoes };
            return { ok: true };
        },
    });

    assert.deepEqual(await servico.enviarEmail(mensagem), { enviado: true, modo: "resend" });
    assert.equal(requisicao.url, "https://api.resend.com/emails");
    assert.equal(requisicao.opcoes.headers.Authorization, "Bearer re_chave-ficticia-segura");
    assert.equal(JSON.parse(requisicao.opcoes.body).to[0], mensagem.para);
    assert.equal(requisicao.opcoes.body.includes("re_chave-ficticia-segura"), false);
    assert.ok(requisicao.opcoes.signal);
});

test("desenvolvimento sem credenciais conserva o fluxo local", async () => {
    const servico = criarServicoEmail({ ambiente: { NODE_ENV: "development" } });
    assert.deepEqual(await servico.enviarEmail(mensagem), {
        enviado: false,
        modo: "desenvolvimento",
    });
});

test("produção trata falha de rede e recusa do provedor sem vazar detalhes", async () => {
    const ambiente = {
        NODE_ENV: "production",
        RESEND_API_KEY: "re_chave-ficticia-segura",
        EMAIL_FROM: "nao-responda@exemplo.org",
    };
    const indisponivel = criarServicoEmail({
        ambiente,
        fetchImpl: async () => { throw new Error("detalhe sensível da rede"); },
    });
    await assert.rejects(
        () => indisponivel.enviarEmail(mensagem),
        /^Error: O serviço de email está temporariamente indisponível\.$/,
    );

    const recusado = criarServicoEmail({
        ambiente,
        fetchImpl: async () => ({ ok: false, status: 403 }),
    });
    await assert.rejects(
        () => recusado.enviarEmail(mensagem),
        /^Error: O serviço de email recusou a mensagem\.$/,
    );
});
