// =============================================================================
// studentsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller dos alunos monitorados.
// =============================================================================

const Student = require("../models/Student");
const Session = require("../models/Session");

// -------------------------------------------------------------------------
// criarAluno — POST /api/students
// -------------------------------------------------------------------------

const criarAluno = async (req, res) => {
    try {
        const { name, birthDate, groupId, notes } = req.body;

        if (!name || !groupId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, groupId",
            });
        }

        const aluno = new Student({ name, birthDate, groupId, notes });
        await aluno.save();

        console.log(`[LUDUS] Aluno criado: ${aluno.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Aluno criado com sucesso!",
            aluno,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// listarAlunos — GET /api/students?groupId=xxx
// -------------------------------------------------------------------------

const listarAlunos = async (req, res) => {
    try {
        const { groupId } = req.query;
        const filtro = groupId ? { groupId } : {};

        const alunos = await Student.find(filtro)
            .populate("groupId", "name")
            .sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: alunos.length,
            alunos,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar alunos:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar alunos",
        });
    }
};

// -------------------------------------------------------------------------
// buscarAluno — GET /api/students/:id
// -------------------------------------------------------------------------

const buscarAluno = async (req, res) => {
    try {
        const aluno = await Student.findById(req.params.id).populate(
            "groupId",
            "name",
        );

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        // Busca sessões do aluno pelo nome
        const sessoes = await Session.find({ playerId: aluno.name })
            .select("sessionId startedAt durationMs metrics")
            .sort({ startedAt: -1 });

        return res.json({
            sucesso: true,
            aluno,
            totalSessoes: sessoes.length,
            sessoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar aluno",
        });
    }
};

module.exports = { criarAluno, listarAlunos, buscarAluno };
