const express = require("express");
const router = express.Router();
const controller = require("../controllers/schoolsController");
const { autenticar, apenasAdmin } = require("../middleware/auth");

router.post("/", autenticar, apenasAdmin, controller.criarEscola);
router.get("/", autenticar, controller.listarEscolas);
router.get("/:id", autenticar, controller.buscarEscola);
router.put("/:id", autenticar, apenasAdmin, controller.atualizarEscola);
router.delete("/:id", autenticar, apenasAdmin, controller.deletarEscola);

module.exports = router;
