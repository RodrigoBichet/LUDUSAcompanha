const assert = require("node:assert/strict");
const test = require("node:test");

const { validarAmbiente } = require("../src/config/validarAmbiente");

const ambienteProducao = (alteracoes = {}) => ({
    NODE_ENV: "production",
    MONGODB_URI: "mongodb+srv://usuario:senha@cluster.exemplo.mongodb.net/ludus",
    JWT_SECRET: "6f03d491fd4a47be9841446147b852850257c2f9d79c4303",
    FRONTEND_URL: "https://ludus.exemplo.org",
    AUTH_EXPOSE_DEV_LINKS: "false",
    RESEND_API_KEY: "re_0123456789abcdef0123456789",
    EMAIL_FROM: "LUDUS Acompanha <nao-responda@ludus.exemplo.org>",
    CORS_ALLOW_BROWSER_EXTENSIONS: "true",
    ...alteracoes,
});

test("aceita configuração completa e segura de produção", () => {
    assert.deepEqual(validarAmbiente(ambienteProducao()), {
        producao: true,
        porta: 3000,
    });
});

test("recusa iniciar sem MongoDB ou JWT", () => {
    assert.throws(
        () => validarAmbiente({ NODE_ENV: "development" }),
        /MONGODB_URI.*JWT_SECRET/,
    );
});

test("recusa segredo fraco e frontend inseguro em produção", () => {
    assert.throws(
        () => validarAmbiente(ambienteProducao({
            JWT_SECRET: "ludus_acompanha_secret_2026",
            FRONTEND_URL: "http://localhost:5173",
        })),
        /JWT_SECRET.*FRONTEND_URL/,
    );
});

test("recusa exposição de links locais e porta inválida em produção", () => {
    assert.throws(
        () => validarAmbiente(ambienteProducao({
            AUTH_EXPOSE_DEV_LINKS: "true",
            PORT: "70000",
        })),
        /PORT.*AUTH_EXPOSE_DEV_LINKS/,
    );
});

test("recusa produção sem provedor e remetente de email válidos", () => {
    assert.throws(
        () => validarAmbiente(ambienteProducao({
            RESEND_API_KEY: "",
            EMAIL_FROM: "remetente-invalido",
        })),
        /RESEND_API_KEY.*EMAIL_FROM/,
    );
});

test("recusa produção que não autoriza explicitamente a extensão", () => {
    assert.throws(
        () => validarAmbiente(ambienteProducao({ CORS_ALLOW_BROWSER_EXTENSIONS: "false" })),
        /CORS_ALLOW_BROWSER_EXTENSIONS/,
    );
});
