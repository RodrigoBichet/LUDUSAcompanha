// =============================================================================
// groupsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das turmas.
// Professor vê só as turmas da sua escola.
// Admin vê todas.
// =============================================================================

const Group = require("../models/Group");
const User = require("../models/User");

// -------------------------------------------------------------------------
// criarTurma — POST /api/groups
// -------------------------------------------------------------------------

const criarTurma = async (req, res) => {
    try {
        const { name, schoolId, professorId } = req.body;

        if (!name || !schoolId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, schoolId",
            });
        }

        const turma = new Group({ name, schoolId, professorId });
        await turma.save();

        console.log(`[LUDUS] Turma criada: ${turma.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Turma criada com sucesso!",
            turma,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar turma",
        });
    }
};

// -------------------------------------------------------------------------
// listarTurmas — GET /api/groups
// Admin vê todas, professor vê só as da sua escola
// -------------------------------------------------------------------------

const listarTurmas = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId);
        let filtro = {};

        // Professor vê só turmas da sua escola
        if (usuario.role === "professor") {
            filtro = { schoolId: usuario.schoolId };
        }

        const turmas = await Group.find(filtro)
            .populate("schoolId", "name city")
            .populate("professorId", "name email")
            .sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: turmas.length,
            turmas,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar turmas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar turmas",
        });
    }
};

// -------------------------------------------------------------------------
// buscarTurma — GET /api/groups/:id
// -------------------------------------------------------------------------

const buscarTurma = async (req, res) => {
    try {
        const turma = await Group.findById(req.params.id)
            .populate("schoolId", "name city")
            .populate("professorId", "name email");

        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada",
            });
        }

        return res.json({ sucesso: true, turma });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar turma",
        });
    }
};

// -------------------------------------------------------------------------
// atualizarTurma — PUT /api/groups/:id
// -------------------------------------------------------------------------

const atualizarTurma = async (req, res) => {
    try {
        const { name, professorId } = req.body;

        const turma = await Group.findByIdAndUpdate(
            req.params.id,
            { name, professorId },
            { new: true, runValidators: true },
        );

        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada",
            });
        }

        console.log(`[LUDUS] Turma atualizada: ${turma.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Turma atualizada com sucesso!",
            turma,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar turma",
        });
    }
};

// -------------------------------------------------------------------------
// deletarTurma — DELETE /api/groups/:id
// -------------------------------------------------------------------------

const deletarTurma = async (req, res) => {
    try {
        const turma = await Group.findByIdAndDelete(req.params.id);

        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada",
            });
        }

        console.log(`[LUDUS] Turma deletada: ${turma.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Turma deletada com sucesso!",
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar turma",
        });
    }
};

module.exports = {
    criarTurma,
    listarTurmas,
    buscarTurma,
    atualizarTurma,
    deletarTurma,
};
