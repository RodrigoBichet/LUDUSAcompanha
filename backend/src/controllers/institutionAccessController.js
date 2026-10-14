// =============================================================================
// institutionAccessController.js
// Convites e permissões para colaboração entre integrantes.
// =============================================================================

const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const InstitutionAccess = require("../models/InstitutionAccess");
const User = require("../models/User");
const { obterContextoEscolar } = require("../services/schoolAccess");

const popularAcesso = (consulta) =>
    consulta
        .populate("institutionId", "name city environmentType")
        .populate("developerUserId", "name email role")
        .populate("invitedByUserId", "name email role");

const normalizarPermissoes = (valor = {}) => {
    const gerenciarEstrutura = valor.gerenciarEstrutura === true;
    return {
        gerenciarEstrutura,
        prepararColetas: valor.prepararColetas !== false,
        // Gerenciar alunos pressupõe consultar os respectivos registros.
        visualizarResultados:
            gerenciarEstrutura || valor.visualizarResultados === true,
    };
};

const possuiAlgumaPermissao = (permissions) =>
    permissions.gerenciarEstrutura ||
    permissions.prepararColetas ||
    permissions.visualizarResultados;

const serializarAcesso = (acesso) => ({
    _id: acesso._id,
    institution: acesso.institutionId,
    collaborator: acesso.developerUserId,
    invitedBy: acesso.invitedByUserId,
    status: acesso.status,
    permissions: acesso.permissions,
    respondedAt: acesso.respondedAt,
    revokedAt: acesso.revokedAt,
    createdAt: acesso.createdAt,
    updatedAt: acesso.updatedAt,
});

const idsInstituicoesCompartilhaveis = async (req) => {
    const contexto = await obterContextoEscolar(req.usuarioId);
    if (!contexto) return null;
    if (contexto.usuario.role === "admin") {
        const instituicoes = await Institution.find({
            environmentType: { $ne: "sandbox" },
        }).select("_id");
        return instituicoes.map((item) => String(item._id));
    }
    if (contexto.usuario.role !== "professor") return [];
    return contexto.managedInstitutionIds;
};

const podeCompartilhar = async (req, institutionId) => {
    const ids = await idsInstituicoesCompartilhaveis(req);
    return ids?.includes(String(institutionId)) || false;
};

const listarAcessos = async (req, res) => {
    try {
        const ids = await idsInstituicoesCompartilhaveis(req);
        if (!ids) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }
        const alternativas = [{ developerUserId: req.usuarioId }];
        if (ids.length > 0) alternativas.push({ institutionId: { $in: ids } });
        const filtro = { $or: alternativas };

        const [acessos, instituicoesGerenciadas] = await Promise.all([
            popularAcesso(InstitutionAccess.find(filtro).sort({ updatedAt: -1 })),
            Institution.find({ _id: { $in: ids } })
                .select("name city environmentType")
                .sort({ name: 1 }),
        ]);
        return res.json({
            sucesso: true,
            total: acessos.length,
            acessos: acessos.map(serializarAcesso),
            instituicoesGerenciadas,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar acessos institucionais:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar colaborações.",
        });
    }
};

const convidarColaborador = async (req, res) => {
    try {
        if (!["professor", "admin"].includes(req.usuario.role)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Somente responsáveis institucionais podem enviar convites.",
            });
        }

        const institutionId = req.body?.institutionId;
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!mongoose.isValidObjectId(institutionId) || !email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe uma instituição e o e-mail do colaborador.",
            });
        }
        if (!(await podeCompartilhar(req, institutionId))) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Instituição não encontrada ou sem permissão para compartilhar.",
            });
        }

        const instituicao = await Institution.findOne({
            _id: institutionId,
            environmentType: { $ne: "sandbox" },
        });
        if (!instituicao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O laboratório de testes não pode ser compartilhado.",
            });
        }

        const colaborador = await User.findOne({ email }).select(
            "name email role institutionId",
        );
        if (!colaborador || !["professor", "developer"].includes(colaborador.role)) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Nenhuma conta elegível para colaboração foi encontrada com esse e-mail.",
            });
        }
        if (String(colaborador._id) === String(req.usuarioId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Você já possui acesso com esta conta.",
            });
        }
        if (
            String(instituicao.ownerUserId || "") === String(colaborador._id) ||
            String(colaborador.institutionId || "") === String(institutionId)
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Esta pessoa já possui vínculo direto com a instituição.",
            });
        }

        const permissions = normalizarPermissoes(req.body?.permissions);
        if (!possuiAlgumaPermissao(permissions)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Selecione ao menos uma permissão para o convite.",
            });
        }

        let acesso = await InstitutionAccess.findOne({
            institutionId,
            developerUserId: colaborador._id,
        });
        const criado = !acesso;
        if (!acesso) {
            acesso = new InstitutionAccess({
                institutionId,
                developerUserId: colaborador._id,
                invitedByUserId: req.usuarioId,
            });
        } else if (acesso.status === "active") {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Este colaborador já possui acesso ativo à instituição.",
            });
        }

        acesso.invitedByUserId = req.usuarioId;
        acesso.permissions = permissions;
        acesso.status = "pending";
        acesso.respondedAt = null;
        acesso.revokedAt = null;
        await acesso.save();
        acesso = await popularAcesso(InstitutionAccess.findById(acesso._id));

        return res.status(criado ? 201 : 200).json({
            sucesso: true,
            mensagem: "Convite enviado ao colaborador.",
            acesso: serializarAcesso(acesso),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao convidar colaborador:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao enviar convite.",
        });
    }
};

const responderConvite = async (req, res) => {
    try {
        const resposta = req.body?.response;
        if (!["accept", "decline"].includes(resposta)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Resposta inválida. Use accept ou decline.",
            });
        }

        let acesso = await InstitutionAccess.findOne({
            _id: req.params.id,
            developerUserId: req.usuarioId,
            status: "pending",
        });
        if (!acesso) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Convite pendente não encontrado.",
            });
        }

        acesso.status = resposta === "accept" ? "active" : "declined";
        acesso.respondedAt = new Date();
        acesso.revokedAt = null;
        await acesso.save();
        acesso = await popularAcesso(InstitutionAccess.findById(acesso._id));

        return res.json({
            sucesso: true,
            mensagem: resposta === "accept" ? "Convite aceito." : "Convite recusado.",
            acesso: serializarAcesso(acesso),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao responder convite:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao responder convite.",
        });
    }
};

const atualizarPermissoes = async (req, res) => {
    try {
        let acesso = await InstitutionAccess.findById(req.params.id);
        if (!acesso || !(await podeCompartilhar(req, acesso.institutionId))) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Colaboração não encontrada ou sem permissão.",
            });
        }
        if (!["pending", "active"].includes(acesso.status)) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Somente convites pendentes ou ativos podem ser atualizados.",
            });
        }

        const permissions = normalizarPermissoes(req.body?.permissions);
        if (!possuiAlgumaPermissao(permissions)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Selecione ao menos uma permissão.",
            });
        }
        acesso.permissions = permissions;
        await acesso.save();
        acesso = await popularAcesso(InstitutionAccess.findById(acesso._id));
        return res.json({
            sucesso: true,
            mensagem: "Permissões atualizadas.",
            acesso: serializarAcesso(acesso),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar permissões:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar permissões.",
        });
    }
};

const revogarAcesso = async (req, res) => {
    try {
        let acesso = await InstitutionAccess.findById(req.params.id);
        if (!acesso || !(await podeCompartilhar(req, acesso.institutionId))) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Colaboração não encontrada ou sem permissão.",
            });
        }
        acesso.status = "revoked";
        acesso.revokedAt = acesso.revokedAt || new Date();
        await acesso.save();
        acesso = await popularAcesso(InstitutionAccess.findById(acesso._id));
        return res.json({
            sucesso: true,
            mensagem: "Acesso revogado.",
            acesso: serializarAcesso(acesso),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao revogar acesso:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao revogar acesso.",
        });
    }
};

module.exports = {
    listarAcessos,
    convidarColaborador,
    responderConvite,
    atualizarPermissoes,
    revogarAcesso,
};
