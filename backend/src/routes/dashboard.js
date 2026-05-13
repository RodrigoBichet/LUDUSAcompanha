// =============================================================================
// dashboard.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");

router.get("/summary/:studentId", controller.resumoJogador);
router.get("/alerts/:studentId", controller.alertasAluno);
router.get("/heatmap/:sessionId", controller.heatmapSessao);

module.exports = router;
