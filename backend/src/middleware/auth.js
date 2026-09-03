// =============================================================================
// auth.js (middleware)
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Middleware de autenticação JWT.
// Verifica o token em rotas protegidas.
// =============================================================================

const jwt = require("jsonwebtoken");

const autenticar = async (req, res, next) => {
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
        if (!decoded.id || decoded.tokenType) {
            throw new Error("Tipo de credencial incompatível com o Dashboard.");
        }
        const User = require("../models/User");
        const usuario = await User.findById(decoded.id).select("+authVersion");
        if (!usuario || Number(decoded.authVersion || 0) !== Number(usuario.authVersion || 0)) {
            throw new Error("Sessão invalidada.");
        }
        req.usuarioId = decoded.id;
        req.usuario = usuario;
        next();
    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token inválido ou expirado",
        });
    }
};

// Credencial restrita emitida após nome+código da coleta. Não concede acesso
// às rotas do Dashboard e serve somente para entregar telemetria observacional.
const autenticarEnvioObservacional = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Credencial observacional não fornecida.",
        });
    }

    try {
        const decoded = jwt.verify(
            authHeader.slice("Bearer ".length),
            process.env.JWT_SECRET,
            {
                audience: "ludus-observa",
                issuer: "ludus-acompanha",
            },
        );
        if (
            decoded.tokenType !== "observation-upload" ||
            typeof decoded.collectionId !== "string" ||
            typeof decoded.participantRef !== "string" ||
            decoded.sub !== decoded.participantRef ||
            decoded.id
        ) {
            throw new Error("Tipo de credencial observacional inválido.");
        }

        req.credencialObservacional = {
            collectionId: decoded.collectionId,
            participantRef: decoded.participantRef,
        };
        return next();
    } catch {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Credencial observacional inválida ou expirada.",
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

module.exports = { autenticar, autenticarEnvioObservacional, apenasAdmin };
