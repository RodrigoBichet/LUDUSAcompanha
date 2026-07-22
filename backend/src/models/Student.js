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
            required: false,
            default: null,
        },
        // Contexto opcional para alunos individuais. Alunos escolares mantêm
        // groupId e têm a instituição validada a partir da turma.
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            default: null,
        },
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        enrollmentMode: {
            type: String,
            enum: ["school", "individual", "legacy"],
            default: "legacy",
        },
        // Jogos aos quais o aluno foi associado pelo fluxo individual.
        // Alunos escolares históricos de Para Que Serve? permanecem sem este
        // campo e são lidos pelo perfil legado, sem migração em massa.
        assignedGameIds: {
            type: [String],
            default: [],
        },

        // Trava explícita para perfis reais que não podem ser removidos pelos
        // fluxos comuns de limpeza de dados de demonstração.
        deletionProtected: {
            type: Boolean,
            default: false,
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
