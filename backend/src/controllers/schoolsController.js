// =============================================================================
// schoolsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller das escolas — apenas admin pode criar e listar todas.
// =============================================================================

const School = require("../models/School");

// -------------------------------------------------------------------------
// criarEscola — POST /api/schools
// -------------------------------------------------------------------------

const criarEscola = async (req, res) => {
    try {
        const { name, city } = req.body;

        if (!name) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: name",
            });
        }

        const escola = new School({ name, city });
        await escola.save();

        console.log(`[LUDUS] Escola criada: ${escola.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Escola criada com sucesso!",
            escola,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar escola:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar escola",
        });
    }
};

// -------------------------------------------------------------------------
// listarEscolas — GET /api/schools
// -------------------------------------------------------------------------

const listarEscolas = async (req, res) => {
    try {
        const escolas = await School.find().sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: escolas.length,
            escolas,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar escolas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar escolas",
        });
    }
};

// -------------------------------------------------------------------------
// buscarEscola — GET /api/schools/:id
// -------------------------------------------------------------------------

const buscarEscola = async (req, res) => {
    try {
        const escola = await School.findById(req.params.id);

        if (!escola) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Escola não encontrada",
            });
        }

        return res.json({ sucesso: true, escola });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar escola:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar escola",
        });
    }
};

module.exports = { criarEscola, listarEscolas, buscarEscola };
