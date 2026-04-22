// =============================================================================
// unity.js (routes)
// LUDUS Acompanha — UFPel (2026)
//
// Rotas públicas para o Unity — sem autenticação JWT.
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/unityController");

// Rotas públicas — Unity não usa token
router.get("/schools", controller.listarEscolas);
router.get("/groups/:schoolId", controller.listarTurmas);
router.get("/students/:groupId", controller.listarAlunos);

module.exports = router;
