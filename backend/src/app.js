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
const { criarPoliticaCors } = require("./config/cors");

const app = express();
const politicaCors = criarPoliticaCors();

// -------------------------------------------------------------------------
// Middlewares
// -------------------------------------------------------------------------

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(cors(politicaCors.opcoes));
app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "no-referrer");
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
    next();
});
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
app.use("/api/games", require("./routes/games"));
app.use("/api/collections", require("./routes/collections"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

module.exports = app;
