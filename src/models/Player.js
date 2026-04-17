// =============================================================================
// Player.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose do jogador (criança monitorada).
// =============================================================================

const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
        },
        notes: { type: String, default: "" }, // observações do professor
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Player", PlayerSchema);
