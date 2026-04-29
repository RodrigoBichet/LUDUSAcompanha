// =============================================================================
// institutions.js (routes)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Rotas de instituições — admin pode criar, editar e remover.
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/institutionsController");
const { autenticar, apenasAdmin } = require("../middleware/auth");

router.post("/", autenticar, apenasAdmin, controller.criarInstituicao);
router.get("/", autenticar, controller.listarInstituicoes);
router.get("/:id", autenticar, controller.buscarInstituicao);
router.put("/:id", autenticar, apenasAdmin, controller.atualizarInstituicao);
router.delete("/:id", autenticar, apenasAdmin, controller.deletarInstituicao);

module.exports = router;
