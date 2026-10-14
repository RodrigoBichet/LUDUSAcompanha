// =============================================================================
// schoolAccess.js
// Regras centralizadas de acesso ao contexto escolar.
// =============================================================================

const Institution = require("../models/Institution");
const InstitutionAccess = require("../models/InstitutionAccess");
const User = require("../models/User");
const Student = require("../models/Student");
const Group = require("../models/Group");

const obterContextoEscolar = async (usuarioId) => {
    const usuario = await User.findById(usuarioId).select(
        "role institutionId",
    );
    if (!usuario) return null;

    const filtroInstituicoes = usuario.role === "admin"
        ? { environmentType: { $ne: "sandbox" } }
        : usuario.role === "developer"
            ? { ownerUserId: usuario._id, environmentType: "sandbox" }
            : {
                ownerUserId: usuario._id,
                environmentType: { $ne: "sandbox" },
            };
    const instituicoesProprias = await Institution.find(
        filtroInstituicoes,
    ).select("_id");
    const idsProprios = instituicoesProprias.map((instituicao) =>
        String(instituicao._id),
    );

    // Compatibilidade com o vínculo único usado pelos dados históricos.
    if (usuario.role === "professor" && usuario.institutionId) {
        const instituicaoVinculada = await Institution.findOne({
            _id: usuario.institutionId,
            environmentType: { $ne: "sandbox" },
        }).select("_id");
        if (instituicaoVinculada) {
            idsProprios.push(String(instituicaoVinculada._id));
        }
    }

    const acessosCompartilhados = usuario.role !== "admin"
        ? await InstitutionAccess.find({
            developerUserId: usuario._id,
            status: "active",
        }).select("institutionId permissions")
        : [];
    const idsCompartilhados = acessosCompartilhados.map((acesso) =>
        String(acesso.institutionId),
    );
    const idsColetasCompartilhadas = acessosCompartilhados
        .filter((acesso) => acesso.permissions?.prepararColetas)
        .map((acesso) => String(acesso.institutionId));
    const idsEstruturaCompartilhada = acessosCompartilhados
        .filter((acesso) => acesso.permissions?.gerenciarEstrutura)
        .map((acesso) => String(acesso.institutionId));
    const idsResultadosCompartilhados = acessosCompartilhados
        .filter((acesso) => acesso.permissions?.visualizarResultados)
        .map((acesso) => String(acesso.institutionId));
    const ids = [...new Set([...idsProprios, ...idsCompartilhados])];
    const idsGerenciados = [...new Set(idsProprios)];
    const idsEstrutura = usuario.role === "admin"
        ? ids
        : [...new Set([...idsProprios, ...idsEstruturaCompartilhada])];
    const idsColetas = usuario.role === "admin"
        ? ids
        : [...new Set([...idsProprios, ...idsColetasCompartilhadas])];
    const idsResultados = usuario.role === "admin"
        ? ids
        : [...new Set([...idsProprios, ...idsResultadosCompartilhados])];

    return {
        usuario,
        todasInstituicoes: usuario.role === "admin",
        somenteSandbox: usuario.role === "developer",
        institutionIds: ids,
        managedInstitutionIds: idsGerenciados,
        structureInstitutionIds: idsEstrutura,
        collectionInstitutionIds: idsColetas,
        resultInstitutionIds: idsResultados,
        sharedInstitutionIds: [...new Set(idsCompartilhados)],
    };
};

const filtroInstituicoesAcessiveis = (contexto) => ({
    _id: { $in: contexto.institutionIds },
});

const podeAcessarInstituicao = (contexto, institutionId) =>
    contexto.institutionIds.includes(String(institutionId));

const podeGerenciarEstruturaInstituicao = (contexto, institutionId) =>
    contexto.todasInstituicoes ||
    contexto.structureInstitutionIds.includes(String(institutionId));

const podeGerenciarColetas = (contexto, institutionId) =>
    contexto.todasInstituicoes ||
    contexto.collectionInstitutionIds.includes(String(institutionId));

const podeAcessarResultados = (contexto, institutionId) =>
    contexto.todasInstituicoes ||
    contexto.resultInstitutionIds.includes(String(institutionId));

const podeGerenciarInstituicao = (contexto, instituicao) =>
    contexto.todasInstituicoes ||
    (podeAcessarInstituicao(contexto, instituicao._id) &&
        instituicao.ownerUserId &&
        String(instituicao.ownerUserId) === String(contexto.usuario._id));

const montarFiltroAcessoAlunos = async (usuarioId) => {
    const contexto = await obterContextoEscolar(usuarioId);
    if (!contexto) return null;
    const alternativas = [];
    if (!contexto.somenteSandbox && !contexto.todasInstituicoes) {
        alternativas.push({ ownerUserId: contexto.usuario._id });
    }
    if (contexto.resultInstitutionIds.length > 0) {
        const turmas = await Group.find({
            institutionId: { $in: contexto.resultInstitutionIds },
        }).select("_id");

        if (turmas.length > 0) {
            alternativas.push({
                groupId: { $in: turmas.map((turma) => turma._id) },
            });
        }
    }

    if (contexto.todasInstituicoes) {
        alternativas.push({ groupId: null });
    }

    if (alternativas.length === 0) {
        return { _id: { $in: [] } };
    }

    return { $or: alternativas };
};

const buscarAlunoComAcesso = async (usuarioId, alunoId) => {
    const filtroAcesso = await montarFiltroAcessoAlunos(usuarioId);
    if (!filtroAcesso) return null;

    return Student.findOne({
        $and: [{ _id: alunoId }, filtroAcesso],
    });
};

const podeGerenciarAluno = async (usuarioId, aluno) => {
    const contexto = await obterContextoEscolar(usuarioId);
    if (!contexto || !aluno) return false;
    if (contexto.todasInstituicoes) return true;
    if (
        aluno.ownerUserId &&
        String(aluno.ownerUserId) === String(contexto.usuario._id)
    ) {
        return true;
    }
    if (!aluno.groupId) return false;
    const turma = await Group.findById(aluno.groupId).select("institutionId");
    return Boolean(
        turma &&
        podeGerenciarEstruturaInstituicao(contexto, turma.institutionId),
    );
};

module.exports = {
    obterContextoEscolar,
    filtroInstituicoesAcessiveis,
    podeAcessarInstituicao,
    podeGerenciarEstruturaInstituicao,
    podeGerenciarColetas,
    podeAcessarResultados,
    podeGerenciarInstituicao,
    montarFiltroAcessoAlunos,
    buscarAlunoComAcesso,
    podeGerenciarAluno,
};
