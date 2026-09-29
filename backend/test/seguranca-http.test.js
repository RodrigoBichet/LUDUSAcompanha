const assert = require("node:assert/strict");
const test = require("node:test");
const request = require("supertest");

const { criarPoliticaCors } = require("../src/config/cors");
const app = require("../src/app");

const consultarOrigem = (politica, origem) => new Promise((resolver, rejeitar) => {
    politica.opcoes.origin(origem, (erro, permitida) => erro ? rejeitar(erro) : resolver(permitida));
});

test("CORS de produção limita sites e aceita frontend, API direta e extensões", async () => {
    const politica = criarPoliticaCors({
        NODE_ENV: "production",
        FRONTEND_URL: "https://painel.exemplo.org/caminho-ignorado",
        CORS_ORIGINS: "https://jogo.exemplo.org, entrada-invalida",
        CORS_ALLOW_BROWSER_EXTENSIONS: "true",
    });

    assert.equal(await consultarOrigem(politica, "https://painel.exemplo.org"), true);
    assert.equal(await consultarOrigem(politica, "https://jogo.exemplo.org"), true);
    assert.equal(await consultarOrigem(politica, "chrome-extension://identificador-ficticio"), true);
    assert.equal(await consultarOrigem(politica, "moz-extension://identificador-ficticio"), true);
    assert.equal(await consultarOrigem(politica, "https://site-nao-autorizado.example"), false);
    assert.equal(await consultarOrigem(politica, undefined), true);
});

test("desenvolvimento aceita apenas frontends locais conhecidos", async () => {
    const politica = criarPoliticaCors({ NODE_ENV: "development" });
    assert.equal(await consultarOrigem(politica, "http://localhost:5173"), true);
    assert.equal(await consultarOrigem(politica, "http://127.0.0.1:5173"), true);
    assert.equal(await consultarOrigem(politica, "http://localhost:4000"), false);
});

test("API remove identificação do Express e envia cabeçalhos defensivos", async () => {
    const resposta = await request(app).get("/").expect(200);
    assert.equal(resposta.headers["x-powered-by"], undefined);
    assert.equal(resposta.headers["x-content-type-options"], "nosniff");
    assert.equal(resposta.headers["referrer-policy"], "no-referrer");
    assert.equal(resposta.headers["permissions-policy"], "camera=(), microphone=(), geolocation=()");
    assert.equal(resposta.headers["cross-origin-resource-policy"], "cross-origin");
});
