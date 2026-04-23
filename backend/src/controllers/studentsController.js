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

// -------------------------------------------------------------------------
// atualizarAluno — PUT /api/students/:id
// -------------------------------------------------------------------------

const atualizarAluno = async (req, res) => {
    try {
        const {
            name,
            birthDate,
            groupId,
            notes,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
        } = req.body;

        const aluno = await Student.findByIdAndUpdate(
            req.params.id,
            {
                name,
                birthDate,
                groupId,
                notes,
                supportLevel,
                otherConditions,
                guardianName,
                guardianContact,
            },
            { returnDocument: "after", runValidators: true },
        );

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        console.log(`[LUDUS] Aluno atualizado: ${aluno.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Aluno atualizado com sucesso!",
            aluno,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// deletarAluno — DELETE /api/students/:id
// -------------------------------------------------------------------------

const deletarAluno = async (req, res) => {
    try {
        const aluno = await Student.findByIdAndDelete(req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        console.log(`[LUDUS] Aluno deletado: ${aluno.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Aluno deletado com sucesso!",
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// adicionarAnotacao — POST /api/students/:id/anotacoes
// -------------------------------------------------------------------------

const adicionarAnotacao = async (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim() === "") {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: texto",
            });
        }

        const usuario = await require("../models/User").findById(req.usuarioId);

        const aluno = await Student.findById(req.params.id);
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        aluno.anotacoes.push({
            texto: texto.trim(),
            autorId: req.usuarioId,
            autorNome: usuario.name,
        });

        await aluno.save();

        console.log(`[LUDUS] Anotação adicionada para: ${aluno.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Anotação adicionada com sucesso!",
            anotacoes: aluno.anotacoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao adicionar anotação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao adicionar anotação",
        });
    }
};

// -------------------------------------------------------------------------
// deletarAnotacao — DELETE /api/students/:id/anotacoes/:anotacaoId
// -------------------------------------------------------------------------

const deletarAnotacao = async (req, res) => {
    try {
        const aluno = await Student.findById(req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        aluno.anotacoes = aluno.anotacoes.filter(
            (a) => a._id.toString() !== req.params.anotacaoId,
        );

        await aluno.save();

        return res.json({
            sucesso: true,
            mensagem: "Anotação removida com sucesso!",
            anotacoes: aluno.anotacoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar anotação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar anotação",
        });
    }
};

module.exports = {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    deletarAluno,
    adicionarAnotacao,
    deletarAnotacao,
};
