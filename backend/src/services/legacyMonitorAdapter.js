// =============================================================================
// legacyMonitorAdapter.js
// Converte a exportacao bruta do monitor LUDUS anterior para o contrato
// canonico observacional. Nao infere eventos pedagogicos do jogo.
// =============================================================================

const crypto = require("crypto");
const { ErroValidacaoTelemetria } = require("./telemetryValidator");

const TITULO_MOVIMENTO = "[+LUDUS-mouse-move]:";
const TITULO_CLIQUE = "[+LUDUS-mouse-click]:";

const eRelatorioMonitorLegado = (dados) =>
    Boolean(
        dados &&
            typeof dados === "object" &&
            typeof dados.app === "string" &&
            Array.isArray(dados.reports) &&
            typeof dados.datehourstart === "string" &&
            typeof dados.datehourend === "string",
    );

const normalizarIdentificador = (valor, fallback) => {
    const normalizado = String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalizado || fallback;
};

const converterDataDoMonitor = (valor, campo) => {
    const partes = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(
        valor,
    );

    if (!partes) {
        throw new ErroValidacaoTelemetria(
            `Data invalida no relatorio observacional: ${campo}.`,
        );
    }

    const [, ano, mes, dia, hora, minuto, segundo] = partes;
    return new Date(
        Date.UTC(ano, Number(mes) - 1, dia, hora, minuto, segundo),
    );
};

const extrairPosicao = (descricao) => {
    const resultado = /POS:\((-?\d+(?:\.\d+)?);(-?\d+(?:\.\d+)?);[^)]*\)/.exec(
        descricao || "",
    );

    if (!resultado) return null;

    return { x: Number(resultado[1]), y: Number(resultado[2]) };
};

const limitarTimestamp = (data, inicioMs, duracaoMs) =>
    Math.min(duracaoMs, Math.max(0, data.getTime() - inicioMs));

const adaptarRelatorioMonitorLegado = (dadosBrutos) => {
    if (!eRelatorioMonitorLegado(dadosBrutos)) return dadosBrutos;

    const inicio = converterDataDoMonitor(
        dadosBrutos.datehourstart,
        "datehourstart",
    );
    const fim = converterDataDoMonitor(dadosBrutos.datehourend, "datehourend");
    const duracaoMs = fim.getTime() - inicio.getTime();

    if (duracaoMs < 0) {
        throw new ErroValidacaoTelemetria(
            "O fim do relatorio observacional ocorre antes do inicio.",
        );
    }

    const mousePath = [];
    const gameEvents = [];
    let totalCliques = 0;

    for (const report of dadosBrutos.reports) {
        if (!report || typeof report !== "object") {
            throw new ErroValidacaoTelemetria(
                "Relatorio observacional possui item invalido em reports.",
            );
        }

        const dataEvento = converterDataDoMonitor(report.date, "reports.date");
        const timestamp = limitarTimestamp(
            dataEvento,
            inicio.getTime(),
            duracaoMs,
        );
        const titulo = String(report.title || "");
        const descricao = String(report.description || "");

        if (titulo === TITULO_MOVIMENTO) {
            const posicao = extrairPosicao(descricao);
            if (posicao && posicao.x >= 0 && posicao.y >= 0) {
                mousePath.push({ ...posicao, t: timestamp });
            }
        }

        if (titulo === TITULO_CLIQUE) totalCliques += 1;

        gameEvents.push({
            eventType:
                titulo === TITULO_CLIQUE
                    ? "ExternalMouseClick"
                    : "ExternalMonitorEvent",
            timestamp,
            payload: {
                sourceEventId: String(report.id || ""),
                title: titulo,
                description: descricao,
                recordedAt: String(report.date || ""),
            },
        });
    }

    const larguraObservada = Math.max(
        1,
        ...mousePath.map((ponto) => Math.ceil(ponto.x)),
    );
    const alturaObservada = Math.max(
        1,
        ...mousePath.map((ponto) => Math.ceil(ponto.y)),
    );
    const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(dadosBrutos))
        .digest("hex")
        .slice(0, 24);

    return {
        schemaVersion: "1.0.0",
        captureMode: "observational",
        source: "ludus-monitor-legacy-export",
        sourceVersion: String(dadosBrutos.version || "unknown"),
        ingestionMethod: "file-import",
        sessionId: `external-monitor-${hash}`,
        gameId: normalizarIdentificador(dadosBrutos.app, "external-game"),
        gameVersion: String(dadosBrutos.version || "unknown"),
        platform: "external-unity",
        startedAt: inicio.toISOString(),
        endedAt: fim.toISOString(),
        durationMs: duracaoMs,
        viewport: {
            // O export nao informa o viewport real; este e o limite observado.
            widthPx: larguraObservada,
            heightPx: alturaObservada,
            coordinateUnit: "pixel",
            coordinateOrigin: "top-left",
        },
        capabilities: {
            clicks: false,
            mousePath: mousePath.length > 0,
            dragPath: false,
            screenshots: false,
            inactivity: false,
            focusEvents: false,
            phaseEvents: false,
            correctWrong: false,
            categoryEvents: false,
            customEvents: true,
        },
        metrics: {
            totalClicks: totalCliques,
            totalCorrect: 0,
            totalWrong: 0,
            firstActionMs: mousePath[0]?.t ?? -1,
            avgTimeBetweenActionsMs: 0,
            inactivityCount: 0,
            totalInactivityMs: 0,
        },
        clicks: [],
        mousePath,
        dragPath: [],
        gameEvents,
        screenshots: [],
    };
};

module.exports = {
    eRelatorioMonitorLegado,
    adaptarRelatorioMonitorLegado,
};
