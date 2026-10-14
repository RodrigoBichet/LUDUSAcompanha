// =============================================================================
// SdkCollectionSubmission.js
// Sessão do SDK recebida por uma coleta pareada. Checkpoints podem ser
// substituídos somente pela mesma credencial até a conclusão da sessão.
// =============================================================================

const mongoose = require("mongoose");

const SdkCollectionSubmissionSchema = new mongoose.Schema(
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
        sessionId: {
            type: String,
            required: true,
            immutable: true,
        },
        payloadDigest: {
            type: String,
            required: true,
        },
        sessionPayload: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        submissionKind: {
            type: String,
            enum: ["checkpoint", "completed"],
            default: "checkpoint",
            index: true,
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

SdkCollectionSubmissionSchema.index(
    { collectionRef: 1, participantRef: 1, sessionId: 1 },
    { unique: true },
);

module.exports = mongoose.model(
    "SdkCollectionSubmission",
    SdkCollectionSubmissionSchema,
);
