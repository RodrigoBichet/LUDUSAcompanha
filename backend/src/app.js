// =============================================================================
// app.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Configuração do Express — middlewares e rotas.
// =============================================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// -------------------------------------------------------------------------
// Middlewares
// -------------------------------------------------------------------------

app.use(cors()); // Permite requisições de qualquer origem (Unity, Dashboard)
app.use(express.json({ limit: "25mb" })); // Interpreta JSON no corpo das requisições
//Screenshots em base64 podem passar do limite padrão do Express e causar erro antes de chegar no controller
app.use("/api/users", require("./routes/users"));

// -------------------------------------------------------------------------
// Rota de health check — confirma que o servidor está rodando
// -------------------------------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "LUDUS Acompanha API rodando!",
        versao: "1.0.0",
    });
});

// -------------------------------------------------------------------------
// Rotas da API (serão adicionadas em breve)
// -------------------------------------------------------------------------

app.use("/api/unity", require("./routes/unity"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/institutions", require("./routes/institutions"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/students", require("./routes/students"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

module.exports = app;
