// =============================================================================
// institutionsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das instituições — apenas admin pode criar e listar todas.
// =============================================================================

const Institution = require("../models/Institution");
const User = require("../models/User");

// -------------------------------------------------------------------------
// criarInstituicao — POST /api/institutions
// -------------------------------------------------------------------------
const criarInstituicao = async (req, res) => {
    try {
        const { name, city } = req.body;

        if (!name) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: name",
            });
        }

        const instituicao = new Institution({ name, city });
        await instituicao.save();

        console.log(`[LUDUS] Instituição criada: ${instituicao.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Instituição criada com sucesso!",
            instituicao,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar instituição",
        });
    }
};

// -------------------------------------------------------------------------
// listarInstituicoes — GET /api/institutions
// -------------------------------------------------------------------------
const listarInstituicoes = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId);

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        const filtro =
            usuario.role === "professor" ? { _id: usuario.institutionId } : {};

        const instituicoes = await Institution.find(filtro).sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: instituicoes.length,
            instituicoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar instituições:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar instituições",
        });
    }
};

// -------------------------------------------------------------------------
// buscarInstituicao — GET /api/institutions/:id
// -------------------------------------------------------------------------
const buscarInstituicao = async (req, res) => {
    try {
        const instituicao = await Institution.findById(req.params.id);

        if (!instituicao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada",
            });
        }

        return res.json({ sucesso: true, instituicao });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar instituição",
        });
    }
};

// -------------------------------------------------------------------------
// atualizarInstituicao — PUT /api/institutions/:id
// -------------------------------------------------------------------------
const atualizarInstituicao = async (req, res) => {
    try {
        const { name, city } = req.body;

        const instituicao = await Institution.findByIdAndUpdate(
            req.params.id,
            { name, city },
            { new: true, runValidators: true },
        );

        if (!instituicao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada",
            });
        }

        console.log(`[LUDUS] Instituição atualizada: ${instituicao.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Instituição atualizada com sucesso!",
            instituicao,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar instituição",
        });
    }
};

// -------------------------------------------------------------------------
// deletarInstituicao — DELETE /api/institutions/:id
// -------------------------------------------------------------------------
const deletarInstituicao = async (req, res) => {
    try {
        const instituicao = await Institution.findByIdAndDelete(req.params.id);

        if (!instituicao) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada",
            });
        }

        console.log(`[LUDUS] Instituição deletada: ${instituicao.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Instituição deletada com sucesso!",
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar instituição:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar instituição",
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
