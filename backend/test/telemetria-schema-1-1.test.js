const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
    ErroValidacaoTelemetria,
    validarSessaoTelemetria,
} = require("../src/services/telemetryValidator");
const {
    normalizarSessaoTelemetria,
} = require("../src/services/telemetryNormalizer");
const Session = require("../src/models/Session");

const carregarExemploSdk = () =>
    JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                "../../docs/telemetria-exemplos/sessao-sdk-completa.json",
            ),
            "utf8",
        ),
    );

const criarSessao11 = () => ({
    ...carregarExemploSdk(),
    schemaVersion: "1.1.0",
    sourceVersion: "0.2.0",
    runId: "execucao-teste-001",
    attemptNumber: 2,
    status: "completed",
});

test("mantém compatibilidade com sessão canônica 1.0.0", () => {
    const resultado = validarSessaoTelemetria(carregarExemploSdk());

    assert.equal(resultado.tipo, "canonical");
    assert.equal(resultado.dados.schemaVersion, "1.0.0");
});

test("aceita e preserva execução, tentativa e estado no schema 1.1.0", () => {
    const resultado = validarSessaoTelemetria(criarSessao11());
    const normalizada = normalizarSessaoTelemetria(
        resultado.dados,
        resultado.tipo,
    );
    const sessao = new Session(normalizada);

    assert.equal(normalizada.runId, "execucao-teste-001");
    assert.equal(normalizada.attemptNumber, 2);
    assert.equal(normalizada.status, "completed");
    assert.equal(sessao.validateSync(), undefined);
});

test("rejeita schema 1.1.0 sem os campos da execução", () => {
    const sessao = criarSessao11();
    delete sessao.runId;

    assert.throws(
        () => validarSessaoTelemetria(sessao),
        (erro) =>
            erro instanceof ErroValidacaoTelemetria &&
            erro.detalhes.some((detalhe) => detalhe.includes("runId")),
    );
});

test("rejeita estado não reconhecido", () => {
    const sessao = criarSessao11();
    sessao.status = "fechada";

    assert.throws(
        () => validarSessaoTelemetria(sessao),
        ErroValidacaoTelemetria,
    );
});

test("aceita fotografia de sessão ainda em andamento sem endedAt", () => {
    const sessao = criarSessao11();
    sessao.status = "in_progress";
    delete sessao.endedAt;

    const resultado = validarSessaoTelemetria(sessao);

    assert.equal(resultado.dados.status, "in_progress");
});
