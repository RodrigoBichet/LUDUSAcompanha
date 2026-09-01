// =============================================================================
// ObservationSubmission.js
// Sessão observacional recebida e mantida pendente para revisão da professora.
// Não cria Student nem Session definitiva durante o recebimento.
// =============================================================================

const mongoose = require("mongoose");

const ObservationSubmissionSchema = new mongoose.Schema(
    {
        receiptId: {
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
        participantRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CollectionParticipant",
            required: true,
            immutable: true,
            index: true,
        },
        batchId: {
            type: String,
            required: true,
            immutable: true,
        },
        sessionId: {
            type: String,
            required: true,
            immutable: true,
        },
        payloadDigest: {
            type: String,
            required: true,
            immutable: true,
        },
        sessionPayload: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            immutable: true,
        },
        status: {
            type: String,
            enum: ["pending", "imported", "rejected"],
            default: "pending",
            index: true,
        },
        importedSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

ObservationSubmissionSchema.index(
    { collectionRef: 1, participantRef: 1, sessionId: 1 },
    { unique: true },
);

module.exports = mongoose.model(
    "ObservationSubmission",
    ObservationSubmissionSchema,
);

