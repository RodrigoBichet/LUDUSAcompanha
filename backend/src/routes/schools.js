const express = require("express");
const router = express.Router();
const controller = require("../controllers/schoolsController");
const { autenticar, apenasAdmin } = require("../middleware/auth");

router.post("/", autenticar, apenasAdmin, controller.criarEscola);
router.get("/", autenticar, controller.listarEscolas);
router.get("/:id", autenticar, controller.buscarEscola);

module.exports = router;
