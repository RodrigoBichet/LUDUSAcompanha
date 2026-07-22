// =============================================================================
// games.js
// Rotas autenticadas para cadastro e consulta de jogos.
// =============================================================================

const express = require("express");
const { autenticar } = require("../middleware/auth");
const controller = require("../controllers/gamesController");

const router = express.Router();

router.get("/", autenticar, controller.listarJogos);
router.post("/", autenticar, controller.criarJogo);
router.post("/detected", autenticar, controller.criarJogoDetectado);
router.patch("/:id", autenticar, controller.atualizarJogo);
router.delete("/:id", autenticar, controller.arquivarJogo);
router.get("/:id", autenticar, controller.buscarJogo);

module.exports = router;
