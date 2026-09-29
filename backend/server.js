// =============================================================================
// server.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Ponto de entrada do servidor.
// Carrega variáveis de ambiente, conecta ao banco e inicia o Express.
// =============================================================================

require("dotenv").config(); // Carrega o .env

const app = require("./src/app"); // Configuração do Express
const conectarBanco = require("./src/config/database");
const { validarAmbiente } = require("./src/config/validarAmbiente");

const iniciarServidor = async () => {
    const { porta } = validarAmbiente();
    await conectarBanco();

    return app.listen(porta, () => {
        console.log(`[LUDUS] Servidor rodando na porta ${porta}`);
    });
};

if (require.main === module) {
    iniciarServidor().catch((erro) => {
        console.error(`[LUDUS] Falha ao iniciar: ${erro.message}`);
        process.exitCode = 1;
    });
}

module.exports = { iniciarServidor };
