const test = require("node:test");
const assert = require("node:assert/strict");

const {
    prepararSessaoParaExportacao,
    prepararPacoteDeExecucao,
} = require("../src/services/sessionExporter");

const sessaoPersistida = {
    _id: "interno",
    __v: 0,
    createdAt: "interno",
    schemaVersion: "1.1.0",
    captureMode: "sdk",
    source: "unity-sdk",
    sourceVersion: "0.2.0",
    ingestionMethod: "direct-api",
    capabilities: {},
    sessionId: "sessao-001",
    runId: "execucao-001",
    attemptNumber: 1,
    status: "completed",
    studentId: { toString: () => "64f000000000000000000001" },
    playerId: "Estudante",
    gameId: "jogo-teste",
    gameVersion: "1.0.0",
    platform: "WebGLPlayer",
    startedAt: "2026-10-04T12:00:00.000Z",
    endedAt: "2026-10-04T12:01:00.000Z",
    durationMs: 60000,
    viewport: {},
    metrics: {},
    clicks: [],
    mousePath: [],
    dragPath: [],
    gameEvents: [
        {
            eventType: "CorrectMatch",
            timestamp: 1000,
            payload: '{"item":"água"}',
            payloadData: { item: "água" },
        },
    ],
    screenshots: [{ timestamp: 0, caminho: "/uploads/screenshots/a.jpg" }],
};

test("exporta somente o contrato público e restaura payload como objeto", () => {
    const exportada = prepararSessaoParaExportacao(sessaoPersistida);

    assert.equal(exportada._id, undefined);
    assert.equal(exportada.__v, undefined);
    assert.equal(exportada.createdAt, undefined);
    assert.deepEqual(exportada.gameEvents[0].payload, { item: "água" });
    assert.equal(exportada.studentId, "64f000000000000000000001");
});

test("reúne sessões da execução em pacote importável", () => {
    const pacote = prepararPacoteDeExecucao("execucao-001", [
        sessaoPersistida,
        { ...sessaoPersistida, sessionId: "sessao-002", attemptNumber: 2 },
    ]);

    assert.equal(pacote.type, "ludus-session-bundle");
    assert.equal(pacote.runId, "execucao-001");
    assert.equal(pacote.sessions.length, 2);
});
