// =============================================================================
// users.js (routes)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Rotas de usuários — protegidas por autenticação e permissão admin.
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/usersController");
const { autenticar, apenasAdmin } = require("../middleware/auth");

// Todas as rotas exigem token válido + role admin
router.get("/", autenticar, apenasAdmin, controller.listarUsuarios);
router.put("/:id", autenticar, apenasAdmin, controller.atualizarUsuario);
router.delete("/:id", autenticar, apenasAdmin, controller.deletarUsuario);

module.exports = router;
