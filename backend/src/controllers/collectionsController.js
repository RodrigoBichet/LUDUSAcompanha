// =============================================================================
// collectionsController.js
// Administração autenticada das coletas escolares observacionais.
// =============================================================================

const crypto = require("crypto");
const mongoose = require("mongoose");
const Group = require("../models/Group");
const ObservationCollection = require("../models/ObservationCollection");
const {
    obterContextoEscolar,
    podeAcessarInstituicao,
} = require("../services/schoolAccess");
const { gerarCredencialColeta } = require("../services/collectionCode");

const DURACAO_PADRAO_MINUTOS = 120;
const DURACAO_MINIMA_MINUTOS = 15;
const DURACAO_MAXIMA_MINUTOS = 480;
const LIMITE_ORIGENS = 20;

const resumirColeta = (coleta) => ({
    collectionId: coleta.collectionId,
    title: coleta.title,
    institutionId: coleta.institutionId,
    groupId: coleta.groupId,
    status: coleta.status,
    startsAt: coleta.startsAt,
    expiresAt: coleta.expiresAt,
    allowedOrigins: coleta.allowedOrigins,
    closedAt: coleta.closedAt,
    revokedAt: coleta.revokedAt,
    createdAt: coleta.createdAt,
    updatedAt: coleta.updatedAt,
    expirada:
        coleta.status === "active" &&
        new Date(coleta.expiresAt).getTime() <= Date.now(),
});

const normalizarOrigens = (origens) => {
    if (origens === undefined) return [];
    if (!Array.isArray(origens) || origens.length > LIMITE_ORIGENS) {
        throw new Error(`allowedOrigins aceita no máximo ${LIMITE_ORIGENS} origens.`);
    }

    const normalizadas = origens.map((origem) => {
        let url;
        try {
            url = new URL(String(origem));
        } catch {
            throw new Error("allowedOrigins contém uma origem inválida.");
        }
        if (!["http:", "https:"].includes(url.protocol) || url.origin === "null") {
            throw new Error("allowedOrigins aceita somente origens HTTP ou HTTPS.");
        }
        return url.origin;
    });

    return [...new Set(normalizadas)];
};

const criarColeta = async (req, res) => {
    try {
        const title = String(req.body?.title || "").trim();
        const groupId = req.body?.groupId;
        const duracaoMinutos =
            req.body?.durationMinutes ?? DURACAO_PADRAO_MINUTOS;

        if (!title || title.length > 120) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe um título de até 120 caracteres.",
            });
        }
        if (!mongoose.isValidObjectId(groupId)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe uma turma válida.",
            });
        }
        if (
            !Number.isInteger(duracaoMinutos) ||
            duracaoMinutos < DURACAO_MINIMA_MINUTOS ||
            duracaoMinutos > DURACAO_MAXIMA_MINUTOS
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `A validade deve ficar entre ${DURACAO_MINIMA_MINUTOS} e ${DURACAO_MAXIMA_MINUTOS} minutos.`,
            });
        }

        let allowedOrigins;
        try {
            allowedOrigins = normalizarOrigens(req.body?.allowedOrigins);
        } catch (erroValidacao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: erroValidacao.message,
            });
        }

        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }

        const turma = await Group.findById(groupId).select("name institutionId");
        if (
            !turma ||
            !podeAcessarInstituicao(contexto, turma.institutionId)
        ) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Turma não encontrada ou sem permissão de acesso.",
            });
        }

        const agora = new Date();
        const credencial = gerarCredencialColeta();
        const coleta = await ObservationCollection.create({
            collectionId: `collection-${crypto.randomUUID()}`,
            title,
            ownerUserId: req.usuarioId,
            institutionId: turma.institutionId,
            groupId: turma._id,
            status: "active",
            startsAt: agora,
            expiresAt: new Date(
                agora.getTime() + duracaoMinutos * 60 * 1000,
            ),
            pairingCodeHash: credencial.hash,
            allowedOrigins,
        });

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Coleta criada. O código será exibido somente nesta resposta.",
            codigoTemporario: credencial.codigo,
            coleta: resumirColeta(coleta),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar coleta:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar coleta.",
        });
    }
};

const listarColetas = async (req, res) => {
    try {
        const contexto = await obterContextoEscolar(req.usuarioId);
        if (!contexto) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }

        const coletas = await ObservationCollection.find({
            ownerUserId: req.usuarioId,
        }).sort({ createdAt: -1 });

        return res.json({
            sucesso: true,
            total: coletas.length,
            coletas: coletas.map(resumirColeta),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar coletas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar coletas.",
        });
    }
};

const revogarColeta = async (req, res) => {
    try {
        const coleta = await ObservationCollection.findOne({
            collectionId: req.params.collectionId,
            ownerUserId: req.usuarioId,
        });

        if (!coleta) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Coleta não encontrada ou sem permissão de acesso.",
            });
        }
        if (coleta.status === "closed") {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Uma coleta encerrada não pode ser revogada.",
            });
        }
        if (coleta.status !== "revoked") {
            coleta.status = "revoked";
            coleta.revokedAt = new Date();
            await coleta.save();
        }

        return res.json({
            sucesso: true,
            mensagem: "Coleta revogada. O código temporário não poderá ser usado.",
            coleta: resumirColeta(coleta),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao revogar coleta:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao revogar coleta.",
        });
    }
};

module.exports = {
    criarColeta,
    listarColetas,
    revogarColeta,
};
