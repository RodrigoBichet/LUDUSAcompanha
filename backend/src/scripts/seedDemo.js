// =============================================================================
// seedDemo.js
// Dataset sintetico/anonimo.
//
// Uso:
//   npm run seed:demo
//
// Este script cria um cenario demonstrativo sem nomes reais de alunos,
// professores ou instituicoes. Ele remove apenas dados com prefixo Demo
// antes de recriar o dataset.
// =============================================================================

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");
const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");
const Session = require("../models/Session");

const GAME_ID = "para-que-serve";
const GAME_VERSION = "demo-2026";
const DEMO_PREFIX = "Demo";

const PASTA_SCREENSHOTS = path.join(__dirname, "../../uploads/screenshots");

const PROFESSOR_DEMO = {
    name: "Professora Demo",
    email: "professora.demo@ludus.local",
    password: "Demo@2026",
    role: "professor",
};

const INSTITUICAO_DEMO = {
    name: "Instituicao Demonstrativa",
    city: "Cidade Ficticia",
};

const TURMA_DEMO = {
    name: "Turma Demonstrativa A",
};

const ALUNOS_DEMO = [
    {
        name: "Clara Demo",
        birthDate: "2017-04-12",
        supportLevel: "N\u00edvel 1",
        otherConditions: "Exemplo sintetico: acompanhamento pedagogico leve.",
        guardianName: "Responsavel Demo 1",
        guardianContact: "contato.ficticio.1@example.local",
        anotacoes: [
            {
                texto: "Observacao sintetica: demonstrou boa familiaridade com as categorias ja praticadas.",
                autorNome: PROFESSOR_DEMO.name,
            },
        ],
    },
    {
        name: "Nilo Demo",
        birthDate: "2016-09-23",
        supportLevel: "N\u00edvel 2",
        otherConditions:
            "Exemplo sintetico: requer mais tempo de mediacao durante as tarefas.",
        guardianName: "Responsavel Demo 2",
        guardianContact: "contato.ficticio.2@example.local",
        anotacoes: [
            {
                texto: "Observacao sintetica: apresentou pausas maiores antes de algumas tentativas.",
                autorNome: PROFESSOR_DEMO.name,
            },
        ],
    },
    {
        name: "Lia Demo",
        birthDate: "2018-01-30",
        supportLevel: "N\u00e3o informado",
        otherConditions:
            "Exemplo sintetico: observacao de exploracao frequente da interface.",
        guardianName: "Responsavel Demo 3",
        guardianContact: "contato.ficticio.3@example.local",
        anotacoes: [
            {
                texto: "Observacao sintetica: explorou diferentes itens antes de concluir as fases.",
                autorNome: PROFESSOR_DEMO.name,
            },
        ],
    },
];

const categorias = ["Higiene", "Alimentos", "Acoes", "Cotidiano"];

const criarSvgFase = (categoria, faseIndex) => {
    const cores = ["#4ecba0", "#7350ff", "#4196ff", "#f5a537"];
    const cor = cores[faseIndex % cores.length];
    const titulo = `${categoria} - Fase ${faseIndex + 1}`;
    const alvo = "Objetivo";

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#fff7e8"/>
  <rect x="120" y="80" width="470" height="110" rx="48" fill="#ff5a9d"/>
  <text x="355" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${titulo}</text>
  <rect x="120" y="300" width="210" height="190" rx="42" fill="#ffffff" stroke="${cor}" stroke-width="10"/>
  <rect x="380" y="300" width="210" height="190" rx="42" fill="#ffffff" stroke="${cor}" stroke-width="10"/>
  <rect x="120" y="570" width="210" height="190" rx="42" fill="#ffffff" stroke="${cor}" stroke-width="10"/>
  <rect x="380" y="570" width="210" height="190" rx="42" fill="#ffffff" stroke="${cor}" stroke-width="10"/>
  <circle cx="225" cy="395" r="48" fill="#bdebdc"/>
  <circle cx="485" cy="395" r="48" fill="#d7ceff"/>
  <circle cx="225" cy="665" r="48" fill="#b8dcff"/>
  <circle cx="485" cy="665" r="48" fill="#ffd99f"/>
  <rect x="730" y="390" width="200" height="185" rx="50" fill="#d94f88"/>
  <text x="830" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff">?</text>
  <rect x="1160" y="260" width="260" height="420" rx="110" fill="#ffc400"/>
  <circle cx="1290" cy="430" r="105" fill="#ffffff"/>
  <text x="1290" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#334155">${alvo}</text>
  <rect x="1290" y="720" width="170" height="95" rx="42" fill="#a8c98c"/>
  <text x="1375" y="782" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">&gt;</text>
</svg>`;
};

const salvarScreenshotsDemo = (sessionId, categoria) => {
    if (!fs.existsSync(PASTA_SCREENSHOTS)) {
        fs.mkdirSync(PASTA_SCREENSHOTS, { recursive: true });
    }

    return [0, 1, 2, 3].map((faseIndex) => {
        const nomeArquivo = `${sessionId}_fase${faseIndex}.svg`;
        const caminhoCompleto = path.join(PASTA_SCREENSHOTS, nomeArquivo);
        fs.writeFileSync(caminhoCompleto, criarSvgFase(categoria, faseIndex));

        return {
            faseIndex,
            timestamp: faseIndex * 5000,
            caminho: `/uploads/screenshots/${nomeArquivo}`,
        };
    });
};

const criarPontosFase = (faseIndex, intensidade = 1) => {
    const baseY = 900 - (340 + faseIndex * 70);
    const deslocamento = faseIndex * 35;

    return [
        { x: 210 + deslocamento, y: baseY, t: faseIndex * 5000 + 300 },
        { x: 450 + deslocamento, y: baseY - 80, t: faseIndex * 5000 + 900 },
        { x: 820 + deslocamento, y: 900 - 475, t: faseIndex * 5000 + 1700 },
        { x: 1260 - deslocamento, y: 900 - 455, t: faseIndex * 5000 + 2600 },
        {
            x: 1375 - deslocamento,
            y: 900 - 765,
            t: faseIndex * 5000 + 3600 * intensidade,
        },
    ];
};

const criarArrasteFase = (faseIndex, item) => {
    const inicioT = faseIndex * 5000 + 1100;
    const inicioX = 225 + faseIndex * 85;
    const inicioY = 900 - (395 + faseIndex * 35);

    return [
        { element: item, x: inicioX, y: inicioY, t: inicioT, state: "start" },
        {
            element: item,
            x: 500 + faseIndex * 40,
            y: 900 - 430,
            t: inicioT + 450,
            state: "move",
        },
        {
            element: item,
            x: 830,
            y: 900 - 500,
            t: inicioT + 900,
            state: "move",
        },
        {
            element: item,
            x: 1285 - faseIndex * 30,
            y: 900 - 455,
            t: inicioT + 1450,
            state: "end",
        },
    ];
};

const evento = (eventType, timestamp, payload = {}) => ({
    eventType,
    timestamp,
    payload: JSON.stringify(payload),
});

const criarSessao = ({
    sessionId,
    studentId,
    playerId,
    categoria,
    startedAt,
    totalCorrect,
    totalWrong,
    inactivityCount,
    durationMs,
    comScreenshots = false,
}) => {
    const itens = ["escova", "copo", "livro", "bola"];
    const phaseEvents = [];
    const mousePath = [];
    const dragPath = [];
    const clicks = [];

    phaseEvents.push(evento("CategorySelected", 0, { category: categoria }));

    for (let faseIndex = 0; faseIndex < 4; faseIndex += 1) {
        const inicio = faseIndex * 5000;
        const target = itens[faseIndex];

        phaseEvents.push(
            evento("PhaseStarted", inicio, {
                target,
                options: itens,
                faseIndex,
            }),
        );

        mousePath.push(...criarPontosFase(faseIndex));
        dragPath.push(...criarArrasteFase(faseIndex, target));

        clicks.push({
            element: "area_resposta",
            x: 1280 - faseIndex * 30,
            y: 900 - 455,
            timestamp: inicio + 2600,
        });

        if (faseIndex < totalWrong) {
            phaseEvents.push(
                evento("DragAttempt", inicio + 2600, {
                    item: itens[(faseIndex + 1) % itens.length],
                    target,
                    correct: false,
                }),
            );
            phaseEvents.push(
                evento("WrongMatch", inicio + 2700, {
                    item: itens[(faseIndex + 1) % itens.length],
                    expected: target,
                }),
            );
        } else {
            phaseEvents.push(
                evento("DragAttempt", inicio + 2600, {
                    item: target,
                    target,
                    correct: true,
                }),
            );
            phaseEvents.push(
                evento("CorrectMatch", inicio + 2800, {
                    item: target,
                    timeSeconds: Number(((inicio + 2800) / 1000).toFixed(1)),
                }),
            );
        }

        phaseEvents.push(
            evento("PhaseCompleted", inicio + 4200, {
                acertos: Math.min(faseIndex + 1, totalCorrect),
                erros: Math.min(faseIndex + 1, totalWrong),
                timeSeconds: Number(((inicio + 4200) / 1000).toFixed(1)),
                stars: totalWrong === 0 ? 3 : 2,
            }),
        );
    }

    if (inactivityCount > 0) {
        phaseEvents.push(
            evento("InactivityDetected", 7200, {
                durationMs: 10000,
            }),
        );
    }

    phaseEvents.push(evento("SessionEnded", durationMs, {}));

    return {
        sessionId,
        studentId,
        playerId,
        gameId: GAME_ID,
        gameVersion: GAME_VERSION,
        platform: "WebGL-demo",
        startedAt,
        endedAt: new Date(
            new Date(startedAt).getTime() + durationMs,
        ).toISOString(),
        durationMs,
        metrics: {
            totalClicks: clicks.length,
            totalCorrect,
            totalWrong,
            firstActionMs: 300,
            avgTimeBetweenActionsMs: 1800,
            inactivityCount,
            totalInactivityMs: inactivityCount * 10000,
        },
        clicks,
        mousePath,
        dragPath,
        gameEvents: phaseEvents,
        screenshots: comScreenshots
            ? salvarScreenshotsDemo(sessionId, categoria)
            : [],
    };
};

const limparDatasetDemo = async () => {
    const alunosDemo = ALUNOS_DEMO.map((aluno) => aluno.name);

    await Session.deleteMany({
        $or: [
            { sessionId: { $regex: "^demo-(clara|nilo|lia)-" } },
            { playerId: { $in: alunosDemo } },
            { gameVersion: GAME_VERSION },
        ],
    });

    await Student.deleteMany({ name: { $in: alunosDemo } });
    await Group.deleteMany({ name: `${DEMO_PREFIX} - ${TURMA_DEMO.name}` });
    await Institution.deleteMany({
        name: `${DEMO_PREFIX} - ${INSTITUICAO_DEMO.name}`,
    });
    await User.deleteMany({ email: PROFESSOR_DEMO.email });
};

const criarDataset = async () => {
    await limparDatasetDemo();

    const instituicao = await Institution.create({
        name: `${DEMO_PREFIX} - ${INSTITUICAO_DEMO.name}`,
        city: INSTITUICAO_DEMO.city,
    });

    const professor = await User.create({
        ...PROFESSOR_DEMO,
        institutionId: instituicao._id,
    });

    const turma = await Group.create({
        name: `${DEMO_PREFIX} - ${TURMA_DEMO.name}`,
        institutionId: instituicao._id,
        professorId: professor._id,
    });

    const alunosCriados = [];

    for (const aluno of ALUNOS_DEMO) {
        const alunoCriado = await Student.create({
            ...aluno,
            groupId: turma._id,
            anotacoes: aluno.anotacoes.map((anotacao) => ({
                ...anotacao,
                autorId: professor._id,
            })),
        });

        alunosCriados.push(alunoCriado);
    }

    const alunosPorNome = Object.fromEntries(
        alunosCriados.map((aluno) => [aluno.name, aluno]),
    );

    const sessoes = [
        criarSessao({
            sessionId: "demo-clara-higiene-001",
            studentId: alunosPorNome["Clara Demo"]._id,
            playerId: "Clara Demo",
            categoria: "Higiene",
            startedAt: "2026-05-10T13:00:00.000Z",
            totalCorrect: 4,
            totalWrong: 0,
            inactivityCount: 0,
            durationMs: 21000,
            comScreenshots: true,
        }),
        criarSessao({
            sessionId: "demo-clara-alimentos-002",
            studentId: alunosPorNome["Clara Demo"]._id,
            playerId: "Clara Demo",
            categoria: "Alimentos",
            startedAt: "2026-05-10T13:25:00.000Z",
            totalCorrect: 3,
            totalWrong: 1,
            inactivityCount: 1,
            durationMs: 26000,
        }),
        criarSessao({
            sessionId: "demo-nilo-higiene-001",
            studentId: alunosPorNome["Nilo Demo"]._id,
            playerId: "Nilo Demo",
            categoria: "Higiene",
            startedAt: "2026-05-09T14:10:00.000Z",
            totalCorrect: 1,
            totalWrong: 3,
            inactivityCount: 3,
            durationMs: 42000,
            comScreenshots: true,
        }),
        criarSessao({
            sessionId: "demo-nilo-cotidiano-002",
            studentId: alunosPorNome["Nilo Demo"]._id,
            playerId: "Nilo Demo",
            categoria: "Cotidiano",
            startedAt: "2026-05-10T14:10:00.000Z",
            totalCorrect: 2,
            totalWrong: 2,
            inactivityCount: 2,
            durationMs: 38000,
        }),
        criarSessao({
            sessionId: "demo-lia-acoes-001",
            studentId: alunosPorNome["Lia Demo"]._id,
            playerId: "Lia Demo",
            categoria: "Acoes",
            startedAt: "2026-05-08T15:00:00.000Z",
            totalCorrect: 2,
            totalWrong: 2,
            inactivityCount: 1,
            durationMs: 33000,
            comScreenshots: true,
        }),
    ];

    await Session.insertMany(sessoes);

    return {
        instituicao,
        professor,
        turma,
        alunos: alunosCriados,
        sessoes,
    };
};

const main = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI nao definida no .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[Demo] MongoDB conectado.");

        const resultado = await criarDataset();

        console.log("[Demo] Dataset sintetico recriado com sucesso.");
        console.log("[Demo] Login professor:");
        console.log(`  Email: ${PROFESSOR_DEMO.email}`);
        console.log(`  Senha: ${PROFESSOR_DEMO.password}`);
        console.log(
            `[Demo] Instituicao: ${resultado.instituicao.name} (${resultado.instituicao.city})`,
        );
        console.log(`[Demo] Turma: ${resultado.turma.name}`);
        console.log(`[Demo] Alunos: ${resultado.alunos.length}`);
        console.log(`[Demo] Sessoes: ${resultado.sessoes.length}`);
    } catch (erro) {
        console.error("[Demo] Erro ao criar dataset:", erro.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

main();
