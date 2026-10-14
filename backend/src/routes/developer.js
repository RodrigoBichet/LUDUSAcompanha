const express = require("express");
const controller = require("../controllers/developerLabController");
const { autenticar, apenasDesenvolvedor } = require("../middleware/auth");

const router = express.Router();

router.get("/lab", autenticar, apenasDesenvolvedor, controller.obterLaboratorio);
router.post("/lab/setup", autenticar, apenasDesenvolvedor, controller.prepararLaboratorio);

module.exports = router;
