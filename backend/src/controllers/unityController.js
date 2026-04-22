// =============================================================================
// unityController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de rotas públicas para o Unity.
// Sem autenticação JWT — o Unity busca escolas, turmas e alunos
// para exibir na tela de identificação antes do jogo começar.
// =============================================================================

const School = require("../models/School");
const Group = require("../models/Group");
const Student = require("../models/Student");

// -------------------------------------------------------------------------
// listarEscolas — GET /api/unity/schools
// -------------------------------------------------------------------------

const listarEscolas = async (req, res) => {
    try {
        const escolas = await School.find()
            .select("_id name city")
            .sort({ name: 1 });

        return res.json({ sucesso: true, escolas });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao listar escolas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar escolas",
        });
    }
};

// -------------------------------------------------------------------------
// listarTurmas — GET /api/unity/groups/:schoolId
// -------------------------------------------------------------------------

const listarTurmas = async (req, res) => {
    try {
        const turmas = await Group.find({ schoolId: req.params.schoolId })
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
            .select("_id name")
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

module.exports = { listarEscolas, listarTurmas, listarAlunos };
