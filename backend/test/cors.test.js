const assert = require("node:assert/strict");
const test = require("node:test");
const { criarPoliticaCors } = require("../src/config/cors");

const consultarOrigem = (politica, origem) =>
    new Promise((resolve, reject) => {
        politica.opcoes.origin(origem, (erro, permitida) => {
            if (erro) {
                reject(erro);
                return;
            }
            resolve(permitida);
        });
    });

test("CORS local aceita WebGL em porta aleatoria somente em desenvolvimento", async () => {
    const desenvolvimento = criarPoliticaCors({ NODE_ENV: "development" });
    const producao = criarPoliticaCors({ NODE_ENV: "production" });

    assert.equal(
        await consultarOrigem(desenvolvimento, "http://localhost:55841"),
        true,
    );
    assert.equal(
        await consultarOrigem(desenvolvimento, "http://127.0.0.1:62000"),
        true,
    );
    assert.equal(
        await consultarOrigem(producao, "http://localhost:55841"),
        false,
    );
});

test("CORS permite o cabecalho de protecao dos checkpoints do SDK", () => {
    const politica = criarPoliticaCors({ NODE_ENV: "development" });

    assert.ok(
        politica.opcoes.allowedHeaders.includes("X-LUDUS-Checkpoint-Key"),
    );
});
