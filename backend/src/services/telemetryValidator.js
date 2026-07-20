// =============================================================================
// telemetryValidator.js
// Valida sessões LUDUS canônicas (schema 1.0.0) e identifica payloads legados.
// =============================================================================

const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const schemaSessaoLudus = require("../../../docs/schema/ludus-session.schema.json");

const CAPACIDADES = [
    "clicks",
    "mousePath",
    "dragPath",
    "screenshots",
    "inactivity",
    "focusEvents",
    "phaseEvents",
    "correctWrong",
    "categoryEvents",
    "customEvents",
];

class ErroValidacaoTelemetria extends Error {
    constructor(mensagem, detalhes = []) {
        super(mensagem);
        this.name = "ErroValidacaoTelemetria";
        this.detalhes = detalhes;
    }
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validarSchemaCanonico = ajv.compile(schemaSessaoLudus);

const validarSessaoLegada = (dados) => {
    const camposObrigatorios = ["sessionId", "studentId", "gameId"];
    const ausentes = camposObrigatorios.filter(
        (campo) =>
            typeof dados[campo] !== "string" || dados[campo].trim() === "",
    );

    if (ausentes.length > 0) {
        throw new ErroValidacaoTelemetria(
            "Campos obrigatórios ausentes na sessão legada.",
            ausentes,
        );
    }

    const colecoes = [
        "clicks",
        "mousePath",
        "dragPath",
        "gameEvents",
        "screenshots",
    ];

    const colecoesInvalidas = colecoes.filter(
        (campo) => dados[campo] !== undefined && !Array.isArray(dados[campo]),
    );

    if (colecoesInvalidas.length > 0) {
        throw new ErroValidacaoTelemetria(
            "Coleções inválidas na sessão legada.",
            colecoesInvalidas,
        );
    }

    return { tipo: "legacy", dados };
};

const adicionarErro = (erros, condicao, mensagem) => {
    if (condicao) erros.push(mensagem);
};

const validarPontos = (erros, pontos, duracaoMs, viewport, nomeColecao) => {
    for (const ponto of pontos || []) {
        const timestamp = ponto.timestamp ?? ponto.t;

        adicionarErro(
            erros,
            !Number.isInteger(timestamp) || timestamp < 0 || timestamp > duracaoMs,
            `${nomeColecao} possui timestamp fora da duração da sessão.`,
        );

        if (viewport.coordinateUnit === "normalized") {
            adicionarErro(
                erros,
                ponto.x < 0 || ponto.x > 1 || ponto.y < 0 || ponto.y > 1,
                `${nomeColecao} possui coordenada normalizada fora do intervalo de 0 a 1.`,
            );
        } else {
            adicionarErro(
                erros,
                ponto.x < 0 ||
                    ponto.x > viewport.widthPx ||
                    ponto.y < 0 ||
                    ponto.y > viewport.heightPx,
                `${nomeColecao} possui coordenada fora do viewport.`,
            );
        }
    }
};

const validarCoerenciaCanonica = (dados) => {
    const erros = [];
    const { capabilities, durationMs, viewport } = dados;

    for (const capacidade of CAPACIDADES) {
        adicionarErro(
            erros,
            typeof capabilities[capacidade] !== "boolean",
            `Capacidade inválida: ${capacidade}.`,
        );
    }

    const colecoesPorCapacidade = {
        clicks: "clicks",
        mousePath: "mousePath",
        dragPath: "dragPath",
        screenshots: "screenshots",
    };

    for (const [capacidade, colecao] of Object.entries(colecoesPorCapacidade)) {
        adicionarErro(
            erros,
            capabilities[capacidade] === false && dados[colecao].length > 0,
            `${colecao} possui dados, mas a capacidade ${capacidade} está desativada.`,
        );
    }

    validarPontos(erros, dados.clicks, durationMs, viewport, "clicks");
    validarPontos(erros, dados.mousePath, durationMs, viewport, "mousePath");
    validarPontos(erros, dados.dragPath, durationMs, viewport, "dragPath");

    for (const evento of dados.gameEvents) {
        adicionarErro(
            erros,
            evento.timestamp > durationMs,
            "gameEvents possui timestamp fora da duração da sessão.",
        );
        adicionarErro(
            erros,
            capabilities.phaseEvents === false &&
                evento.eventType.startsWith("Phase"),
            "Evento de fase presente sem a capacidade phaseEvents.",
        );
        adicionarErro(
            erros,
            capabilities.correctWrong === false &&
                ["CorrectMatch", "WrongMatch"].includes(evento.eventType),
            "Evento de acerto/erro presente sem a capacidade correctWrong.",
        );
    }

    if (erros.length > 0) {
        throw new ErroValidacaoTelemetria(
            "Sessão canônica possui incoerências de telemetria.",
            [...new Set(erros)],
        );
    }
};

const validarSessaoTelemetria = (dados) => {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new ErroValidacaoTelemetria(
            "A sessão precisa ser um objeto JSON.",
        );
    }

    if (!dados.schemaVersion) {
        return validarSessaoLegada(dados);
    }

    if (dados.schemaVersion !== "1.0.0") {
        throw new ErroValidacaoTelemetria(
            `Versão de schema não suportada: ${dados.schemaVersion}.`,
        );
    }

    if (!validarSchemaCanonico(dados)) {
        const detalhes = validarSchemaCanonico.errors.map((erro) => {
            const caminho = erro.instancePath || "/";
            return `${caminho}: ${erro.message}`;
        });

        throw new ErroValidacaoTelemetria(
            "Sessão canônica não atende ao schema LUDUS 1.0.0.",
            detalhes,
        );
    }

    validarCoerenciaCanonica(dados);
    return { tipo: "canonical", dados };
};

module.exports = {
    ErroValidacaoTelemetria,
    validarSessaoTelemetria,
};
