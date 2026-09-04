// =============================================================================
// collectionsController.js
// Administração autenticada das coletas escolares observacionais.
// =============================================================================

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Group = require("../models/Group");
const Game = require("../models/Game");
const Student = require("../models/Student");
const CollectionParticipant = require("../models/CollectionParticipant");
const ObservationCollection = require("../models/ObservationCollection");
const ObservationSubmission = require("../models/ObservationSubmission");
const {
    prepararDadosImportacao,
    buscarSessaoDuplicadaImportada,
    registrarJogoEAssociarAluno,
    salvarSessaoNormalizada,
} = require("./sessionsController");
const {
    ErroValidacaoTelemetria,
} = require("../services/telemetryValidator");
const {
    validarLoteTelemetria,
} = require("../services/batchTelemetryValidator");
const {
    obterContextoEscolar,
    podeAcessarInstituicao,
    buscarAlunoComAcesso,
} = require("../services/schoolAccess");
const {
    calcularHashCodigoColeta,
    codigoColetaTemFormatoValido,
    gerarCredencialColeta,
} = require("../services/collectionCode");
const {
    pareamentoEstaLimitado,
    registrarFalhaPareamento,
} = require("../services/pairingAttemptLimiter");
const {
    normalizarIdentidadeParticipante,
} = require("../services/participantIdentity");

const DURACAO_PADRAO_MINUTOS = 120;
const DURACAO_MINIMA_MINUTOS = 15;
const DURACAO_MAXIMA_MINUTOS = 480;
const LIMITE_ORIGENS = 20;
const DURACAO_MAXIMA_CREDENCIAL_SEGUNDOS = 8 * 60 * 60;

const resumirColeta = (coleta) => ({
    collectionId: coleta.collectionId,
    title: coleta.title,
    institutionId: coleta.institutionId,
    groupId: coleta.groupId,
    status: coleta.status,
    startsAt: coleta.startsAt,
    expiresAt: coleta.expiresAt,
    allowedOrigins: coleta.allowedOrigins,
    gameTargets: coleta.gameTargets,
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

const prepararAlvosDosJogos = async (gameIds, contexto) => {
    if (gameIds === undefined) return [];
    if (!Array.isArray(gameIds) || gameIds.length > 50) {
        const erro = new Error("Selecione no máximo 50 jogos para a coleta.");
        erro.status = 400;
        throw erro;
    }

    const ids = [...new Set(gameIds.map((id) => String(id)))];
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
        const erro = new Error("A seleção contém um jogo inválido.");
        erro.status = 400;
        throw erro;
    }
    if (ids.length === 0) return [];

    const filtro = { _id: { $in: ids }, active: true };
    if (!contexto.todasInstituicoes) {
        const escopos = [`user:${contexto.usuario._id}`];
        escopos.push(
            ...contexto.institutionIds.map((id) => `institution:${id}`),
        );
        filtro.scopeKey = { $in: escopos };
    }

    const jogos = await Game.find(filtro).select(
        "gameId name observationTarget",
    );
    const porId = new Map(jogos.map((jogo) => [String(jogo._id), jogo]));
    if (porId.size !== ids.length) {
        const erro = new Error("Um dos jogos não existe ou não está disponível para esta coleta.");
        erro.status = 400;
        throw erro;
    }

    return ids.map((id) => {
        const jogo = porId.get(id);
        if (!jogo.observationTarget?.entryUrl) {
            const erro = new Error(`O jogo “${jogo.name}” ainda não possui um link preparado.`);
            erro.status = 400;
            throw erro;
        }
        return {
            gameId: jogo.gameId,
            name: jogo.name,
            entryUrl: jogo.observationTarget.entryUrl,
            captureOrigins: jogo.observationTarget.captureOrigins || [],
        };
    });
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

        let gameTargets;
        try {
            gameTargets = await prepararAlvosDosJogos(req.body?.gameIds, contexto);
        } catch (erroValidacao) {
            return res.status(erroValidacao.status || 400).json({
                sucesso: false,
                mensagem: erroValidacao.message,
            });
        }

        const origensDosJogos = gameTargets.flatMap((alvo) => [
            new URL(alvo.entryUrl).origin,
            ...alvo.captureOrigins,
        ]);
        allowedOrigins = [...new Set([...allowedOrigins, ...origensDosJogos])];

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
            gameTargets,
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

const responderCodigoIndisponivel = (res) =>
    res.status(401).json({
        sucesso: false,
        mensagem: "Código inválido, expirado ou indisponível.",
    });

const obterOuCriarParticipante = async (coleta, identidade) => {
    const filtro = {
        collectionRef: coleta._id,
        normalizedName: identidade.normalizedName,
    };
    const existente = await CollectionParticipant.findOne(filtro);
    if (existente) return existente;

    try {
        return await CollectionParticipant.create({
            participantRef: `participant-${crypto.randomUUID()}`,
            collectionRef: coleta._id,
            displayName: identidade.displayName,
            normalizedName: identidade.normalizedName,
            resolutionStatus: "pending",
        });
    } catch (erro) {
        if (erro?.code === 11000) {
            const criadoEmParalelo = await CollectionParticipant.findOne(filtro);
            if (criadoEmParalelo) return criadoEmParalelo;
        }
        throw erro;
    }
};

const parearParticipante = async (req, res) => {
    const codigo = req.body?.code;
    const ip = req.ip;

    try {
        let identidade;
        try {
            identidade = normalizarIdentidadeParticipante(
                req.body?.participantName,
            );
        } catch (erroValidacao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: erroValidacao.message,
            });
        }

        if (pareamentoEstaLimitado(ip, codigo)) {
            return res.status(429).json({
                sucesso: false,
                mensagem:
                    "Muitas tentativas de pareamento. Aguarde alguns minutos.",
            });
        }

        if (
            String(codigo || "").length > 32 ||
            !codigoColetaTemFormatoValido(codigo)
        ) {
            registrarFalhaPareamento(ip, codigo);
            return responderCodigoIndisponivel(res);
        }

        const coleta = await ObservationCollection.findOne({
            pairingCodeHash: calcularHashCodigoColeta(codigo),
        });
        const agora = new Date();
        const coletaDisponivel =
            coleta?.status === "active" &&
            new Date(coleta.startsAt) <= agora &&
            new Date(coleta.expiresAt) > agora;

        if (!coletaDisponivel) {
            registrarFalhaPareamento(ip, codigo);
            return responderCodigoIndisponivel(res);
        }

        const participante = await obterOuCriarParticipante(coleta, identidade);
        const segundosRestantes = Math.floor(
            (new Date(coleta.expiresAt).getTime() - agora.getTime()) / 1000,
        );
        const duracaoCredencial = Math.min(
            DURACAO_MAXIMA_CREDENCIAL_SEGUNDOS,
            segundosRestantes,
        );
        if (duracaoCredencial < 1) {
            return responderCodigoIndisponivel(res);
        }

        const token = jwt.sign(
            {
                tokenType: "observation-upload",
                collectionId: coleta.collectionId,
                participantRef: participante.participantRef,
            },
            process.env.JWT_SECRET,
            {
                audience: "ludus-observa",
                issuer: "ludus-acompanha",
                subject: participante.participantRef,
                expiresIn: duracaoCredencial,
            },
        );

        return res.json({
            sucesso: true,
            mensagem: "Participante vinculado à coleta.",
            participante: {
                participantRef: participante.participantRef,
                displayName: participante.displayName,
                resolutionStatus: participante.resolutionStatus,
            },
            coleta: {
                collectionId: coleta.collectionId,
                title: coleta.title,
                expiresAt: coleta.expiresAt,
                allowedOrigins: coleta.allowedOrigins,
                gameTargets: coleta.gameTargets,
            },
            credencial: {
                token,
                expiresAt: new Date(
                    agora.getTime() + duracaoCredencial * 1000,
                ),
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao parear participante:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao parear participante.",
        });
    }
};

const calcularDigestSessao = (sessao) =>
    crypto.createHash("sha256").update(JSON.stringify(sessao)).digest("hex");

const receberLoteObservacional = async (req, res) => {
    try {
        const lote = validarLoteTelemetria(req.body?.lote);
        const credencial = req.credencialObservacional;
        const agora = new Date();

        const coleta = await ObservationCollection.findOne({
            collectionId: credencial.collectionId,
            status: "active",
            startsAt: { $lte: agora },
            expiresAt: { $gt: agora },
        });
        if (!coleta) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "A coleta não está disponível para recebimento.",
            });
        }

        const participante = await CollectionParticipant.findOne({
            participantRef: credencial.participantRef,
            collectionRef: coleta._id,
        });
        if (!participante) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "O participante não pertence à coleta informada.",
            });
        }
        if (
            lote.collectionRef !== coleta.collectionId ||
            lote.participant.participantRef !== participante.participantRef ||
            lote.participant.displayName !== participante.displayName
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "O lote não corresponde ao pareamento confirmado.",
            });
        }

        const candidatos = lote.sessions.map((sessao) => ({
            sessao,
            digest: calcularDigestSessao(sessao),
        }));
        const existentes = await ObservationSubmission.find({
            collectionRef: coleta._id,
            participantRef: participante._id,
            sessionId: { $in: candidatos.map(({ sessao }) => sessao.sessionId) },
        });
        const porSessao = new Map(
            existentes.map((item) => [item.sessionId, item]),
        );

        const conflito = candidatos.find(({ sessao, digest }) => {
            const existente = porSessao.get(sessao.sessionId);
            return existente && existente.payloadDigest !== digest;
        });
        if (conflito) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Uma sessão com o mesmo identificador já foi recebida com outro conteúdo.",
            });
        }

        const recibos = [];
        let criadas = 0;
        for (const { sessao, digest } of candidatos) {
            let item = porSessao.get(sessao.sessionId);
            let recebimento = "ja-recebida";

            if (!item) {
                try {
                    item = await ObservationSubmission.create({
                        receiptId: `receipt-${crypto.randomUUID()}`,
                        collectionRef: coleta._id,
                        participantRef: participante._id,
                        batchId: lote.batchId,
                        sessionId: sessao.sessionId,
                        payloadDigest: digest,
                        sessionPayload: sessao,
                    });
                    criadas += 1;
                    recebimento = "recebida";
                } catch (erro) {
                    if (erro?.code !== 11000) throw erro;
                    item = await ObservationSubmission.findOne({
                        collectionRef: coleta._id,
                        participantRef: participante._id,
                        sessionId: sessao.sessionId,
                    });
                    if (!item || item.payloadDigest !== digest) {
                        return res.status(409).json({
                            sucesso: false,
                            mensagem:
                                "A sessão entrou em conflito durante o recebimento.",
                        });
                    }
                }
            }

            recibos.push({
                receiptId: item.receiptId,
                sessionId: item.sessionId,
                status: item.status,
                recebimento,
            });
        }

        return res.status(criadas > 0 ? 201 : 200).json({
            sucesso: true,
            mensagem:
                criadas > 0
                    ? "Sessões recebidas para revisão da professora."
                    : "Todas as sessões já haviam sido recebidas.",
            collectionId: coleta.collectionId,
            participantRef: participante.participantRef,
            totalRecebidas: criadas,
            totalJaRecebidas: recibos.length - criadas,
            recibos,
        });
    } catch (erro) {
        if (erro instanceof ErroValidacaoTelemetria) {
            return res.status(400).json({
                sucesso: false,
                mensagem: erro.message,
                detalhes: erro.detalhes,
            });
        }
        console.error("[LUDUS] Erro ao receber lote observacional:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao receber lote observacional.",
        });
    }
};

const listarSubmissoesColeta = async (req, res) => {
    try {
        const coleta = await ObservationCollection.findOne({
            collectionId: req.params.collectionId,
            ownerUserId: req.usuarioId,
        }).select("_id collectionId title");

        if (!coleta) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Coleta não encontrada ou sem permissão de acesso.",
            });
        }

        const [participantes, submissoes] = await Promise.all([
            CollectionParticipant.find({ collectionRef: coleta._id })
                .select(
                    "_id participantRef displayName resolutionStatus studentId",
                )
                .lean(),
            ObservationSubmission.find({ collectionRef: coleta._id })
                .select(
                    "receiptId participantRef sessionId status sessionPayload createdAt",
                )
                .sort({ createdAt: -1 })
                .lean(),
        ]);
        const participantePorId = new Map(
            participantes.map((item) => [String(item._id), item]),
        );
        const alunosResolvidos = await Student.find({
            _id: {
                $in: participantes
                    .map((item) => item.studentId)
                    .filter(Boolean),
            },
        })
            .select("_id name")
            .lean();
        const alunoPorId = new Map(
            alunosResolvidos.map((item) => [String(item._id), item]),
        );
        const grupos = new Map();

        for (const item of submissoes) {
            const participante = participantePorId.get(
                String(item.participantRef),
            );
            if (!participante) continue;

            if (!grupos.has(participante.participantRef)) {
                grupos.set(participante.participantRef, {
                    participantRef: participante.participantRef,
                    displayName: participante.displayName,
                    resolutionStatus: participante.resolutionStatus,
                    resolvedStudent: participante.studentId
                        ? {
                              studentId: String(participante.studentId),
                              name:
                                  alunoPorId.get(String(participante.studentId))
                                      ?.name || "Aluno cadastrado",
                          }
                        : null,
                    totalSessoes: 0,
                    sessoes: [],
                });
            }

            const sessao = item.sessionPayload || {};
            const grupo = grupos.get(participante.participantRef);
            grupo.totalSessoes += 1;
            grupo.sessoes.push({
                receiptId: item.receiptId,
                sessionId: item.sessionId,
                status: item.status,
                gameId: sessao.gameId,
                startedAt: sessao.startedAt,
                endedAt: sessao.endedAt,
                durationMs: sessao.durationMs,
                totalCliques: Array.isArray(sessao.clicks)
                    ? sessao.clicks.length
                    : 0,
                totalPontosMovimento: Array.isArray(sessao.mousePath)
                    ? sessao.mousePath.length
                    : 0,
                totalPontosArraste: Array.isArray(sessao.dragPath)
                    ? sessao.dragPath.length
                    : 0,
                receivedAt: item.createdAt,
            });
        }

        const recebimentos = [...grupos.values()].sort((a, b) =>
            a.displayName.localeCompare(b.displayName, "pt-BR"),
        );

        return res.json({
            sucesso: true,
            coleta: {
                collectionId: coleta.collectionId,
                title: coleta.title,
            },
            totalParticipantes: recebimentos.length,
            totalSessoes: submissoes.length,
            totalPendentes: submissoes.filter((item) => item.status === "pending").length,
            totalImportadas: submissoes.filter((item) => item.status === "imported").length,
            recebimentos,
        });
    } catch (erro) {
        console.error(
            "[LUDUS] Erro ao listar recebimentos da coleta:",
            erro.message,
        );
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar recebimentos da coleta.",
        });
    }
};

const resolverParticipanteColeta = async (req, res) => {
    try {
        const collectionId = req.params.collectionId;
        const participantRef = req.params.participantRef;
        const studentId = req.body?.studentId;
        const criarNovo = req.body?.createNew === true;

        if ((Boolean(studentId) && criarNovo) || (!studentId && !criarNovo)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Escolha um aluno existente ou confirme a criação de um novo.",
            });
        }

        const coleta = await ObservationCollection.findOne({
            collectionId,
            ownerUserId: req.usuarioId,
        });
        if (!coleta) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Coleta não encontrada ou sem permissão de acesso.",
            });
        }

        const participante = await CollectionParticipant.findOne({
            participantRef,
            collectionRef: coleta._id,
        });
        if (!participante) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Participante não encontrado nesta coleta.",
            });
        }

        let aluno;
        let criado = false;
        if (criarNovo) {
            const alunosDaTurma = await Student.find({ groupId: coleta.groupId })
                .select("_id name")
                .lean();
            const equivalente = alunosDaTurma.find(
                (item) =>
                    normalizarIdentidadeParticipante(item.name)
                        .normalizedName === participante.normalizedName,
            );
            if (equivalente) {
                return res.status(409).json({
                    sucesso: false,
                    codigo: "ALUNO_EQUIVALENTE",
                    mensagem:
                        "Já existe um aluno com nome equivalente nesta turma. Selecione o cadastro existente.",
                    alunoSugerido: {
                        studentId: String(equivalente._id),
                        name: equivalente.name,
                    },
                });
            }

            aluno = await Student.create({
                name: participante.displayName,
                groupId: coleta.groupId,
                institutionId: coleta.institutionId,
                ownerUserId: coleta.ownerUserId,
                enrollmentMode: "school",
                deletionProtected: false,
            });
            criado = true;
        } else {
            if (!mongoose.isValidObjectId(studentId)) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Selecione um aluno válido.",
                });
            }
            aluno = await Student.findOne({
                _id: studentId,
                groupId: coleta.groupId,
            });
            if (!aluno) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Aluno não encontrado na turma desta coleta.",
                });
            }
        }

        if (participante.resolutionStatus === "resolved") {
            if (String(participante.studentId) !== String(aluno._id)) {
                if (criado) await Student.deleteOne({ _id: aluno._id });
                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        "Este participante já foi associado a outro aluno.",
                });
            }
        } else {
            participante.studentId = aluno._id;
            participante.resolutionStatus = "resolved";
            await participante.save();
        }

        return res.status(criado ? 201 : 200).json({
            sucesso: true,
            mensagem: criado
                ? "Aluno criado e confirmado para esta coleta."
                : "Aluno existente confirmado para esta coleta.",
            participante: {
                participantRef: participante.participantRef,
                displayName: participante.displayName,
                resolutionStatus: participante.resolutionStatus,
            },
            aluno: {
                studentId: String(aluno._id),
                name: aluno.name,
                criado,
            },
        });
    } catch (erro) {
        console.error(
            "[LUDUS] Erro ao resolver participante da coleta:",
            erro.message,
        );
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao revisar participante da coleta.",
        });
    }
};

// Aprova apenas os recibos exibidos e confirmados pela professora.
// Cada item é retomável: falha após salvar Session não exige apagar dados.
const importarSessoesColeta = async (req, res) => {
    try {
        const ids = req.body?.receiptIds;
        if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100 ||
            ids.some((id) => typeof id !== "string" || id.length > 100) ||
            new Set(ids).size !== ids.length) {
            return res.status(400).json({ sucesso: false, mensagem: "Selecione de 1 a 100 recibos distintos." });
        }
        const coleta = await ObservationCollection.findOne({
            collectionId: req.params.collectionId, ownerUserId: req.usuarioId,
        });
        if (!coleta) return res.status(404).json({ sucesso: false, mensagem: "Coleta não encontrada." });
        const participante = await CollectionParticipant.findOne({
            collectionRef: coleta._id, participantRef: req.params.participantRef,
        });
        if (!participante) return res.status(404).json({ sucesso: false, mensagem: "Participante não encontrado." });
        if (participante.resolutionStatus !== "resolved" || !participante.studentId) {
            return res.status(409).json({ sucesso: false, mensagem: "Confirme o cadastro do aluno antes de adicionar sessões." });
        }
        const aluno = await buscarAlunoComAcesso(req.usuarioId, participante.studentId);
        if (!aluno || String(aluno.groupId) !== String(coleta.groupId)) {
            return res.status(404).json({ sucesso: false, mensagem: "Aluno indisponível na turma desta coleta." });
        }
        const itens = await ObservationSubmission.find({
            collectionRef: coleta._id, participantRef: participante._id, receiptId: { $in: ids },
        });
        if (itens.length !== ids.length || itens.some((item) => item.status === "rejected")) {
            return res.status(400).json({ sucesso: false, mensagem: "Um dos recibos não está disponível para este aluno." });
        }
        // Revalidar todos antes de iniciar qualquer persistência.
        const preparados = itens.map((item) => ({
            item, ...prepararDadosImportacao({ dadosBrutos: item.sessionPayload, aluno }),
        }));
        const resultados = [];
        for (const { item, dados, nomeJogoDetectado } of preparados) {
            try {
                dados.observationReceiptId = item.receiptId;
                let sessao = await buscarSessaoDuplicadaImportada(dados);
                if (sessao && sessao.observationReceiptId !== item.receiptId) {
                    resultados.push({ receiptId: item.receiptId, status: "erro", mensagem: "Já existe uma importação com esse identificador. Revise o histórico; nenhum dado foi sobrescrito." });
                    continue;
                }
                await registrarJogoEAssociarAluno({ usuarioId: req.usuarioId, aluno, dados, nomeJogoDetectado });
                if (!sessao) {
                    try {
                        sessao = await salvarSessaoNormalizada(dados);
                    } catch (erro) {
                        if (erro.code !== 11000 && erro.status !== 409) throw erro;
                        sessao = await buscarSessaoDuplicadaImportada(dados);
                        if (!sessao || sessao.observationReceiptId !== item.receiptId) throw erro;
                    }
                }
                item.status = "imported";
                item.importedSessionId = sessao._id;
                item.reviewedAt = item.reviewedAt || new Date();
                await item.save();
                resultados.push({ receiptId: item.receiptId, status: "imported", sessionId: sessao.sessionId });
            } catch {
                resultados.push({ receiptId: item.receiptId, status: "erro", mensagem: "Não foi possível concluir este item. Tente novamente; os dados foram preservados." });
            }
        }
        const totalErros = resultados.filter((item) => item.status === "erro").length;
        return res.status(totalErros ? 207 : 200).json({
            sucesso: totalErros === 0, totalErros, resultados,
            mensagem: totalErros ? "Algumas sessões continuam pendentes. Confira os itens e tente novamente." : "Sessões adicionadas ao histórico do aluno.",
        });
    } catch (erro) {
        return res.status(erro instanceof ErroValidacaoTelemetria ? 400 : 500).json({
            sucesso: false, mensagem: "Não foi possível validar e importar as sessões. Nenhum recebimento foi descartado.",
        });
    }
};

module.exports = {
    importarSessoesColeta,
    criarColeta,
    listarColetas,
    listarSubmissoesColeta,
    parearParticipante,
    receberLoteObservacional,
    resolverParticipanteColeta,
    revogarColeta,
};
