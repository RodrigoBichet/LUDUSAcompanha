// =============================================================================
// dashboard.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");

router.get("/summary/:playerId", controller.resumoJogador);
router.get("/heatmap/:sessionId", controller.heatmapSessao);

module.exports = router;
