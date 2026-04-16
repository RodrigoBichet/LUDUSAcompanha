// =============================================================================
// server.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Ponto de entrada do servidor.
// Carrega variáveis de ambiente, conecta ao banco e inicia o Express.
// =============================================================================

require("dotenv").config(); // Carrega o .env

const app = require("./src/app");
const conectarBanco = require("./src/config/database");

const PORT = process.env.PORT || 3000;

// Conecta ao banco e inicia o servidor
conectarBanco().then(() => {
    app.listen(PORT, () => {
        console.log(`[LUDUS] Servidor rodando na porta ${PORT}`);
    });
});
