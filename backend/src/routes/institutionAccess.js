const express = require("express");
const controller = require("../controllers/institutionAccessController");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.get("/", autenticar, controller.listarAcessos);
router.post("/invitations", autenticar, controller.convidarColaborador);
router.patch("/:id/respond", autenticar, controller.responderConvite);
router.patch("/:id/permissions", autenticar, controller.atualizarPermissoes);
router.patch("/:id/revoke", autenticar, controller.revogarAcesso);

module.exports = router;
