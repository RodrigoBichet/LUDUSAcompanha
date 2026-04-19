// =============================================================================
// Student.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose do aluno monitorado.
// =============================================================================

const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        birthDate: {
            type: Date,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Student", StudentSchema);
