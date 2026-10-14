// =============================================================================
// criarAdmin.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Script para criar o primeiro usuário administrador do sistema.
// Uso: node src/scripts/criarAdmin.js --name="Nome" --email=admin@exemplo.com
// =============================================================================

require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");

const obterArgumento = (nome) => {
    const prefixo = `--${nome}=`;
    const argumento = process.argv.slice(2).find((item) => item.startsWith(prefixo));
    return argumento?.slice(prefixo.length).trim();
};

const gerarSenhaTemporaria = () => `Ludus@${crypto.randomBytes(9).toString("base64url")}`;

const criar = async () => {
    const name = obterArgumento("name");
    const email = obterArgumento("email")?.toLowerCase();

    if (!name || name.length < 2) {
        throw new Error('Informe o nome com --name="Nome do administrador".');
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("Informe um email válido com --email=admin@exemplo.com.");
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI não está configurada neste ambiente.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existente = await User.findOne({ email });
    if (existente) {
        throw new Error("Já existe uma conta com esse email. Nenhuma alteração foi realizada.");
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const admin = new User({ name, email, password: senhaTemporaria, role: "admin" });
    await admin.save();

    console.log("[LUDUS] Administrador criado com sucesso.");
    console.log(`Email: ${email}`);
    console.log(`Senha temporária: ${senhaTemporaria}`);
    console.log("Entre no dashboard e troque esta senha imediatamente na página de perfil.");
};

criar()
    .catch((erro) => {
        console.error(`[LUDUS] Administrador não criado: ${erro.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
