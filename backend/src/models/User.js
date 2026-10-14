// =============================================================================
// User.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose dos usuários do sistema.
// =============================================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SolicitacaoInstituicaoSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 160 },
        city: { type: String, trim: true, maxlength: 120 },
        status: {
            type: String,
            enum: ["pending", "rejected"],
            default: "pending",
        },
        rejectionReason: { type: String, trim: true, maxlength: 500 },
        reviewedAt: { type: Date },
        requestedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const AceitePrivacidadeSchema = new mongoose.Schema(
    {
        noticeVersion: { type: String, required: true, trim: true, maxlength: 40 },
        acceptedAt: { type: Date, required: true },
    },
    { _id: false },
);

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "professor", "developer"],
            default: "professor",
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
        },
        institutionRequest: {
            type: SolicitacaoInstituicaoSchema,
            default: undefined,
        },
        privacyAcceptance: {
            type: AceitePrivacidadeSchema,
            default: undefined,
        },
        emailVerifiedAt: { type: Date, default: null },
        emailVerificationTokenHash: { type: String, select: false },
        emailVerificationExpiresAt: { type: Date, select: false },
        passwordResetTokenHash: { type: String, select: false },
        passwordResetExpiresAt: { type: Date, select: false },
        authVersion: { type: Number, default: 0, select: false },
    },
    {
        timestamps: true,
    },
);

// Criptografa a senha antes de salvar
UserSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Método para comparar senha no login
UserSchema.methods.compararSenha = async function (senhaDigitada) {
    return bcrypt.compare(senhaDigitada, this.password);
};

module.exports = mongoose.model("User", UserSchema);
