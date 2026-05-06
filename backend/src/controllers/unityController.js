// =============================================================================
// unityController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de rotas públicas para o Unity.
// Sem autenticação JWT — o Unity busca instituições, turmas e alunos
// para exibir na tela de identificação antes do jogo começar.
// =============================================================================

const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");

// -------------------------------------------------------------------------
// listarInstituicoes — GET /api/unity/schools
// -------------------------------------------------------------------------

const listarInstituicoes = async (req, res) => {
    try {
        const instituicoes = await Institution.find()
            .select("_id name city")
            .sort({ name: 1 });

        return res.json({ sucesso: true, escolas: instituicoes });
    } catch (erro) {
        console.error(
            "[LUDUS] Unity - Erro ao listar instituições:",
            erro.message,
        );
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar instituições",
        });
    }
};

// -------------------------------------------------------------------------
// listarTurmas — GET /api/unity/groups/:institutionId
// -------------------------------------------------------------------------

const listarTurmas = async (req, res) => {
    try {
        const turmas = await Group.find({
            institutionId: req.params.institutionId,
        })
            .select("_id name")
            .sort({ name: 1 });

        return res.json({ sucesso: true, turmas });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao listar turmas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar turmas",
        });
    }
};

// -------------------------------------------------------------------------
// listarAlunos — GET /api/unity/students/:groupId
// -------------------------------------------------------------------------

const listarAlunos = async (req, res) => {
    try {
        const alunos = await Student.find({ groupId: req.params.groupId })
            .select("_id name capturaSolicitada")
            .sort({ name: 1 });

        return res.json({ sucesso: true, alunos });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao listar alunos:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar alunos",
        });
    }
};

module.exports = { listarInstituicoes, listarTurmas, listarAlunos };
