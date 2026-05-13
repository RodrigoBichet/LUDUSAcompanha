// =============================================================================
// seedDemoRandom.js
// Dataset sintetico/anonimo com volume configuravel.
//
// Uso:
//   npm run seed:demo:random
//   npm run seed:demo:random -- --alunos=12 --sessoes=40 --turmas=2 --seed=2026
//   npm run seed:demo:random -- --alunos=20 --sessoes=60 --turmas=3 --append --no-screenshots
//
// Este script cria dados ficticios para testar o fluxo demonstrativo com mais
// variacao. Por padrao, ele remove apenas dados do proprio dataset "Demo Random".
// Use --append para adicionar novos dados sem apagar o dataset random anterior.
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
const GAME_VERSION = "demo-random-2026";
const DEMO_PREFIX = "Demo Random";
const PASTA_SCREENSHOTS = path.join(__dirname, "../../uploads/screenshots");

const PROFESSOR_RANDOM = {
    name: "Professor Demo Random",
    email: "professor.random.demo@ludus.local",
    password: "Demo@2026",
    role: "professor",
};

const CATEGORIAS = [
    {
        nome: "Higiene",
        itens: ["escova", "sabonete", "toalha", "pente"],
    },
    {
        nome: "Alimentos",
        itens: ["prato", "copo", "fruta", "talheres"],
    },
    {
        nome: "Acoes",
        itens: ["correr", "sentar", "beber", "lavar"],
    },
    {
        nome: "Cotidiano",
        itens: ["livro", "mochila", "sapato", "roupa"],
    },
];

const NOMES = [
    "Ana",
    "Bento",
    "Caio",
    "Dora",
    "Elisa",
    "Gael",
    "Helena",
    "Ian",
    "Julia",
    "Leo",
    "Maya",
    "Noah",
    "Olivia",
    "Ravi",
    "Sofia",
    "Theo",
    "Lia",
    "Nilo",
];

const SUPORTES = [
    "N\u00edvel 1",
    "N\u00edvel 2",
    "N\u00edvel 3",
    "N\u00e3o informado",
];

const PERFIS = {
    bom: {
        nome: "bom desempenho",
        acertos: [3, 4],
        erros: [0, 1],
        inatividade: [0, 1],
        duracao: [19000, 29000],
        anotacao:
            "Observacao sintetica: completou a maioria das fases com poucas tentativas adicionais.",
    },
    medio: {
        nome: "desempenho intermediario",
        acertos: [2, 3],
        erros: [1, 2],
        inatividade: [1, 2],
        duracao: [30000, 43000],
        anotacao:
            "Observacao sintetica: alternou momentos de exploracao e acertos ao longo da atividade.",
    },
    atencao: {
        nome: "necessita acompanhamento",
        acertos: [0, 2],
        erros: [2, 4],
        inatividade: [2, 5],
        duracao: [44000, 65000],
        anotacao:
            "Observacao sintetica: apresentou mais tentativas e pausas, sugerindo necessidade de mediacao pedagogica.",
    },
};

const criarRng = (seedInicial) => {
    let seed = seedInicial >>> 0;
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
};

const parseArgs = () => {
    const valores = {};

    for (const arg of process.argv.slice(2)) {
        if (!arg.startsWith("--")) continue;

        const [chave, valor] = arg.replace(/^--/, "").split("=");
        valores[chave] = valor === undefined ? true : valor;
    }

    return valores;
};

const limitar = (valor, minimo, maximo) =>
    Math.min(maximo, Math.max(minimo, valor));

const inteiro = (rng, minimo, maximo) =>
    Math.floor(rng() * (maximo - minimo + 1)) + minimo;

const escolher = (rng, lista) => lista[inteiro(rng, 0, lista.length - 1)];

const embaralhar = (rng, lista) => {
    const itens = [...lista];

    for (let i = itens.length - 1; i > 0; i -= 1) {
        const j = inteiro(rng, 0, i);
        [itens[i], itens[j]] = [itens[j], itens[i]];
    }

    return itens;
};

const formatarNumero = (numero) => String(numero).padStart(2, "0");

const criarOpcoes = (categoria, faseIndex) => {
    const itens = [...categoria.itens];
    const target = itens[faseIndex % itens.length];

    return {
        target,
        options: itens,
    };
};

const criarSvgFase = (categoria, faseIndex) => {
    const cores = ["#4ecba0", "#7350ff", "#4196ff", "#f5a537"];
    const cor = cores[faseIndex % cores.length];
    const titulo = `${categoria.nome} - Fase ${faseIndex + 1}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#fff7e8"/>
  <rect x="115" y="80" width="500" height="110" rx="48" fill="#ff5a9d"/>
  <text x="365" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${titulo}</text>
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
  <text x="1290" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#334155">Objetivo</text>
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
            timestamp: faseIndex * 6000,
            caminho: `/uploads/screenshots/${nomeArquivo}`,
        };
    });
};

const criarMousePathFase = (rng, faseIndex, perfil, duracaoFase) => {
    const baseT = faseIndex * duracaoFase;
    const origemX = 210 + faseIndex * 75 + inteiro(rng, -25, 25);
    const origemY = 520 - faseIndex * 35 + inteiro(rng, -35, 35);
    const meioX = 780 + inteiro(rng, -140, 140);
    const meioY = 410 + inteiro(rng, -110, 110);
    const destinoX = 1280 - faseIndex * 35 + inteiro(rng, -55, 55);
    const destinoY = 430 + inteiro(rng, -80, 80);

    const pontos = [
        { x: origemX, y: origemY, t: baseT + 300 },
        {
            x: origemX + inteiro(rng, 90, 240),
            y: origemY + inteiro(rng, -120, 100),
            t: baseT + 900,
        },
        { x: meioX, y: meioY, t: baseT + 1700 },
        { x: destinoX, y: destinoY, t: baseT + 2600 },
    ];

    const quantidadeExtra =
        perfil === "atencao" ? 3 : perfil === "medio" ? 2 : 1;

    for (let i = 0; i < quantidadeExtra; i += 1) {
        pontos.splice(2, 0, {
            x: inteiro(rng, 190, 980),
            y: inteiro(rng, 230, 730),
            t: baseT + 1100 + i * 420,
        });
    }

    return pontos.sort((a, b) => a.t - b.t);
};

const criarArrasteFase = (rng, faseIndex, item, perfil, duracaoFase) => {
    const inicioT = faseIndex * duracaoFase + 1200;
    const origemX = 225 + faseIndex * 70 + inteiro(rng, -20, 20);
    const origemY = 395 + faseIndex * 45 + inteiro(rng, -30, 30);
    const passos = [
        { element: item, x: origemX, y: origemY, t: inicioT, state: "start" },
        {
            element: item,
            x: 520 + faseIndex * 35 + inteiro(rng, -45, 45),
            y: 420 + inteiro(rng, -45, 45),
            t: inicioT + 500,
            state: "move",
        },
        {
            element: item,
            x: 830 + inteiro(rng, -70, 70),
            y: 500 + inteiro(rng, -60, 60),
            t: inicioT + 1000,
            state: "move",
        },
        {
            element: item,
            x: 1290 - faseIndex * 25 + inteiro(rng, -35, 35),
            y: 455 + inteiro(rng, -45, 45),
            t: inicioT + 1550,
            state: "end",
        },
    ];

    if (perfil !== "bom") {
        passos.splice(2, 0, {
            element: item,
            x: inteiro(rng, 300, 700),
            y: inteiro(rng, 540, 760),
            t: inicioT + 760,
            state: "move",
        });
    }

    return passos;
};

const evento = (eventType, timestamp, payload = {}) => ({
    eventType,
    timestamp,
    payload: JSON.stringify(payload),
});

const criarSessao = ({
    rng,
    indice,
    aluno,
    categoria,
    startedAt,
    perfil,
    comScreenshots,
}) => {
    const config = PERFIS[perfil];
    const totalCorrect = limitar(
        inteiro(rng, config.acertos[0], config.acertos[1]),
        0,
        4,
    );
    const totalWrong = limitar(
        inteiro(rng, config.erros[0], config.erros[1]),
        0,
        4,
    );
    const inactivityCount = inteiro(
        rng,
        config.inatividade[0],
        config.inatividade[1],
    );
    const durationMs = inteiro(rng, config.duracao[0], config.duracao[1]);
    const duracaoFase = Math.max(5000, Math.floor(durationMs / 4));
    const sessionId = `demo-random-${formatarNumero(indice + 1)}-${aluno.slug}`;
    const wrongPhases = new Set();

    while (wrongPhases.size < totalWrong) {
        wrongPhases.add(inteiro(rng, 0, 3));
    }

    const mousePath = [];
    const dragPath = [];
    const clicks = [];
    const gameEvents = [
        evento("CategorySelected", 0, { category: categoria.nome }),
    ];

    for (let faseIndex = 0; faseIndex < 4; faseIndex += 1) {
        const inicio = faseIndex * duracaoFase;
        const { target, options } = criarOpcoes(categoria, faseIndex);
        const itemArrastado = wrongPhases.has(faseIndex)
            ? options[(faseIndex + 1) % options.length]
            : target;

        gameEvents.push(
            evento("PhaseStarted", inicio, {
                target,
                options,
                faseIndex,
            }),
        );

        mousePath.push(
            ...criarMousePathFase(rng, faseIndex, perfil, duracaoFase),
        );
        dragPath.push(
            ...criarArrasteFase(
                rng,
                faseIndex,
                itemArrastado,
                perfil,
                duracaoFase,
            ),
        );

        clicks.push({
            element: "area_resposta",
            x: 1280 - faseIndex * 30 + inteiro(rng, -35, 35),
            y: 455 + inteiro(rng, -45, 45),
            timestamp: inicio + 2600,
        });

        if (itemArrastado === target) {
            gameEvents.push(
                evento("DragAttempt", inicio + 2500, {
                    item: target,
                    target,
                    correct: true,
                }),
            );
            gameEvents.push(
                evento("CorrectMatch", inicio + 2800, {
                    item: target,
                    timeSeconds: Number(((inicio + 2800) / 1000).toFixed(1)),
                }),
            );
        } else {
            gameEvents.push(
                evento("DragAttempt", inicio + 2400, {
                    item: itemArrastado,
                    target,
                    correct: false,
                }),
            );
            gameEvents.push(
                evento("WrongMatch", inicio + 2600, {
                    item: itemArrastado,
                    expected: target,
                }),
            );
            gameEvents.push(
                evento("DragAttempt", inicio + 3300, {
                    item: target,
                    target,
                    correct: true,
                }),
            );
            gameEvents.push(
                evento("CorrectMatch", inicio + 3600, {
                    item: target,
                    timeSeconds: Number(((inicio + 3600) / 1000).toFixed(1)),
                }),
            );
        }

        gameEvents.push(
            evento("PhaseCompleted", inicio + 4200, {
                acertos: Math.min(faseIndex + 1, totalCorrect),
                erros: Math.min(faseIndex + 1, totalWrong),
                timeSeconds: Number(((inicio + 4200) / 1000).toFixed(1)),
                stars: totalWrong <= 1 ? 3 : totalWrong <= 2 ? 2 : 1,
            }),
        );
    }

    for (let i = 0; i < inactivityCount; i += 1) {
        gameEvents.push(
            evento("InactivityDetected", 6000 + i * 7000, {
                durationMs: inteiro(rng, 8000, 16000),
            }),
        );
    }

    gameEvents.push(evento("SessionEnded", durationMs, {}));

    return {
        sessionId,
        studentId: aluno._id,
        playerId: aluno.name,
        gameId: GAME_ID,
        gameVersion: GAME_VERSION,
        platform: "WebGL-demo-random",
        startedAt: startedAt.toISOString(),
        endedAt: new Date(startedAt.getTime() + durationMs).toISOString(),
        durationMs,
        metrics: {
            totalClicks: clicks.length,
            totalCorrect,
            totalWrong,
            firstActionMs: 300,
            avgTimeBetweenActionsMs: inteiro(rng, 1500, 2600),
            inactivityCount,
            totalInactivityMs: inactivityCount * 10000,
        },
        clicks,
        mousePath,
        dragPath,
        gameEvents: gameEvents.sort((a, b) => a.timestamp - b.timestamp),
        screenshots: comScreenshots
            ? salvarScreenshotsDemo(sessionId, categoria)
            : [],
    };
};

const limparScreenshotsRandom = () => {
    if (!fs.existsSync(PASTA_SCREENSHOTS)) return;

    for (const arquivo of fs.readdirSync(PASTA_SCREENSHOTS)) {
        if (!arquivo.startsWith("demo-random-")) continue;

        const caminhoCompleto = path.resolve(PASTA_SCREENSHOTS, arquivo);
        if (!caminhoCompleto.startsWith(path.resolve(PASTA_SCREENSHOTS)))
            continue;

        fs.unlinkSync(caminhoCompleto);
    }
};

const limparDatasetRandom = async () => {
    await Session.deleteMany({
        $or: [
            { sessionId: { $regex: "^demo-random-" } },
            { gameVersion: GAME_VERSION },
        ],
    });

    const instituicoes = await Institution.find({
        name: { $regex: `^${DEMO_PREFIX} -` },
    }).select("_id");
    const idsInstituicoes = instituicoes.map((instituicao) => instituicao._id);

    const grupos = await Group.find({
        institutionId: { $in: idsInstituicoes },
    }).select("_id");
    const idsGrupos = grupos.map((grupo) => grupo._id);

    await Student.deleteMany({
        $or: [
            { groupId: { $in: idsGrupos } },
            { name: { $regex: " Demo Random [0-9]{2}$" } },
        ],
    });
    await Group.deleteMany({ institutionId: { $in: idsInstituicoes } });
    await Institution.deleteMany({ _id: { $in: idsInstituicoes } });
    await User.deleteMany({ email: PROFESSOR_RANDOM.email });

    limparScreenshotsRandom();
};

const criarAlunos = async ({ rng, totalAlunos, turmas, professor, lote }) => {
    const alunos = [];
    const perfis = ["bom", "medio", "atencao"];

    const nomesEmbaralhados = embaralhar(rng, NOMES);

    for (let i = 0; i < totalAlunos; i += 1) {
        const perfil = perfis[i % perfis.length];
        const nomeBase = nomesEmbaralhados[i % nomesEmbaralhados.length];
        const numero = formatarNumero(i + 1);
        const sufixoLote = lote ? ` ${lote}` : "";
        const nome = `${nomeBase} Demo Random ${numero}${sufixoLote}`;
        const turma = turmas[i % turmas.length];
        const ano = inteiro(rng, 2015, 2019);
        const mes = formatarNumero(inteiro(rng, 1, 12));
        const dia = formatarNumero(inteiro(rng, 1, 27));

        const aluno = await Student.create({
            name: nome,
            birthDate: `${ano}-${mes}-${dia}`,
            groupId: turma._id,
            supportLevel: escolher(rng, SUPORTES),
            otherConditions:
                perfil === "bom"
                    ? "Exemplo sintetico: acompanha bem as atividades propostas."
                    : perfil === "medio"
                      ? "Exemplo sintetico: pode precisar de tempo adicional em algumas etapas."
                      : "Exemplo sintetico: pode se beneficiar de mediacao pedagogica durante a atividade.",
            guardianName: `Responsavel Demo Random ${numero}`,
            guardianContact: `contato.demo.random.${numero}@example.local`,
            anotacoes: [
                {
                    texto: PERFIS[perfil].anotacao,
                    autorId: professor._id,
                    autorNome: professor.name,
                },
            ],
        });

        alunos.push({
            _id: aluno._id,
            name: aluno.name,
            slug: lote
                ? `aluno-${numero}-${lote.replace("#", "lote-")}`
                : `aluno-${numero}`,
            perfil,
        });
    }

    return alunos;
};

const criarDataset = async ({
    totalAlunos,
    totalSessoes,
    totalTurmas,
    seed,
    append,
    semScreenshots,
    lote,
}) => {
    const rng = criarRng(seed);

    if (!append) {
        await limparDatasetRandom();
    }

    const sufixoLote = lote ? ` ${lote}` : "";

    let instituicao = null;

    if (append) {
        instituicao = await Institution.findOne({
            name: `${DEMO_PREFIX} - Instituicao Gerada`,
        });
    }

    if (!instituicao) {
        instituicao = await Institution.create({
            name: `${DEMO_PREFIX} - Instituicao Gerada`,
            city: "Cidade Ficticia",
        });
    }

    const professorExistente = await User.findOne({
        email: PROFESSOR_RANDOM.email,
    });

    const professor = professorExistente
        ? await User.findByIdAndUpdate(
              professorExistente._id,
              { institutionId: instituicao._id },
              { returnDocument: "after" },
          )
        : await User.create({
              ...PROFESSOR_RANDOM,
              institutionId: instituicao._id,
          });

    const turmas = [];
    for (let i = 0; i < totalTurmas; i += 1) {
        turmas.push(
            await Group.create({
                name: `${DEMO_PREFIX} - Turma ${i + 1}${sufixoLote}`,
                institutionId: instituicao._id,
                professorId: professor._id,
            }),
        );
    }

    const alunos = await criarAlunos({
        rng,
        totalAlunos,
        turmas,
        professor,
        lote,
    });

    const sessoes = [];
    const baseData = new Date("2026-05-10T12:00:00.000Z");

    for (let i = 0; i < totalSessoes; i += 1) {
        const aluno = alunos[i % alunos.length];
        const categoria = escolher(rng, CATEGORIAS);
        const startedAt = new Date(
            baseData.getTime() + i * inteiro(rng, 18, 42) * 60 * 1000,
        );

        sessoes.push(
            criarSessao({
                rng,
                indice: i,
                aluno,
                categoria,
                startedAt,
                perfil: aluno.perfil,
                comScreenshots: !semScreenshots && i % 3 === 0,
            }),
        );
    }

    await Session.insertMany(sessoes);

    return {
        instituicao,
        professor,
        turmas,
        alunos,
        sessoes,
    };
};

const main = async () => {
    const args = parseArgs();
    const append = Boolean(args.append);
    const semScreenshots = Boolean(args["no-screenshots"]);
    const alunosSolicitados = Number(args.alunos || 12);
    const turmasSolicitadas = Number(args.turmas || 2);
    const sessoesSolicitadas = Number(args.sessoes || alunosSolicitados * 4);
    const totalAlunos = limitar(alunosSolicitados, 3, 60);
    const totalTurmas = limitar(turmasSolicitadas, 1, 8);
    const totalSessoes = limitar(sessoesSolicitadas, totalAlunos, 240);
    const seed = Number(args.seed || Date.now());
    const lote = append ? `#${seed}` : "";

    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI nao definida no .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("[Demo Random] MongoDB conectado.");

        if (totalAlunos !== alunosSolicitados) {
            console.log(
                `[Demo Random] Alunos ajustados de ${alunosSolicitados} para ${totalAlunos}. O minimo e 3 para incluir os perfis: bom, intermediario e acompanhamento.`,
            );
        }

        if (totalSessoes !== sessoesSolicitadas) {
            console.log(
                `[Demo Random] Sessoes ajustadas de ${sessoesSolicitadas} para ${totalSessoes}. O minimo de 1 sessao por aluno.`,
            );
        }

        const resultado = await criarDataset({
            totalAlunos,
            totalSessoes,
            totalTurmas,
            seed,
            append,
            semScreenshots,
            lote,
        });

        console.log(
            append
                ? "[Demo Random] Dataset sintetico aleatorio adicionado ao banco."
                : "[Demo Random] Dataset sintetico aleatorio recriado.",
        );
        console.log(`[Demo Random] Seed: ${seed}`);
        console.log(`[Demo Random] Modo append: ${append ? "sim" : "nao"}`);
        console.log(
            `[Demo Random] Screenshots demo: ${semScreenshots ? "nao" : "sim"}`,
        );
        if (lote) {
            console.log(`[Demo Random] Lote: ${lote}`);
        }

        console.log("[Demo Random] Login professor:");
        console.log(`  Email: ${PROFESSOR_RANDOM.email}`);
        console.log(`  Senha: ${PROFESSOR_RANDOM.password}`);
        console.log(
            `[Demo Random] Instituicao: ${resultado.instituicao.name} (${resultado.instituicao.city})`,
        );
        console.log(`[Demo Random] Turmas: ${resultado.turmas.length}`);
        console.log(`[Demo Random] Alunos: ${resultado.alunos.length}`);
        console.log(`[Demo Random] Sessoes: ${resultado.sessoes.length}`);
    } catch (erro) {
        console.error("[Demo Random] Erro ao criar dataset:", erro.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

main();
