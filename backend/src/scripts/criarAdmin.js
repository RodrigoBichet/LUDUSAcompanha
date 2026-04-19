// =============================================================================
// criarAdmin.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Script para criar o primeiro usuário administrador do sistema.
// Rodar apenas uma vez: node src/scripts/criarAdmin.js
// =============================================================================

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN = {
    name: "Rodrigo Bichet",
    email: "rodrigobichet39@gmail.com", // ← troca pelo teu email
    password: "admin123", // ← troca pela tua senha
    role: "admin",
};

const criar = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[LUDUS] MongoDB conectado!");

        const existente = await User.findOne({ email: ADMIN.email });
        if (existente) {
            console.log("[LUDUS] Admin já existe:", ADMIN.email);
            process.exit(0);
        }

        const admin = new User(ADMIN);
        await admin.save();

        console.log("[LUDUS] Admin criado com sucesso!");
        console.log("  Email:", ADMIN.email);
        console.log("  Role: admin");
        process.exit(0);
    } catch (erro) {
        console.error("[LUDUS] Erro:", erro.message);
        process.exit(1);
    }
};

criar();
