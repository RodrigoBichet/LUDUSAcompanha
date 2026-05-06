// =============================================================================
// unityController.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Controller de rotas públicas para o Unity.
// Sem autenticação JWT — o Unity busca instituições, turmas e alunos
// para exibir na tela de identificação antes do jogo começar.
// =============================================================================

const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");

// -------------------------------------------------------------------------
// listarInstituicoes — GET /api/unity/schools
// -------------------------------------------------------------------------

const listarInstituicoes = async (req, res) => {
    try {
        const instituicoes = await Institution.find()
            .select("_id name city")
            .sort({ name: 1 });

        return res.json({ sucesso: true, escolas: instituicoes });
    } catch (erro) {
        console.error(
            "[LUDUS] Unity - Erro ao listar instituições:",
            erro.message,
        );
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar instituições",
        });
    }
};

// -------------------------------------------------------------------------
// listarTurmas — GET /api/unity/groups/:institutionId
// -------------------------------------------------------------------------

const listarTurmas = async (req, res) => {
    try {
        const turmas = await Group.find({
            institutionId: req.params.institutionId,
        })
            .select("_id name")
            .sort({ name: 1 });

        return res.json({ sucesso: true, turmas });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao listar turmas:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar turmas",
        });
    }
};

// -------------------------------------------------------------------------
// listarAlunos — GET /api/unity/students/:groupId
// -------------------------------------------------------------------------

const listarAlunos = async (req, res) => {
    try {
        const alunos = await Student.find({ groupId: req.params.groupId })
            .select("_id name capturaSolicitada capturaSolicitadaOrigem")
            .sort({ name: 1 });

        return res.json({ sucesso: true, alunos });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao listar alunos:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar alunos",
        });
    }
};

// -------------------------------------------------------------------------
// solicitarCapturaAluno — POST /api/unity/students/:id/solicitar-captura
// -------------------------------------------------------------------------

const solicitarCapturaAluno = async (req, res) => {
    try {
        const aluno = await Student.findById(req.params.id);

        if (!aluno) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Aluno não encontrado",
            });
        }

        const ativo =
            typeof req.body?.ativo === "boolean" ? req.body.ativo : true;

        if (
            aluno.capturaSolicitada &&
            aluno.capturaSolicitadaOrigem === "dashboard"
        ) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "A captura de imagens já foi ativada pelo dashboard. Aguarde a próxima sessão ser registrada ou desative pelo dashboard.",
                capturaSolicitada: aluno.capturaSolicitada,
                capturaSolicitadaOrigem: aluno.capturaSolicitadaOrigem,
            });
        }

        aluno.capturaSolicitada = ativo;
        aluno.capturaSolicitadaOrigem = ativo ? "unity" : null;
        await aluno.save();

        const acao = ativo ? "ativada" : "desativada";

        console.log(
            `[LUDUS] Unity - Captura de screenshots ${acao} para: ${aluno.name}`,
        );

        return res.json({
            sucesso: true,
            mensagem: `Captura de imagens ${acao} para a próxima sessão.`,
            aluno: {
                _id: aluno._id,
                name: aluno.name,
                capturaSolicitada: aluno.capturaSolicitada,
                capturaSolicitadaOrigem: aluno.capturaSolicitadaOrigem,
            },
        });
    } catch (erro) {
        console.error("[LUDUS] Unity - Erro ao alterar captura:", erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar captura de imagens",
        });
    }
};

module.exports = {
    listarInstituicoes,
    listarTurmas,
    listarAlunos,
    solicitarCapturaAluno,
};
