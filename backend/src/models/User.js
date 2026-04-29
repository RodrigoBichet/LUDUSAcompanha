// =============================================================================
// User.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Model Mongoose do usuário do sistema (professor ou administrador).
// =============================================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
            enum: ["admin", "professor"],
            default: "professor",
        },
        institutionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
        },
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
