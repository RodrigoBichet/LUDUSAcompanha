// =============================================================================
// ObservationCollection.js
// Coleta escolar temporária que autoriza futuramente o envio limitado do
// LUDUS Observa, sem compartilhar o JWT da professora.
// =============================================================================

const mongoose = require("mongoose");

const ObservationCollectionSchema = new mongoose.Schema(
    {
        collectionId: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            index: true,
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
            immutable: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
            immutable: true,
        },
        status: {
            type: String,
            enum: ["prepared", "active", "closed", "revoked"],
            default: "active",
            index: true,
        },
        startsAt: {
            type: Date,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        pairingCodeHash: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            select: false,
        },
        allowedOrigins: {
            type: [String],
            default: [],
        },
        closedAt: {
            type: Date,
            default: null,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

ObservationCollectionSchema.index({ ownerUserId: 1, createdAt: -1 });

module.exports = mongoose.model(
    "ObservationCollection",
    ObservationCollectionSchema,
);
