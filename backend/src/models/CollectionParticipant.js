// =============================================================================
// CollectionParticipant.js
// Identidade técnica temporária de quem participa de uma coleta observacional.
// Não cria automaticamente um aluno definitivo no cadastro escolar.
// =============================================================================

const mongoose = require("mongoose");

const CollectionParticipantSchema = new mongoose.Schema(
    {
        participantRef: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        collectionRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ObservationCollection",
            required: true,
            immutable: true,
            index: true,
        },
        displayName: {
            type: String,
            required: true,
            immutable: true,
        },
        normalizedName: {
            type: String,
            required: true,
            immutable: true,
        },
        resolutionStatus: {
            type: String,
            enum: ["pending", "resolved"],
            default: "pending",
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

CollectionParticipantSchema.index(
    { collectionRef: 1, normalizedName: 1 },
    { unique: true },
);

module.exports = mongoose.model(
    "CollectionParticipant",
    CollectionParticipantSchema,
);
