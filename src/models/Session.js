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
); // _id: false — sub-schemas não precisam de ID próprio

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

const GameEventSchema = new mongoose.Schema(
    {
        eventType: { type: String },
        timestamp: { type: Number },
        payload: { type: String, default: "" },
    },
    { _id: false },
);

// -------------------------------------------------------------------------
// Schema principal da sessão
// -------------------------------------------------------------------------

const SessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true }, // UUID do Unity
        playerId: { type: String, required: true },
        gameId: { type: String, required: true },
        gameVersion: { type: String },
        platform: { type: String },
        startedAt: { type: String },
        endedAt: { type: String },
        durationMs: { type: Number, default: 0 },
        metrics: { type: MetricasSchema, default: () => ({}) },
        clicks: { type: [CliqueSchema], default: [] },
        mousePath: { type: [PathPointSchema], default: [] },
        gameEvents: { type: [GameEventSchema], default: [] },
    },
    {
        timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    },
);

module.exports = mongoose.model("Session", SessionSchema);
