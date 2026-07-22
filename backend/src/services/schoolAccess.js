// =============================================================================
// schoolAccess.js
// Regras centralizadas de acesso ao contexto escolar.
// =============================================================================

const Institution = require("../models/Institution");
const User = require("../models/User");

const obterContextoEscolar = async (usuarioId) => {
    const usuario = await User.findById(usuarioId).select(
        "role institutionId",
    );
    if (!usuario) return null;

    if (usuario.role === "admin") {
        return { usuario, todasInstituicoes: true, institutionIds: [] };
    }

    const instituicoesProprias = await Institution.find({
        ownerUserId: usuario._id,
    }).select("_id");
    const ids = instituicoesProprias.map((instituicao) =>
        String(instituicao._id),
    );

    // Compatibilidade com o vínculo único usado pelos dados históricos.
    if (usuario.institutionId) ids.push(String(usuario.institutionId));

    return {
        usuario,
        todasInstituicoes: false,
        institutionIds: [...new Set(ids)],
    };
};

const filtroInstituicoesAcessiveis = (contexto) => {
    if (contexto.todasInstituicoes) return {};
    return { _id: { $in: contexto.institutionIds } };
};

const podeAcessarInstituicao = (contexto, institutionId) =>
    contexto.todasInstituicoes ||
    contexto.institutionIds.includes(String(institutionId));

const podeGerenciarInstituicao = (contexto, instituicao) =>
    contexto.todasInstituicoes ||
    (instituicao.ownerUserId &&
        String(instituicao.ownerUserId) === String(contexto.usuario._id));

module.exports = {
    obterContextoEscolar,
    filtroInstituicoesAcessiveis,
    podeAcessarInstituicao,
    podeGerenciarInstituicao,
};
