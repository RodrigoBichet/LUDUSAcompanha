const express = require("express");
const router = express.Router();
const controller = require("../controllers/studentsController");
const { autenticar } = require("../middleware/auth");

router.post("/", autenticar, controller.criarAluno);
router.get("/", autenticar, controller.listarAlunos);
router.get("/:id", autenticar, controller.buscarAluno);
router.put("/:id", autenticar, controller.atualizarAluno);
router.delete("/:id", autenticar, controller.deletarAluno);
router.post("/:id/anotacoes", autenticar, controller.adicionarAnotacao);
router.delete(
    "/:id/anotacoes/:anotacaoId",
    autenticar,
    controller.deletarAnotacao,
);

module.exports = router;
