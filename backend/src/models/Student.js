// =============================================================================
// Student.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose do aluno monitorado.
// =============================================================================

const mongoose = require("mongoose");

// Sub-schema para anotações do professor
const AnotacaoSchema = new mongoose.Schema(
    {
        texto: { type: String, required: true },
        autorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        autorNome: { type: String },
    },
    {
        timestamps: true,
        _id: true,
    },
);

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

        // Informações clínicas
        supportLevel: {
            type: String,
            enum: ["Nível 1", "Nível 2", "Nível 3", "Não informado"],
            default: "Não informado",
        },
        otherConditions: {
            type: String,
            default: "",
        },

        // Responsável
        guardianName: { type: String, default: "" },
        guardianContact: { type: String, default: "" },

        // Histórico de anotações do professor
        anotacoes: { type: [AnotacaoSchema], default: [] },

        // Flag de solicitação de captura de screenshots
        // Ativado pelo professor no dashboard ou na tela de identificação.
        // O SDK Unity verifica este campo ao carregar o aluno e ativa
        // a captura automaticamente. Resetado pelo backend após receber
        // uma sessão que contém screenshots.
        capturaSolicitada: {
            type: Boolean,
            default: false,
        },
        capturaSolicitadaOrigem: {
            type: String,
            enum: ["dashboard", "unity", null],
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Student", StudentSchema);
