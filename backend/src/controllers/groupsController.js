// =============================================================================
// groupsController.js
// Turmas protegidas pelo acesso à instituição de origem.
// =============================================================================

const Group = require("../models/Group");
const Student = require("../models/Student");
const {
    obterContextoEscolar,
    podeAcessarInstituicao,
} = require("../services/schoolAccess");

const responderSemContexto = (res) =>
    res.status(401).json({
        sucesso: false,
        mensagem: "Usuário autenticado não foi encontrado.",
    });

const buscarTurmaAcessivel = async (contexto, id) => {
    const turma = await Group.findById(id)
        .populate("institutionId", "name city ownerUserId")
        .populate("professorId", "name email");
    if (!turma || !podeAcessarInstituicao(contexto, turma.institutionId?._id)) {
        return null;
    }
    return turma;
};

const criarTurma = async (req, res) => {
    try {
        const { name, institutionId } = req.body;
        if (!name || !String(name).trim() || !institutionId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, institutionId.",
            });
        }

        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);
        if (!podeAcessarInstituicao(contexto, institutionId)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Sem permissão para criar turma nesta instituição.",
            });
        }

        const turma = new Group({
            name: String(name).trim(),
            institutionId,
            professorId: contexto.todasInstituicoes
                ? req.body.professorId || contexto.usuario._id
                : contexto.usuario._id,
        });
        await turma.save();

        return res.status(201).json({
            sucesso: true,
            mensagem: "Turma criada com sucesso.",
            turma,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar turma.",
        });
    }
};

const listarTurmas = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);

        const filtro = contexto.todasInstituicoes
            ? {}
            : { institutionId: { $in: contexto.institutionIds } };
        const turmas = await Group.find(filtro)
            .populate("institutionId", "name city")
            .populate("professorId", "name email")
            .sort({ name: 1 });

        return res.json({ sucesso: true, total: turmas.length, turmas });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar turmas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar turmas.",
        });
    }
};

const buscarTurma = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);
        const turma = await buscarTurmaAcessivel(contexto, req.params.id);
        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada ou sem permissão de acesso.",
            });
        }
        return res.json({ sucesso: true, turma });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar turma.",
        });
    }
};

const atualizarTurma = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);
        const turma = await buscarTurmaAcessivel(contexto, req.params.id);
        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada ou sem permissão para alterá-la.",
            });
        }

        const institutionId = req.body.institutionId || turma.institutionId._id;
        if (!podeAcessarInstituicao(contexto, institutionId)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Sem permissão para mover a turma para esta instituição.",
            });
        }
        if (!req.body.name || !String(req.body.name).trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Nome da turma é obrigatório.",
            });
        }

        turma.name = String(req.body.name).trim();
        turma.institutionId = institutionId;
        if (contexto.todasInstituicoes && req.body.professorId) {
            turma.professorId = req.body.professorId;
        }
        await turma.save();

        return res.json({
            sucesso: true,
            mensagem: "Turma atualizada com sucesso.",
            turma,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar turma.",
        });
    }
};

// Exclusão física só é permitida para turmas vazias, preservando alunos e sessões.
const deletarTurma = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);
        const turma = await buscarTurmaAcessivel(contexto, req.params.id);
        if (!turma) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada ou sem permissão para removê-la.",
            });
        }

        const totalAlunos = await Student.countDocuments({ groupId: turma._id });
        if (totalAlunos > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "A turma possui alunos e não pode ser excluída. O histórico foi preservado.",
            });
        }

        await Group.findByIdAndDelete(turma._id);
        return res.json({ sucesso: true, mensagem: "Turma vazia removida com sucesso." });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar turma:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar turma.",
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
