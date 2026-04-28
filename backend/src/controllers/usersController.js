// =============================================================================
// usersController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de usuários — listagem e remoção. Apenas admin.
// =============================================================================

const User = require("../models/User");

// -------------------------------------------------------------------------
// listarUsuarios — GET /api/users
// -------------------------------------------------------------------------
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find()
            .select("-password")
            .populate("schoolId", "name city")
            .sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: usuarios.length,
            usuarios,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar usuários:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar usuários",
        });
    }
};

// -------------------------------------------------------------------------
// deletarUsuario — DELETE /api/users/:id
// -------------------------------------------------------------------------
const deletarUsuario = async (req, res) => {
    try {
        const usuario = await User.findByIdAndDelete(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        console.log(`[LUDUS] Usuário removido: ${usuario.email}`);

        return res.json({
            sucesso: true,
            mensagem: "Usuário removido com sucesso!",
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar usuário:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar usuário",
        });
    }
};

// -------------------------------------------------------------------------
// atualizarUsuario — PUT /api/users/:id
// Apenas admin — edita nome, email, role e escola de qualquer usuário
// -------------------------------------------------------------------------
const atualizarUsuario = async (req, res) => {
    try {
        const { name, email, role, schoolId } = req.body;

        const usuario = await User.findByIdAndUpdate(
            req.params.id,
            {
                name,
                email,
                role,
                // Se schoolId vier vazio/null, remove o vínculo
                schoolId: schoolId || null,
            },
            { new: true, runValidators: true },
        ).select("-password");

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        console.log(`[LUDUS] Usuário atualizado: ${usuario.email}`);

        return res.json({
            sucesso: true,
            mensagem: "Usuário atualizado com sucesso!",
            usuario,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar usuário:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar usuário",
        });
    }
};

module.exports = { listarUsuarios, deletarUsuario, atualizarUsuario };
