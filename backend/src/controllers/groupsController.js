// =============================================================================
// groupsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das turmas.
// Professor vê só as turmas da sua instituição.
// Admin vê todas.
// =============================================================================

const Group = require("../models/Group");
const User = require("../models/User");
const Student = require("../models/Student");
const { removerSessoesPorFiltro } = require("../utils/removerSessoes");

const criarTurma = async (req, res) => {
    try {
        const { name, institutionId, professorId } = req.body;

        if (!name || !institutionId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, institutionId",
            });
        }

        const turma = new Group({ name, institutionId, professorId });
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

const listarTurmas = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId);
        let filtro = {};

        // Professor vê só turmas da sua instituição
        if (usuario.role === "professor") {
            filtro = { institutionId: usuario.institutionId };
        }

        const turmas = await Group.find(filtro)
            .populate("institutionId", "name city")
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

const buscarTurma = async (req, res) => {
    try {
        const turma = await Group.findById(req.params.id)
            .populate("institutionId", "name city")
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

const atualizarTurma = async (req, res) => {
    try {
        const { name, professorId, institutionId } = req.body;

        const turma = await Group.findByIdAndUpdate(
            req.params.id,
            { name, professorId, institutionId },
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

const deletarTurma = async (req, res) => {
    try {
        const turma = await Group.findById(req.params.id);

        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada",
            });
        }

        const alunos = await Student.find({ groupId: turma._id }).select("_id");
        const idsAlunos = alunos.map((aluno) => aluno._id);

        const limpeza =
            idsAlunos.length > 0
                ? await removerSessoesPorFiltro({
                      studentId: { $in: idsAlunos },
                  })
                : { sessoesRemovidas: 0, arquivosRemovidos: 0 };

        const alunosRemovidos = await Student.deleteMany({
            groupId: turma._id,
        });

        await Group.findByIdAndDelete(turma._id);

        console.log(
            `[LUDUS] Turma deletada: ${turma.name} | Alunos removidos: ${alunosRemovidos.deletedCount} | Sessões removidas: ${limpeza.sessoesRemovidas} | Arquivos removidos: ${limpeza.arquivosRemovidos}`,
        );

        return res.json({
            sucesso: true,
            mensagem:
                "Turma, alunos, sessões e imagens vinculadas deletados com sucesso!",
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
