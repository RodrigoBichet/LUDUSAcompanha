// =============================================================================
// database.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Configuração e conexão com o MongoDB Atlas via Mongoose.
// =============================================================================

const mongoose = require("mongoose");

const conectarBanco = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[LUDUS] MongoDB conectado com sucesso!");
    } catch (erro) {
        console.error("[LUDUS] Erro ao conectar com MongoDB:", erro.message);
        process.exit(1); // Encerra o servidor se não conseguir conectar
    }
};

module.exports = conectarBanco;
