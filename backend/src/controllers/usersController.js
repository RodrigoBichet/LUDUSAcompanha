// =============================================================================
// usersController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de usuários — listagem, atualização e remoção. Apenas admin.
// =============================================================================

const User = require("../models/User");
const Institution = require("../models/Institution");

const papeisValidos = new Set(["admin", "professor"]);
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizarEmail = (email) => String(email || "").trim().toLowerCase();

const validarInstituicao = async (institutionId) => {
    if (!institutionId) return null;
    if (!require("mongoose").isValidObjectId(institutionId)) return false;
    return Institution.exists({ _id: institutionId });
};

const criarUsuario = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = normalizarEmail(req.body.email);
        const password = req.body.password;
        const role = req.body.role || "professor";
        const institutionId = req.body.institutionId || null;

        if (!name || !emailValido(email) || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe nome, email válido e senha com pelo menos 8 caracteres." });
        }
        if (!papeisValidos.has(role)) {
            return res.status(400).json({ sucesso: false, mensagem: "Papel de usuário inválido." });
        }
        if (institutionId && !(await validarInstituicao(institutionId))) {
            return res.status(400).json({ sucesso: false, mensagem: "Instituição informada não existe." });
        }
        if (await User.exists({ email })) {
            return res.status(409).json({ sucesso: false, mensagem: "Email já cadastrado." });
        }

        const usuario = await User.create({
            name,
            email,
            password,
            role,
            institutionId,
            emailVerifiedAt: new Date(),
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: "Usuário cadastrado com sucesso!",
            usuario: {
                _id: usuario._id,
                name: usuario.name,
                email: usuario.email,
                role: usuario.role,
                institutionId: usuario.institutionId,
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar usuário:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao criar usuário." });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find()
            .select("-password")
            .populate("institutionId", "name city")
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

const deletarUsuario = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.usuarioId)) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Você não pode remover a própria conta administrativa.",
            });
        }

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

const atualizarUsuario = async (req, res) => {
    try {
        const { name, email, role, institutionId } = req.body;
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        const nomeNormalizado = String(name || "").trim();
        const emailNormalizado = normalizarEmail(email);
        if (!nomeNormalizado || !emailValido(emailNormalizado) || !papeisValidos.has(role)) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe nome, email e papel válidos." });
        }
        if (String(req.params.id) === String(req.usuarioId) && role !== "admin") {
            return res.status(409).json({ sucesso: false, mensagem: "Você não pode remover o próprio papel administrativo." });
        }
        if (institutionId && !(await validarInstituicao(institutionId))) {
            return res.status(400).json({ sucesso: false, mensagem: "Instituição informada não existe." });
        }
        const emailEmUso = await User.exists({ email: emailNormalizado, _id: { $ne: usuario._id } });
        if (emailEmUso) {
            return res.status(409).json({ sucesso: false, mensagem: "Email já cadastrado." });
        }

        usuario.name = nomeNormalizado;
        usuario.email = emailNormalizado;
        usuario.role = role;
        usuario.institutionId = institutionId || null;
        if (institutionId) usuario.institutionRequest = undefined;
        await usuario.save();

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

const recusarSolicitacaoInstituicao = async (req, res) => {
    try {
        const motivo = String(req.body.reason || "").trim();
        if (motivo.length < 10 || motivo.length > 500) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe um motivo entre 10 e 500 caracteres.",
            });
        }

        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado" });
        }
        if (usuario.role !== "professor" || usuario.institutionId || !usuario.institutionRequest) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Este usuário não possui uma solicitação institucional pendente.",
            });
        }

        usuario.institutionRequest.status = "rejected";
        usuario.institutionRequest.rejectionReason = motivo;
        usuario.institutionRequest.reviewedAt = new Date();
        await usuario.save();

        return res.json({
            sucesso: true,
            mensagem: "Solicitação devolvida para correção.",
            usuario,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao recusar solicitação institucional:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao revisar solicitação." });
    }
};

module.exports = { criarUsuario, listarUsuarios, deletarUsuario, atualizarUsuario, recusarSolicitacaoInstituicao };
