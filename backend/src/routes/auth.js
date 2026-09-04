// =============================================================================
// auth.js (routes)
// LUDUS Acompanha — UFPel (2026)
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { autenticar } = require("../middleware/auth");
const { criarLimitadorAuth } = require("../middleware/authRateLimiter");

const QUINZE_MINUTOS = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;
const limitarCadastro = criarLimitadorAuth({ nome: "cadastro", maximo: 5, janelaMs: UMA_HORA });
const limitarLogin = criarLimitadorAuth({ nome: "login", maximo: 10, janelaMs: QUINZE_MINUTOS, incluirEmail: true });
const limitarEmail = criarLimitadorAuth({ nome: "email-auth", maximo: 5, janelaMs: QUINZE_MINUTOS, incluirEmail: true });
const limitarToken = criarLimitadorAuth({ nome: "token-auth", maximo: 10, janelaMs: QUINZE_MINUTOS });

router.post("/register", limitarCadastro, controller.registrar);
router.post("/login", limitarLogin, controller.login);
router.post("/confirmar-email", limitarToken, controller.confirmarEmail);
router.post("/reenviar-confirmacao", limitarEmail, controller.reenviarConfirmacao);
router.post("/esqueci-senha", limitarEmail, controller.solicitarRedefinicaoSenha);
router.post("/redefinir-senha", limitarToken, controller.redefinirSenha);
router.get("/me", autenticar, controller.perfil);
router.put("/perfil", autenticar, controller.atualizarPerfil);
router.put("/institution-request", autenticar, controller.atualizarSolicitacaoInstituicao);

module.exports = router;
