// =============================================================================
// auth.js (middleware)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Middleware de autenticação JWT.
// Verifica o token em rotas protegidas.
// =============================================================================

const jwt = require("jsonwebtoken");

const autenticar = (req, res, next) => {
    // Pega o token do header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token não fornecido",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token inválido ou expirado",
        });
    }
};

// Middleware que verifica se o usuário é admin
const apenasAdmin = async (req, res, next) => {
    const User = require("../models/User");
    const usuario = await User.findById(req.usuarioId);

    if (!usuario || usuario.role !== "admin") {
        return res.status(403).json({
            sucesso: false,
            mensagem: "Acesso restrito a administradores",
        });
    }

    next();
};

module.exports = { autenticar, apenasAdmin };
