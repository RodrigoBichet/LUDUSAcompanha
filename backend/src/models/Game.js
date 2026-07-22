// =============================================================================
// Game.js
// Cadastro de jogos integrados ao LUDUS Acompanha.
// A existência do jogo não pressupõe um formato de telemetria ou capacidades.
// =============================================================================

const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema(
    {
        // Identificador técnico estável usado nas sessões normalizadas.
        gameId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: /^[a-z0-9][a-z0-9-]{0,99}$/,
        },
        // Nome amigável exibido no dashboard.
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        defaultVersion: {
            type: String,
            trim: true,
            maxlength: 50,
            default: "",
        },
        sourceType: {
            type: String,
            enum: ["sdk-ludus", "external-json", "manual"],
            default: "external-json",
        },
        active: {
            type: Boolean,
            default: true,
        },

        // Escopo e autorização. A chave é derivada pelo middleware abaixo
        // para permitir um índice único por usuário ou instituição.
        scopeType: {
            type: String,
            enum: ["personal", "institutional"],
            required: true,
        },
        scopeKey: {
            type: String,
            required: true,
            immutable: true,
        },
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            default: null,
            immutable: true,
        },
    },
    {
        timestamps: true,
    },
);

// scopeKey não é fornecida pela interface. Ela é calculada a partir do escopo
// para prevenir colisões entre jogos pessoais e institucionais com mesmo gameId.
GameSchema.pre("validate", function () {
    if (!this.ownerUserId) return;

    if (this.scopeType === "personal") {
        if (this.institutionId) {
            this.invalidate(
                "institutionId",
                "Jogo pessoal não pode possuir institutionId.",
            );
            return;
        }

        this.scopeKey = `user:${this.ownerUserId}`;
        return;
    }

    if (this.scopeType === "institutional") {
        if (!this.institutionId) {
            this.invalidate(
                "institutionId",
                "Jogo institucional exige institutionId.",
            );
            return;
        }

        this.scopeKey = `institution:${this.institutionId}`;
    }
});

GameSchema.index({ scopeKey: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model("Game", GameSchema);
