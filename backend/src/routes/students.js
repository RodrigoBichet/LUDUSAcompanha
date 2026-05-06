// =============================================================================
// students.js (rotas)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/studentsController");
const { autenticar } = require("../middleware/auth");

router.post("/", autenticar, controller.criarAluno);
router.get("/", autenticar, controller.listarAlunos);
router.get("/:id", autenticar, controller.buscarAluno);
router.put("/:id", autenticar, controller.atualizarAluno);
router.delete("/:id", autenticar, controller.deletarAluno);

// Anotações
router.post("/:id/anotacoes", autenticar, controller.adicionarAnotacao);
router.delete(
    "/:id/anotacoes/:anotacaoId",
    autenticar,
    controller.deletarAnotacao,
);

// Solicitação de captura de screenshots
// PATCH em vez de POST porque é uma atualização parcial de um campo do aluno
router.patch("/:id/solicitar-captura", autenticar, controller.solicitarCaptura);

module.exports = router;
