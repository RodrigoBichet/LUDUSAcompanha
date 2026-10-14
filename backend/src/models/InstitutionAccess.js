// =============================================================================
// InstitutionAccess.js
// Convite revogável que permite a outra conta colaborar com uma instituição
// real sem alterar seu papel principal no sistema.
// =============================================================================

const mongoose = require("mongoose");

const PermissoesSchema = new mongoose.Schema(
    {
        gerenciarEstrutura: { type: Boolean, default: false },
        prepararColetas: { type: Boolean, default: true },
        visualizarResultados: { type: Boolean, default: false },
    },
    { _id: false },
);

const InstitutionAccessSchema = new mongoose.Schema(
    {
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            immutable: true,
            index: true,
        },
        developerUserId: {
            // Nome legado preservado para manter compatibilidade com os
            // convites já criados. O campo representa qualquer colaborador.
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            index: true,
        },
        invitedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "declined", "revoked"],
            default: "pending",
            index: true,
        },
        permissions: {
            type: PermissoesSchema,
            default: () => ({}),
        },
        respondedAt: { type: Date, default: null },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

InstitutionAccessSchema.index(
    { institutionId: 1, developerUserId: 1 },
    { unique: true },
);

module.exports = mongoose.model("InstitutionAccess", InstitutionAccessSchema);
