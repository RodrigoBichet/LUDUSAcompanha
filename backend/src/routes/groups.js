const express = require("express");
const router = express.Router();
const controller = require("../controllers/groupsController");
const { autenticar } = require("../middleware/auth");

router.post("/", autenticar, controller.criarTurma);
router.get("/", autenticar, controller.listarTurmas);
router.get("/:id", autenticar, controller.buscarTurma);
router.put("/:id", autenticar, controller.atualizarTurma);
router.delete("/:id", autenticar, controller.deletarTurma);

module.exports = router;
