// =============================================================================
// Session.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose da sessão de jogo.
// Espelha exatamente a estrutura gerada pelo SDK Unity.
// =============================================================================

const mongoose = require("mongoose");

// -------------------------------------------------------------------------
// Sub-schemas — estruturas aninhadas dentro da sessão
// -------------------------------------------------------------------------

const MetricasSchema = new mongoose.Schema(
    {
        totalClicks: { type: Number, default: 0 },
        totalCorrect: { type: Number, default: 0 },
        totalWrong: { type: Number, default: 0 },
        firstActionMs: { type: Number, default: -1 },
        avgTimeBetweenActionsMs: { type: Number, default: 0 },
        inactivityCount: { type: Number, default: 0 },
        totalInactivityMs: { type: Number, default: 0 },
    },
    { _id: false },
);

const CliqueSchema = new mongoose.Schema(
    {
        element: { type: String },
        x: { type: Number },
        y: { type: Number },
        timestamp: { type: Number },
    },
    { _id: false },
);

const PathPointSchema = new mongoose.Schema(
    {
        x: { type: Number },
        y: { type: Number },
        t: { type: Number },
    },
    { _id: false },
);

const DragPathPointSchema = new mongoose.Schema(
    {
        element: { type: String },
        x: { type: Number },
        y: { type: Number },
        t: { type: Number },
        state: { type: String },
    },
    { _id: false },
);

const CapacidadesSchema = new mongoose.Schema(
    {
        clicks: { type: Boolean },
        mousePath: { type: Boolean },
        dragPath: { type: Boolean },
        screenshots: { type: Boolean },
        inactivity: { type: Boolean },
        focusEvents: { type: Boolean },
        phaseEvents: { type: Boolean },
        correctWrong: { type: Boolean },
        categoryEvents: { type: Boolean },
        customEvents: { type: Boolean },
    },
    { _id: false },
);

const ViewportSchema = new mongoose.Schema(
    {
        widthPx: { type: Number },
        heightPx: { type: Number },
        coordinateUnit: { type: String },
        coordinateOrigin: { type: String },
    },
    { _id: false },
);

const GameEventSchema = new mongoose.Schema(
    {
        eventType: { type: String },
        timestamp: { type: Number },
        payload: { type: String, default: "" },
        payloadData: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false },
);

// Sub-schema do screenshot de uma fase
// O campo screenshotBase64 existe apenas no JSON do Unity — o backend
// extrai, salva como arquivo e armazena somente o caminho público aqui.
const FaseScreenshotSchema = new mongoose.Schema(
    {
        faseIndex: { type: Number }, // Índice da fase (0, 1, 2, 3)
        phaseId: { type: String },
        timestamp: { type: Number }, // Ms desde o início da sessão
        caminho: { type: String, default: null }, // Ex: /uploads/screenshots/abc_fase0.jpg
    },
    { _id: false },
);

// -------------------------------------------------------------------------
// Schema principal da sessão
// -------------------------------------------------------------------------

const SessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        // Identificador preservado do arquivo de origem. Em importações, o
        // sessionId persistido é específico do aluno para permitir que o
        // mesmo JSON seja associado a alunos distintos sem perder rastreio.
        sourceSessionId: { type: String },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },
        playerId: { type: String, required: true },
        gameId: { type: String, required: true },
        // Jogo informado pela fonte externa antes do vínculo com o jogo que
        // a pessoa usuária escolheu no dashboard.
        sourceGameId: { type: String },

        // Metadados da telemetria multi-jogo. Sessões históricas podem não
        // possuir esses campos e continuam legíveis pelo dashboard atual.
        schemaVersion: { type: String },
        captureMode: { type: String, enum: ["observational", "sdk"] },
        source: { type: String },
        sourceVersion: { type: String },
        ingestionMethod: { type: String, enum: ["direct-api", "file-import"] },
        capabilities: { type: CapacidadesSchema },
        viewport: { type: ViewportSchema },

        gameVersion: { type: String },
        platform: { type: String },
        startedAt: { type: String },
        endedAt: { type: String },
        durationMs: { type: Number, default: 0 },
        metrics: { type: MetricasSchema, default: () => ({}) },
        clicks: { type: [CliqueSchema], default: [] },
        mousePath: { type: [PathPointSchema], default: [] },
        dragPath: { type: [DragPathPointSchema], default: [] },
        gameEvents: { type: [GameEventSchema], default: [] },

        // Screenshots capturados pelo SDK Unity a cada início de fase.
        // Vazios (array vazio) quando a captura não estava ativa na sessão.
        screenshots: { type: [FaseScreenshotSchema], default: [] },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Session", SessionSchema);
