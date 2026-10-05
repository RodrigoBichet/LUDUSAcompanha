const CAMPOS_SESSAO = [
    "schemaVersion",
    "captureMode",
    "source",
    "sourceVersion",
    "ingestionMethod",
    "capabilities",
    "sessionId",
    "runId",
    "attemptNumber",
    "status",
    "studentId",
    "playerId",
    "gameId",
    "gameVersion",
    "platform",
    "startedAt",
    "endedAt",
    "durationMs",
    "viewport",
    "metrics",
    "clicks",
    "mousePath",
    "dragPath",
    "screenshots",
];

const tentarLerPayload = (evento) => {
    if (
        evento?.payloadData &&
        typeof evento.payloadData === "object" &&
        !Array.isArray(evento.payloadData)
    ) {
        return evento.payloadData;
    }

    try {
        const convertido = JSON.parse(evento?.payload || "{}");
        return convertido && typeof convertido === "object"
            ? convertido
            : {};
    } catch (_) {
        return {};
    }
};

const removerValoresAusentes = (valor) =>
    Object.fromEntries(
        Object.entries(valor).filter(
            ([, conteudo]) => conteudo !== undefined && conteudo !== null,
        ),
    );

const prepararSessaoParaExportacao = (documento) => {
    const dados = typeof documento?.toObject === "function"
        ? documento.toObject()
        : documento;
    const sessao = {};

    for (const campo of CAMPOS_SESSAO) {
        if (dados?.[campo] !== undefined) sessao[campo] = dados[campo];
    }

    sessao.studentId = String(dados.studentId);
    sessao.gameEvents = (dados.gameEvents || []).map((evento) => ({
        eventType: evento.eventType,
        timestamp: evento.timestamp,
        payload: tentarLerPayload(evento),
    }));
    sessao.screenshots = (dados.screenshots || []).map((captura) =>
        removerValoresAusentes(
            typeof captura?.toObject === "function"
                ? captura.toObject()
                : captura,
        ),
    );

    return removerValoresAusentes(sessao);
};

const prepararPacoteDeExecucao = (runId, documentos) => ({
    bundleVersion: "1.0.0",
    type: "ludus-session-bundle",
    runId,
    exportedAt: new Date().toISOString(),
    sessions: documentos.map(prepararSessaoParaExportacao),
});

module.exports = {
    prepararSessaoParaExportacao,
    prepararPacoteDeExecucao,
};
