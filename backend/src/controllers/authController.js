// =============================================================================
// authController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de autenticação — registro, login e perfil do usuário.
// =============================================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registrar = async (req, res) => {
    try {
        const { name, email, password, role, institutionId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, email, password",
            });
        }

        const existente = await User.findOne({ email });
        if (existente) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Email já cadastrado",
            });
        }

        const usuario = new User({
            name,
            email,
            password,
            role,
            institutionId,
        });
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
                institutionId: usuario.institutionId,
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

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: email, password",
            });
        }

        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Email ou senha incorretos",
            });
        }

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
                institutionId: usuario.institutionId,
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

const perfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId)
            .select("-password")
            .populate("institutionId", "name city");

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

const atualizarPerfil = async (req, res) => {
    try {
        const { name, email, senhaAtual, novaSenha } = req.body;

        const usuario = await User.findById(req.usuarioId);

        if (!usuario) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado",
            });
        }

        if (name) usuario.name = name;
        if (email) usuario.email = email;

        if (senhaAtual || novaSenha) {
            if (!senhaAtual || !novaSenha) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Informe a senha atual e a nova senha.",
                });
            }

            const senhaCorreta = await usuario.compararSenha(senhaAtual);
            if (!senhaCorreta) {
                return res.status(401).json({
                    sucesso: false,
                    mensagem: "Senha atual incorreta.",
                });
            }

            usuario.password = novaSenha;
        }

        await usuario.save();

        console.log(`[LUDUS] Perfil atualizado: ${usuario.email}`);

        const itensAlterados = [];
        if (name) itensAlterados.push("nome");
        if (email) itensAlterados.push("email");
        if (novaSenha) itensAlterados.push("senha");

        const listaFormatada = itensAlterados.join(", ");
        const mensagem =
            itensAlterados.length > 0
                ? `${listaFormatada.charAt(0).toUpperCase() + listaFormatada.slice(1)} atualizado(s) com sucesso!`
                : "Nenhuma alteração realizada.";

        return res.json({
            sucesso: true,
            mensagem,
            usuario: {
                id: usuario._id,
                name: usuario.name,
                email: usuario.email,
                role: usuario.role,
                institutionId: usuario.institutionId,
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar perfil:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar perfil",
        });
    }
};

module.exports = { registrar, login, perfil, atualizarPerfil };
