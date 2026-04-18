// =============================================================================
// players.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/playersController");

router.post("/", controller.criarJogador);
router.get("/", controller.listarJogadores);
router.get("/:id", controller.buscarJogador);
router.get("/:playerId/sessions", controller.historicoJogador);

module.exports = router;
