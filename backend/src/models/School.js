// =============================================================================
// School.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose da escola.
// =============================================================================

const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        city: { type: String },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("School", SchoolSchema);
