// =============================================================================
// redefinirSenhaAdmin.js
// Redefine pontualmente a senha de uma conta administrativa existente.
// Uso: npm run admin:reset-password -- --email=admin@exemplo.com
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

const redefinir = async () => {
    const email = obterArgumento("email")?.toLowerCase();

    if (!email) {
        throw new Error("Informe o email com --email=admin@exemplo.com.");
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI não está configurada neste ambiente.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const usuario = await User.findOne({ email }).select("+authVersion");
    if (!usuario) {
        throw new Error("Nenhum usuário foi encontrado com esse email.");
    }

    if (usuario.role !== "admin") {
        throw new Error("A conta encontrada não é administradora. Nenhuma alteração foi realizada.");
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    usuario.password = senhaTemporaria;
    usuario.authVersion = Number(usuario.authVersion || 0) + 1;
    await usuario.save();

    console.log("[LUDUS] Senha administrativa redefinida com sucesso.");
    console.log(`Email: ${usuario.email}`);
    console.log(`Senha temporária: ${senhaTemporaria}`);
    console.log("Entre no dashboard e troque esta senha imediatamente na página de perfil.");
};

redefinir()
    .catch((erro) => {
        console.error(`[LUDUS] Redefinição não realizada: ${erro.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
