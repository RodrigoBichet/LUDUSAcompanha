// =============================================================================
// studentsController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller dos alunos monitorados.
// =============================================================================

const fs = require("fs");
const path = require("path");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Group = require("../models/Group");
const {
    obterContextoEscolar,
    podeAcessarInstituicao,
} = require("../services/schoolAccess");

const GAME_ID_REGEX = /^[a-z0-9][a-z0-9-]{0,99}$/;
const PASTA_SCREENSHOTS = path.resolve(__dirname, "../../uploads/screenshots");

const removerArquivosDasSessoes = (sessoes) => {
    let totalRemovido = 0;

    for (const sessao of sessoes) {
        for (const screenshot of sessao.screenshots || []) {
            const caminhoPublico = String(screenshot.caminho || "");
            if (!caminhoPublico.startsWith("/uploads/screenshots/")) continue;

            const nomeArquivo = path.basename(caminhoPublico);
            const caminhoArquivo = path.resolve(PASTA_SCREENSHOTS, nomeArquivo);
            if (!caminhoArquivo.startsWith(`${PASTA_SCREENSHOTS}${path.sep}`)) {
                continue;
            }

            try {
                if (fs.existsSync(caminhoArquivo)) {
                    fs.unlinkSync(caminhoArquivo);
                    totalRemovido += 1;
                }
            } catch (erroArquivo) {
                console.warn(
                    `[LUDUS] Não foi possível remover screenshot ${nomeArquivo}:`,
                    erroArquivo.message,
                );
            }
        }
    }

    return totalRemovido;
};

const montarFiltroAcessoAlunos = async (usuarioId) => {
    const contexto = await obterContextoEscolar(usuarioId);
    if (!contexto) return null;
    if (contexto.todasInstituicoes) return {};

    const alternativas = [{ ownerUserId: contexto.usuario._id }];
    if (contexto.institutionIds.length > 0) {
        const turmas = await Group.find({
            institutionId: { $in: contexto.institutionIds },
        }).select("_id");
        if (turmas.length > 0) {
            alternativas.push({ groupId: { $in: turmas.map((turma) => turma._id) } });
        }
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

// -------------------------------------------------------------------------
// listarAlunosPorJogo — GET /api/students/for-game/:gameId
// Para Que Serve? mantém leitura dos alunos escolares legados. Jogos novos
// exibem somente alunos associados explicitamente ao identificador do jogo.
// -------------------------------------------------------------------------

const listarAlunosPorJogo = async (req, res) => {
    try {
        const { gameId } = req.params;
        if (!GAME_ID_REGEX.test(gameId)) {
            return res.status(400).json({ sucesso: false, mensagem: "gameId inválido." });
        }

        const filtroAcesso = await montarFiltroAcessoAlunos(req.usuarioId);
        if (!filtroAcesso) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }

        const filtroJogo =
            gameId === "para-que-serve"
                ? {
                      $or: [
                          { groupId: { $ne: null } },
                          { assignedGameIds: gameId },
                      ],
                  }
                : { assignedGameIds: gameId };
        const alunos = await Student.find({
            $and: [filtroAcesso, filtroJogo],
        })
            .select("name birthDate groupId institutionId ownerUserId enrollmentMode assignedGameIds deletionProtected")
            .sort({ name: 1 });

        return res.json({ sucesso: true, gameId, total: alunos.length, alunos });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar alunos por jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar alunos do jogo.",
        });
    }
};

// -------------------------------------------------------------------------
// listarAlunosIndividuais — GET /api/students/individual
// Lista somente os alunos individuais do usuário autenticado.
// -------------------------------------------------------------------------

const listarAlunosIndividuais = async (req, res) => {
    try {
        const alunos = await Student.find({
            ownerUserId: req.usuarioId,
            groupId: null,
        }).sort({ name: 1 });

        return res.json({ sucesso: true, total: alunos.length, alunos });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar alunos individuais:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar alunos individuais.",
        });
    }
};

// -------------------------------------------------------------------------
// criarAlunoIndividual — POST /api/students/individual
// Cria aluno vinculado ao usuário, sem instituição ou turma.
// -------------------------------------------------------------------------

const criarAlunoIndividual = async (req, res) => {
    try {
        const {
            name,
            birthDate,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
            gameId,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: name.",
            });
        }
        if (!GAME_ID_REGEX.test(gameId || "")) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "gameId válido é obrigatório para aluno individual.",
            });
        }

        const aluno = new Student({
            name: name.trim(),
            birthDate,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
            groupId: null,
            institutionId: null,
            ownerUserId: req.usuarioId,
            enrollmentMode: "individual",
            assignedGameIds: [gameId],
        });
        await aluno.save();

        return res.status(201).json({
            sucesso: true,
            mensagem: "Aluno individual criado com sucesso.",
            aluno,
        });
    } catch (erro) {
        if (erro.name === "ValidationError") {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Dados inválidos para cadastro do aluno.",
            });
        }

        console.error("[LUDUS] Erro ao criar aluno individual:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar aluno individual.",
        });
    }
};

// -------------------------------------------------------------------------
// removerAlunoIndividualDoJogo — DELETE /api/students/individual/:id/games/:gameId
// Remove apenas a associação individual ao jogo. Não apaga perfil ou sessões.
// -------------------------------------------------------------------------

const removerAlunoIndividualDoJogo = async (req, res) => {
    try {
        const { id, gameId } = req.params;
        if (!GAME_ID_REGEX.test(gameId)) {
            return res.status(400).json({ sucesso: false, mensagem: "gameId inválido." });
        }

        const filtroAcesso = await montarFiltroAcessoAlunos(req.usuarioId);
        if (!filtroAcesso) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }

        const aluno = await Student.findOne({
            $and: [
                { _id: id, enrollmentMode: "individual" },
                filtroAcesso,
            ],
        });
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno individual não encontrado ou sem permissão.",
            });
        }

        aluno.assignedGameIds = (aluno.assignedGameIds || []).filter(
            (item) => item !== gameId,
        );
        await aluno.save();

        return res.json({
            sucesso: true,
            mensagem: "Aluno removido deste jogo. O perfil e o histórico foram preservados.",
            aluno,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao remover aluno do jogo:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao remover aluno do jogo.",
        });
    }
};

// -------------------------------------------------------------------------
// criarAluno — POST /api/students
// -------------------------------------------------------------------------

const criarAluno = async (req, res) => {
    try {
        const {
            name,
            birthDate,
            groupId,
            notes,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
        } = req.body;

        if (!name || !groupId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campos obrigatórios: name, groupId",
            });
        }

        const contexto = await obterContextoEscolar(req.usuarioId);
        const turma = await Group.findById(groupId).select("institutionId");
        if (!contexto || !turma || !podeAcessarInstituicao(contexto, turma.institutionId)) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Sem permissão para cadastrar aluno nesta turma.",
            });
        }

        const aluno = new Student({
            name,
            birthDate,
            groupId,
            notes,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
        });
        await aluno.save();

        console.log(`[LUDUS] Aluno criado: ${aluno.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Aluno criado com sucesso!",
            aluno,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao criar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao criar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// listarAlunos — GET /api/students?groupId=xxx
// -------------------------------------------------------------------------

const listarAlunos = async (req, res) => {
    try {
        const { groupId } = req.query;
        const filtroAcesso = await montarFiltroAcessoAlunos(req.usuarioId);
        if (!filtroAcesso) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário autenticado não foi encontrado.",
            });
        }
        const filtro = groupId
            ? { $and: [filtroAcesso, { groupId }] }
            : filtroAcesso;

        const alunos = await Student.find(filtro)
            .populate("groupId", "name")
            .sort({ name: 1 });

        return res.json({
            sucesso: true,
            total: alunos.length,
            alunos,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao listar alunos:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao listar alunos",
        });
    }
};

// -------------------------------------------------------------------------
// buscarAluno — GET /api/students/:id
// -------------------------------------------------------------------------

const buscarAluno = async (req, res) => {
    try {
        const aluno = await buscarAlunoComAcesso(req.usuarioId, req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        await aluno.populate("groupId", "name");

        // Busca sessões vinculadas ao ID do aluno
        const sessoes = await Session.find({ studentId: aluno._id })
            .select("sessionId startedAt durationMs metrics")
            .sort({ startedAt: -1 });

        return res.json({
            sucesso: true,
            aluno,
            totalSessoes: sessoes.length,
            sessoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao buscar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// atualizarAluno — PUT /api/students/:id
// -------------------------------------------------------------------------

const atualizarAluno = async (req, res) => {
    try {
        const {
            name,
            birthDate,
            groupId,
            notes,
            supportLevel,
            otherConditions,
            guardianName,
            guardianContact,
        } = req.body;

        const alunoAtual = await buscarAlunoComAcesso(req.usuarioId, req.params.id);
        if (!alunoAtual) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        if (groupId) {
            const contexto = await obterContextoEscolar(req.usuarioId);
            const turma = await Group.findById(groupId).select("institutionId");
            if (!contexto || !turma || !podeAcessarInstituicao(contexto, turma.institutionId)) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: "Sem permissão para vincular o aluno a esta turma.",
                });
            }
        }

        const aluno = await Student.findByIdAndUpdate(
            req.params.id,
            {
                name,
                birthDate,
                groupId,
                notes,
                supportLevel,
                otherConditions,
                guardianName,
                guardianContact,
            },
            { returnDocument: "after", runValidators: true },
        );

        console.log(`[LUDUS] Aluno atualizado: ${aluno.name}`);

        return res.json({
            sucesso: true,
            mensagem: "Aluno atualizado com sucesso!",
            aluno,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao atualizar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// deletarAluno — DELETE /api/students/:id
// -------------------------------------------------------------------------

const deletarAluno = async (req, res) => {
    try {
        const aluno = await buscarAlunoComAcesso(req.usuarioId, req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        if (aluno.deletionProtected) {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Este aluno está protegido contra exclusão para preservar os dados reais de acompanhamento.",
            });
        }

        const sessoes = await Session.find({ studentId: aluno._id })
            .select("screenshots.caminho")
            .lean();
        await Session.deleteMany({ studentId: aluno._id });
        await Student.findByIdAndDelete(aluno._id);
        const totalImagensRemovidas = removerArquivosDasSessoes(sessoes);

        console.log(
            `[LUDUS] Aluno deletado: ${aluno.name} | Sessões: ${sessoes.length} | Imagens: ${totalImagensRemovidas}`,
        );

        return res.json({
            sucesso: true,
            mensagem: "Aluno, sessões e imagens vinculadas foram removidos permanentemente.",
            totalSessoesRemovidas: sessoes.length,
            totalImagensRemovidas,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar aluno:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar aluno",
        });
    }
};

// -------------------------------------------------------------------------
// adicionarAnotacao — POST /api/students/:id/anotacoes
// -------------------------------------------------------------------------

const adicionarAnotacao = async (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim() === "") {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Campo obrigatório: texto",
            });
        }

        const usuario = await require("../models/User").findById(req.usuarioId);

        const aluno = await buscarAlunoComAcesso(req.usuarioId, req.params.id);
        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        aluno.anotacoes.push({
            texto: texto.trim(),
            autorId: req.usuarioId,
            autorNome: usuario.name,
        });

        await aluno.save();

        console.log(`[LUDUS] Anotação adicionada para: ${aluno.name}`);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Anotação adicionada com sucesso!",
            anotacoes: aluno.anotacoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao adicionar anotação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao adicionar anotação",
        });
    }
};

// -------------------------------------------------------------------------
// deletarAnotacao — DELETE /api/students/:id/anotacoes/:anotacaoId
// -------------------------------------------------------------------------

const deletarAnotacao = async (req, res) => {
    try {
        const aluno = await buscarAlunoComAcesso(req.usuarioId, req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        aluno.anotacoes = aluno.anotacoes.filter(
            (a) => a._id.toString() !== req.params.anotacaoId,
        );

        await aluno.save();

        return res.json({
            sucesso: true,
            mensagem: "Anotação removida com sucesso!",
            anotacoes: aluno.anotacoes,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao deletar anotação:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao deletar anotação",
        });
    }
};

// -------------------------------------------------------------------------
// solicitarCaptura — PATCH /api/students/:id/solicitar-captura
//
// Ativa ou desativa a solicitação de captura de screenshots para um aluno.
// Quando ativo, o SDK Unity detecta o flag ao carregar o aluno na tela de
// identificação e ativa o toggle de captura automaticamente.
// O flag é resetado automaticamente pelo backend ao receber uma sessão
// que já contém screenshots (sessionsController.js).
//
// Body: { "ativo": true }  → solicita captura
//       { "ativo": false } → cancela solicitação
// -------------------------------------------------------------------------

const solicitarCaptura = async (req, res) => {
    try {
        const ativo = req.body.ativo !== false;
        const aluno = await buscarAlunoComAcesso(req.usuarioId, req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        if (
            aluno.capturaSolicitada &&
            aluno.capturaSolicitadaOrigem === "unity"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "A captura de imagens já foi ativada pelo jogo. Aguarde a próxima sessão ser registrada ou desative pelo jogo.",
                capturaSolicitada: aluno.capturaSolicitada,
                capturaSolicitadaOrigem: aluno.capturaSolicitadaOrigem,
            });
        }

        aluno.capturaSolicitada = ativo;
        aluno.capturaSolicitadaOrigem = ativo ? "dashboard" : null;
        await aluno.save();

        const acao = ativo ? "solicitada" : "cancelada";
        console.log(
            `[LUDUS] Captura de screenshots ${acao} pelo dashboard para: ${aluno.name}`,
        );

        return res.json({
            sucesso: true,
            mensagem: `Captura de screenshots ${acao} com sucesso!`,
            capturaSolicitada: aluno.capturaSolicitada,
            capturaSolicitadaOrigem: aluno.capturaSolicitadaOrigem,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao solicitar captura:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao solicitar captura",
        });
    }
};

module.exports = {
    listarAlunosPorJogo,
    listarAlunosIndividuais,
    criarAlunoIndividual,
    removerAlunoIndividualDoJogo,
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    deletarAluno,
    adicionarAnotacao,
    deletarAnotacao,
    solicitarCaptura,
};
