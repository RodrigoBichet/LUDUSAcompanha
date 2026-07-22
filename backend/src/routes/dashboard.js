// =============================================================================
// dashboard.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const { autenticar } = require("../middleware/auth");

router.get("/summary/:studentId", autenticar, controller.resumoJogador);
router.get("/alerts/:studentId", autenticar, controller.alertasAluno);
router.get("/heatmap/:sessionId", autenticar, controller.heatmapSessao);

module.exports = router;
