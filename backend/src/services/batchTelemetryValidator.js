// =============================================================================
// batchTelemetryValidator.js
// Valida o envelope de lote do LUDUS Observa antes de processar as sessões.
// Cada sessão continua submetida ao validador canônico individual.
// =============================================================================

const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const schemaLoteObserva = require("../../../docs/schema/ludus-observa-batch.schema.json");
const {
    ErroValidacaoTelemetria,
    validarSessaoTelemetria,
} = require("./telemetryValidator");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validarSchemaLote = ajv.compile(schemaLoteObserva);

const validarLoteTelemetria = (dados) => {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new ErroValidacaoTelemetria(
            "O lote precisa ser um objeto JSON.",
        );
    }

    if (!validarSchemaLote(dados)) {
        const detalhes = validarSchemaLote.errors.map((erro) => {
            const caminho = erro.instancePath || "/";
            return `${caminho}: ${erro.message}`;
        });

        throw new ErroValidacaoTelemetria(
            "O lote não atende ao contrato LUDUS Observa 1.0.0.",
            detalhes,
        );
    }

    const idsSessoes = new Set();
    const detalhes = [];

    dados.sessions.forEach((sessao, indice) => {
        try {
            validarSessaoTelemetria(sessao);
        } catch (erro) {
            if (!(erro instanceof ErroValidacaoTelemetria)) throw erro;

            detalhes.push(
                `sessions/${indice}: ${erro.message}`,
                ...(erro.detalhes || []).map(
                    (detalhe) => `sessions/${indice}${detalhe}`,
                ),
            );
            return;
        }

        if (idsSessoes.has(sessao.sessionId)) {
            detalhes.push(
                `sessions/${indice}: sessionId repetido dentro do lote.`,
            );
        }
        idsSessoes.add(sessao.sessionId);

        if (sessao.captureMode !== "observational") {
            detalhes.push(
                `sessions/${indice}: o lote do Observa aceita somente captureMode observational.`,
            );
        }
        if (sessao.source !== dados.source) {
            detalhes.push(
                `sessions/${indice}: source difere do source declarado pelo lote.`,
            );
        }
        if (sessao.sourceVersion !== dados.sourceVersion) {
            detalhes.push(
                `sessions/${indice}: sourceVersion difere da versão declarada pelo lote.`,
            );
        }
        if (sessao.ingestionMethod !== "file-import") {
            detalhes.push(
                `sessions/${indice}: ingestionMethod precisa ser file-import.`,
            );
        }
    });

    if (detalhes.length > 0) {
        throw new ErroValidacaoTelemetria(
            "O lote possui sessões inválidas ou incoerentes.",
            detalhes,
        );
    }

    return dados;
};

module.exports = {
    validarLoteTelemetria,
};
