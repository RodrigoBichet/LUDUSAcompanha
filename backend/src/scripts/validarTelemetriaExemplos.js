// =============================================================================
// validarTelemetriaExemplos.js
// Verifica os exemplos documentais e a compatibilidade mínima com o Unity legado.
// =============================================================================

const fs = require("fs");
const path = require("path");
const {
    validarSessaoTelemetria,
} = require("../services/telemetryValidator");
const {
    normalizarSessaoTelemetria,
} = require("../services/telemetryNormalizer");

const PASTA_EXEMPLOS = path.join(
    __dirname,
    "../../../docs/telemetria-exemplos",
);

const exemplos = [
    ["sessão observacional", "sessao-observacional.json"],
    ["sessão SDK completa", "sessao-sdk-completa.json"],
    ["sessão de jogo externo", "sessao-jogo-externo.json"],
];

const sessaoLegada = {
    sessionId: "legacy-para-que-serve-001",
    studentId: "64f000000000000000000004",
    playerId: "Estudante legado",
    gameId: "para-que-serve",
    durationMs: 18000,
    clicks: [],
    mousePath: [],
    dragPath: [],
    screenshots: [],
    gameEvents: [
        {
            eventType: "CategorySelected",
            timestamp: 0,
            payload: '{"category":"Higiene"}',
        },
    ],
};

const validarEExibir = (nome, dados) => {
    const resultado = validarSessaoTelemetria(dados);
    const normalizada = normalizarSessaoTelemetria(
        resultado.dados,
        resultado.tipo,
    );

    if (!normalizada.schemaVersion || !normalizada.source) {
        throw new Error(`${nome}: normalização sem metadados obrigatórios.`);
    }

    console.log(`OK ${nome} (${resultado.tipo})`);
};

try {
    for (const [nome, arquivo] of exemplos) {
        const caminho = path.join(PASTA_EXEMPLOS, arquivo);
        const dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
        validarEExibir(nome, dados);
    }

    validarEExibir("payload Unity legado", sessaoLegada);
    console.log("Telemetria validada com sucesso.");
} catch (erro) {
    console.error("Falha na validação de telemetria:", erro.message);
    if (erro.detalhes?.length) {
        for (const detalhe of erro.detalhes) console.error(`- ${detalhe}`);
    }
    process.exit(1);
}
