// =============================================================================
// Group.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose da turma.
// =============================================================================

const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
        },
        professorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Group", GroupSchema);
