// =============================================================================
// sessions.js (routes)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Rotas de sessões de jogo.
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/sessionsController");
const { autenticar, apenasAdmin } = require("../middleware/auth");

// POST /api/sessions       — recebe sessão do Unity
router.post("/", controller.criarSessao);

// Importação autenticada pelo dashboard: valida antes de persistir.
router.post(
    "/import/:studentId/preview",
    autenticar,
    controller.previewImportacao,
);
router.post(
    "/import/:studentId/confirm",
    autenticar,
    controller.confirmarImportacao,
);
router.post(
    "/import-batch/:studentId/preview",
    autenticar,
    controller.previewImportacaoLote,
);
router.post(
    "/import-batch/:studentId/confirm",
    autenticar,
    controller.confirmarImportacaoLote,
);

// GET  /api/sessions       — lista sessões (debug)
router.get("/", autenticar, apenasAdmin, controller.listarSessoes);

router.get("/student/:studentId", autenticar, controller.sessoesPorAluno);

// GET  /api/sessions/:id   — busca sessão completa
router.get("/:sessionId", autenticar, controller.buscarSessao);

// DELETE /api/sessions/:id — remove somente sessão importada por JSON
router.delete("/:sessionId", autenticar, controller.removerSessaoImportada);

module.exports = router;
