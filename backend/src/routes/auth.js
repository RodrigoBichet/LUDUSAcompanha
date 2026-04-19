// =============================================================================
// auth.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { autenticar } = require("../middleware/auth");

router.post("/register", controller.registrar);
router.post("/login", controller.login);
router.get("/me", autenticar, controller.perfil);

module.exports = router;
