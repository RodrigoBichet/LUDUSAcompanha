// =============================================================================
// gamesController.js
// Cadastro e consulta de jogos no escopo autorizado do usuário.
// =============================================================================

const mongoose = require("mongoose");
const Game = require("../models/Game");
const User = require("../models/User");
const Institution = require("../models/Institution");

const obterUsuario = async (usuarioId) =>
    User.findById(usuarioId).select("role institutionId");

const escoposVisiveis = (usuario) => {
    if (usuario.role === "admin") return null;

    const escopos = [`user:${usuario._id}`];
    if (usuario.institutionId) {
        escopos.push(`institution:${usuario.institutionId}`);
    }
    return escopos;
};

const responderUsuarioInvalido = (res) =>
    res.status(401).json({
        sucesso: false,
        mensagem: "Usuário autenticado não foi encontrado.",
    });

const criarBaseGameId = (nome) =>
    String(nome || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);

const GAME_ID_REGEX = /^[a-z0-9][a-z0-9-]{0,99}$/;

const buscarJogoGerenciavel = async (usuario, jogoId) => {
    if (!mongoose.isValidObjectId(jogoId)) return null;

    const jogo = await Game.findById(jogoId);
    if (!jogo) return null;

    const podeGerenciar =
        usuario.role === "admin" ||
        String(jogo.ownerUserId) === String(usuario._id);

    return podeGerenciar ? jogo : null;
};

const gerarGameIdDisponivel = async (nome, scopeKey) => {
    const base = criarBaseGameId(nome);
    if (!base) {
        const erro = new Error(
            "O nome do jogo precisa conter letras ou números.",
        );
        erro.status = 400;
        throw erro;
    }

    for (let sufixo = 1; sufixo <= 1000; sufixo += 1) {
        const complemento = sufixo === 1 ? "" : `-${sufixo}`;
        const gameId = `${base.slice(0, 100 - complemento.length)}${complemento}`;
        const existente = await Game.exists({ scopeKey, gameId });
        if (!existente) return gameId;
    }

    const erro = new Error("Não foi possível gerar um identificador para o jogo.");
    erro.status = 409;
    throw erro;
};

// -------------------------------------------------------------------------
// listarJogos — GET /api/games
// -------------------------------------------------------------------------

const listarJogos = async (req, res) => {
    try {
        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const escopos = escoposVisiveis(usuario);
        const filtro = escopos ? { scopeKey: { $in: escopos } } : {};
        const jogos = await Game.find(filtro)
            .select(
                "gameId name description defaultVersion sourceType active scopeType institutionId createdAt updatedAt",
            )
            .sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: jogos.length,
            jogos,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar jogos:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar jogos.",
        });
    }
};

// -------------------------------------------------------------------------
// criarJogo — POST /api/games
// -------------------------------------------------------------------------

const criarJogo = async (req, res) => {
    try {
        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const {
            name,
            description,
            defaultVersion,
            sourceType,
            scopeType,
            institutionId: institutionIdSolicitada,
        } = req.body;

        if (!name || !scopeType) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, scopeType.",
            });
        }

        let institutionId = null;
        if (scopeType === "institutional") {
            if (usuario.role === "professor") {
                institutionId = usuario.institutionId;
            } else if (institutionIdSolicitada) {
                institutionId = institutionIdSolicitada;
            }

            if (!institutionId || !mongoose.isValidObjectId(institutionId)) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        "Jogo institucional exige uma institutionId válida.",
                });
            }

            const instituicao = await Institution.exists({ _id: institutionId });
            if (!instituicao) {
                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Instituição informada não foi encontrada.",
                });
            }
        }

        if (scopeType !== "personal" && scopeType !== "institutional") {
            return res.status(400).json({
                sucesso: false,
                mensagem: "scopeType deve ser personal ou institutional.",
            });
        }

        const scopeKey =
            scopeType === "personal"
                ? `user:${usuario._id}`
                : `institution:${institutionId}`;
        const gameId = await gerarGameIdDisponivel(name, scopeKey);

        const jogo = new Game({
            gameId,
            name,
            description,
            defaultVersion,
            sourceType,
            scopeType,
            ownerUserId: usuario._id,
            institutionId,
        });
        await jogo.save();

        return res.status(201).json({
            sucesso: true,
            mensagem: "Jogo cadastrado com sucesso.",
            jogo,
        });
    } catch (erro) {
        if (erro?.code === 11000) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Já existe um jogo com este gameId neste escopo.",
            });
        }

        if (erro.status) {
            return res.status(erro.status).json({
                sucesso: false,
                mensagem: erro.message,
            });
        }

        if (erro instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Dados inválidos para cadastro do jogo.",
                detalhes: Object.values(erro.errors).map((item) => item.message),
            });
        }

        console.error("[LUDUS] Erro ao criar jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao cadastrar jogo.",
        });
    }
};

// -------------------------------------------------------------------------
// criarJogoDetectado — POST /api/games/detected
// Confirma um jogo identificado no JSON, preservando o gameId da fonte.
// -------------------------------------------------------------------------

const criarJogoDetectado = async (req, res) => {
    try {
        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const { name, gameId } = req.body;
        if (!name || !String(name).trim() || !GAME_ID_REGEX.test(gameId || "")) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Nome e identificador válido do jogo detectado são obrigatórios.",
            });
        }

        const scopeKey = `user:${usuario._id}`;
        const existente = await Game.findOne({ scopeKey, gameId });
        if (existente) {
            return res.json({
                sucesso: true,
                mensagem: "O jogo detectado já estava cadastrado.",
                criado: false,
                jogo: existente,
            });
        }

        const jogo = new Game({
            gameId,
            name: String(name).trim(),
            sourceType: "external-json",
            scopeType: "personal",
            ownerUserId: usuario._id,
        });
        await jogo.save();

        return res.status(201).json({
            sucesso: true,
            mensagem: "Jogo detectado cadastrado com sucesso.",
            criado: true,
            jogo,
        });
    } catch (erro) {
        if (erro?.code === 11000) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Já existe um jogo com esse identificador no seu catálogo.",
            });
        }

        if (erro instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Dados inválidos para cadastro do jogo detectado.",
            });
        }

        console.error("[LUDUS] Erro ao cadastrar jogo detectado:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao cadastrar jogo detectado.",
        });
    }
};

// -------------------------------------------------------------------------
// atualizarJogo — PATCH /api/games/:id
// O gameId é estável porque sessões históricas o utilizam como vínculo.
// -------------------------------------------------------------------------

const atualizarJogo = async (req, res) => {
    try {
        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const jogo = await buscarJogoGerenciavel(usuario, req.params.id);
        if (!jogo) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Jogo não encontrado ou sem permissão para alterá-lo.",
            });
        }

        const camposPermitidos = [
            "name",
            "description",
            "defaultVersion",
            "sourceType",
            "active",
        ];
        for (const campo of camposPermitidos) {
            if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
                jogo[campo] = req.body[campo];
            }
        }

        await jogo.save();
        return res.json({
            sucesso: true,
            mensagem: "Jogo atualizado com sucesso.",
            jogo,
        });
    } catch (erro) {
        if (erro instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Dados inválidos para atualização do jogo.",
            });
        }

        console.error("[LUDUS] Erro ao atualizar jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar jogo.",
        });
    }
};

// -------------------------------------------------------------------------
// arquivarJogo — DELETE /api/games/:id
// Exclusão física é evitada para preservar vínculos com sessões e alunos.
// -------------------------------------------------------------------------

const arquivarJogo = async (req, res) => {
    try {
        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const jogo = await buscarJogoGerenciavel(usuario, req.params.id);
        if (!jogo) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Jogo não encontrado ou sem permissão para arquivá-lo.",
            });
        }

        jogo.active = false;
        await jogo.save();

        return res.json({
            sucesso: true,
            mensagem: "Jogo arquivado. Sessões e alunos foram preservados.",
            jogo,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao arquivar jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao arquivar jogo.",
        });
    }
};

// -------------------------------------------------------------------------
// buscarJogo — GET /api/games/:id
// -------------------------------------------------------------------------

const buscarJogo = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Identificador de jogo inválido.",
            });
        }

        const usuario = await obterUsuario(req.usuarioId);
        if (!usuario) return responderUsuarioInvalido(res);

        const escopos = escoposVisiveis(usuario);
        const filtro = { _id: req.params.id };
        if (escopos) filtro.scopeKey = { $in: escopos };

        const jogo = await Game.findOne(filtro).select("-scopeKey -ownerUserId");
        if (!jogo) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Jogo não encontrado ou não autorizado.",
            });
        }

        return res.json({ sucesso: true, jogo });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar jogo.",
        });
    }
};

module.exports = {
    listarJogos,
    criarJogo,
    criarJogoDetectado,
    atualizarJogo,
    arquivarJogo,
    buscarJogo,
};
