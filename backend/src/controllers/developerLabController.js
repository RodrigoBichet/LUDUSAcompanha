const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");

const NOMES_ALUNOS_TESTE = [
    "Aluno teste 01",
    "Aluno teste 02",
    "Aluno teste 03",
];

const buscarLaboratorio = async (usuarioId) => {
    const instituicao = await Institution.findOne({
        ownerUserId: usuarioId,
        environmentType: "sandbox",
    });
    if (!instituicao) {
        return {
            ativo: false,
            instituicao: null,
            turma: null,
            alunos: [],
        };
    }

    const turma = await Group.findOne({
        institutionId: instituicao._id,
        professorId: usuarioId,
    }).sort({ createdAt: 1 });
    const alunos = turma
        ? await Student.find({ groupId: turma._id }).sort({ name: 1 })
        : [];

    return {
        ativo: Boolean(turma),
        instituicao,
        turma,
        alunos,
    };
};

const obterLaboratorio = async (req, res) => {
    try {
        const laboratorio = await buscarLaboratorio(req.usuarioId);
        return res.json({ sucesso: true, laboratorio });
    } catch (erro) {
        console.error("[LUDUS] Erro ao consultar laboratório:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível consultar o laboratório de testes.",
        });
    }
};

const prepararLaboratorio = async (req, res) => {
    try {
        const laboratorioAnterior = await buscarLaboratorio(req.usuarioId);
        const instituicao = await Institution.findOneAndUpdate(
            {
                ownerUserId: req.usuarioId,
                environmentType: "sandbox",
            },
            {
                $setOnInsert: {
                    name: "Laboratório LUDUS",
                    city: "Ambiente de teste",
                    ownerUserId: req.usuarioId,
                    environmentType: "sandbox",
                },
            },
            { upsert: true, returnDocument: "after", runValidators: true },
        );

        const turma = await Group.findOneAndUpdate(
            {
                institutionId: instituicao._id,
                professorId: req.usuarioId,
            },
            {
                $setOnInsert: {
                    name: "Turma de teste",
                    institutionId: instituicao._id,
                    professorId: req.usuarioId,
                },
            },
            { upsert: true, returnDocument: "after", runValidators: true },
        );

        await Promise.all(
            NOMES_ALUNOS_TESTE.map((name) =>
                Student.findOneAndUpdate(
                    { groupId: turma._id, name },
                    {
                        $setOnInsert: {
                            name,
                            groupId: turma._id,
                            institutionId: instituicao._id,
                            enrollmentMode: "school",
                        },
                    },
                    { upsert: true, returnDocument: "after", runValidators: true },
                ),
            ),
        );

        const laboratorio = await buscarLaboratorio(req.usuarioId);
        return res.status(laboratorioAnterior.ativo ? 200 : 201).json({
            sucesso: true,
            mensagem: "Laboratório de testes preparado com dados simulados.",
            laboratorio,
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao preparar laboratório:", erro.message);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Não foi possível preparar o laboratório de testes.",
        });
    }
};

module.exports = { obterLaboratorio, prepararLaboratorio };
