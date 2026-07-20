// =============================================================================
// telemetryNormalizer.js
// Normaliza payloads legados e canônicos sem alterar ainda a rota publicada.
// =============================================================================

const tentarConverterJson = (valor) => {
    if (typeof valor !== "string" || valor.trim() === "") return null;

    try {
        const convertido = JSON.parse(valor);
        return convertido && typeof convertido === "object" ? convertido : null;
    } catch (_) {
        return null;
    }
};

const normalizarPayload = (payload) => {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        return {
            payload: JSON.stringify(payload),
            payloadData: payload,
        };
    }

    const texto = typeof payload === "string" ? payload : "";
    return {
        payload: texto,
        payloadData: tentarConverterJson(texto),
    };
};

const inferirCapacidadesLegadas = (dados) => ({
    clicks: Array.isArray(dados.clicks),
    mousePath: Array.isArray(dados.mousePath),
    dragPath: Array.isArray(dados.dragPath),
    screenshots: Array.isArray(dados.screenshots) && dados.screenshots.length > 0,
    inactivity: (dados.gameEvents || []).some(
        (evento) => evento.eventType === "InactivityDetected",
    ),
    focusEvents: (dados.gameEvents || []).some((evento) =>
        ["FocusLost", "FocusGained"].includes(evento.eventType),
    ),
    phaseEvents: (dados.gameEvents || []).some((evento) =>
        evento.eventType.startsWith("Phase"),
    ),
    correctWrong: (dados.gameEvents || []).some((evento) =>
        ["CorrectMatch", "WrongMatch"].includes(evento.eventType),
    ),
    categoryEvents: (dados.gameEvents || []).some(
        (evento) => evento.eventType === "CategorySelected",
    ),
    customEvents: false,
});

const normalizarEventos = (eventos = []) =>
    eventos.map((evento) => ({
        eventType: evento.eventType,
        timestamp: evento.timestamp,
        ...normalizarPayload(evento.payload),
    }));

const normalizarSessaoTelemetria = (dados, tipo) => {
    const legado = tipo === "legacy";

    return {
        ...dados,
        schemaVersion: legado ? "legacy-unversioned" : dados.schemaVersion,
        captureMode: legado ? "sdk" : dados.captureMode,
        source: legado ? "unity-sdk-para-que-serve" : dados.source,
        sourceVersion: legado ? undefined : dados.sourceVersion,
        ingestionMethod: legado ? "direct-api" : dados.ingestionMethod,
        capabilities: legado ? inferirCapacidadesLegadas(dados) : dados.capabilities,
        gameEvents: normalizarEventos(dados.gameEvents),
    };
};

module.exports = {
    normalizarPayload,
    normalizarSessaoTelemetria,
};
