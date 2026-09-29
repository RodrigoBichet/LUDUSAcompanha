// =============================================================================
// database.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Configuração e conexão com o MongoDB Atlas via Mongoose.
// =============================================================================

const mongoose = require("mongoose");

const conectarBanco = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[LUDUS] MongoDB conectado com sucesso!");
};

module.exports = conectarBanco;
