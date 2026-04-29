// =============================================================================
// Institution.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose da instituição parceira (escola, APAE, universidade, etc.).
// =============================================================================

const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        city: { type: String },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Institution", InstitutionSchema);
