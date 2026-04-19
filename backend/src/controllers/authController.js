// =============================================================================
// authController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de autenticação — registro, login e perfil do usuário.
// =============================================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Gera token JWT com o ID do usuário
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// -------------------------------------------------------------------------
// registrar — POST /api/auth/register
// -------------------------------------------------------------------------

const registrar = async (req, res) => {
    try {
        const { name, email, password, role, schoolId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, email, password",
            });
        }

        // Verifica se email já existe
        const existente = await User.findOne({ email });
        if (existente) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Email já cadastrado",
            });
        }

        const usuario = new User({ name, email, password, role, schoolId });
        await usuario.save();

        console.log(
            `[LUDUS] Usuário criado: ${usuario.email} (${usuario.role})`,
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Usuário criado com sucesso!",
            token: gerarToken(usuario._id),
            usuario: {
                id: usuario._id,
                name: usuario.name,
                email: usuario.email,
                role: usuario.role,
                schoolId: usuario.schoolId,
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao registrar:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao registrar usuário",
        });
    }
};

// -------------------------------------------------------------------------
// login — POST /api/auth/login
// -------------------------------------------------------------------------

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: email, password",
            });
        }

        // Busca o usuário pelo email
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos",
            });
        }

        // Verifica a senha
        const senhaCorreta = await usuario.compararSenha(password);
        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos",
            });
        }

        console.log(`[LUDUS] Login: ${usuario.email} (${usuario.role})`);

        return res.json({
            sucesso: true,
            token: gerarToken(usuario._id),
            usuario: {
                id: usuario._id,
                name: usuario.name,
                email: usuario.email,
                role: usuario.role,
                schoolId: usuario.schoolId,
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao fazer login:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao fazer login",
        });
    }
};

// -------------------------------------------------------------------------
// perfil — GET /api/auth/me
// Retorna dados do usuário logado (requer token)
// -------------------------------------------------------------------------

const perfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId)
            .select("-password")
            .populate("schoolId", "name city");

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        return res.json({ sucesso: true, usuario });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar perfil:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar perfil",
        });
    }
};

module.exports = { registrar, login, perfil };
