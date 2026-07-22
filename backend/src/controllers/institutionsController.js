// =============================================================================
// institutionsController.js
// Instituições próprias de professoras e instituições legadas administradas.
// =============================================================================

const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");
const User = require("../models/User");
const {
    obterContextoEscolar,
    filtroInstituicoesAcessiveis,
    podeGerenciarInstituicao,
} = require("../services/schoolAccess");

const responderSemContexto = (res) =>
    res.status(401).json({
        sucesso: false,
        mensagem: "Usuário autenticado não foi encontrado.",
    });

const criarInstituicao = async (req, res) => {
    try {
        const { name, city } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: name.",
            });
        }

        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);

        const instituicao = new Institution({
            name: String(name).trim(),
            city: city?.trim() || "",
            ownerUserId: contexto.usuario._id,
        });
        await instituicao.save();

        return res.status(201).json({
            sucesso: true,
            mensagem: "Instituição criada com sucesso.",
            instituicao,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar instituição.",
        });
    }
};

const listarInstituicoes = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);

        const instituicoes = await Institution.find(
            filtroInstituicoesAcessiveis(contexto),
        ).sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: instituicoes.length,
            instituicoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar instituições:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar instituições.",
        });
    }
};

const buscarInstituicao = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);

        const instituicao = await Institution.findOne({
            _id: req.params.id,
            ...filtroInstituicoesAcessiveis(contexto),
        });
        if (!instituicao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada ou sem permissão de acesso.",
            });
        }

        return res.json({ sucesso: true, instituicao });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar instituição.",
        });
    }
};

const atualizarInstituicao = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) return responderSemContexto(res);

        const instituicao = await Institution.findById(req.params.id);
        if (!instituicao || !podeGerenciarInstituicao(contexto, instituicao)) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada ou sem permissão para alterá-la.",
            });
        }

        const { name, city } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: name.",
            });
        }

        instituicao.name = String(name).trim();
        instituicao.city = city?.trim() || "";
        await instituicao.save();

        return res.json({
            sucesso: true,
            mensagem: "Instituição atualizada com sucesso.",
            instituicao,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar instituição.",
        });
    }
};

// Exclusão física continua exclusiva de admin e só é permitida sem alunos.
const deletarInstituicao = async (req, res) => {
    try {
        const instituicao = await Institution.findById(req.params.id);
        if (!instituicao) {
            return res.status(404).json({ sucesso: false, mensagem: "Instituição não encontrada." });
        }

        const turmas = await Group.find({ institutionId: instituicao._id }).select("_id");
        const idsTurmas = turmas.map((turma) => turma._id);
        const totalAlunos = await Student.countDocuments({ groupId: { $in: idsTurmas } });
        if (totalAlunos > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "A instituição possui alunos e não pode ser excluída. Preserve ou reorganize os vínculos antes de removê-la.",
            });
        }

        await Group.deleteMany({ institutionId: instituicao._id });
        await User.updateMany(
            { institutionId: instituicao._id },
            { $set: { institutionId: null } },
        );
        await Institution.findByIdAndDelete(instituicao._id);

        return res.json({
            sucesso: true,
            mensagem: "Instituição vazia removida com sucesso.",
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar instituição.",
        });
    }
};

module.exports = {
    criarInstituicao,
    listarInstituicoes,
    buscarInstituicao,
    atualizarInstituicao,
    deletarInstituicao,
};
