const { after, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.JWT_SECRET = "segredo-exclusivo-dos-testes-ludus";

const app = require("../src/app");
const User = require("../src/models/User");
const Institution = require("../src/models/Institution");
const Group = require("../src/models/Group");
const Student = require("../src/models/Student");
const Session = require("../src/models/Session");
const Game = require("../src/models/Game");
const CollectionParticipant = require("../src/models/CollectionParticipant");
const ObservationCollection = require("../src/models/ObservationCollection");
const ObservationSubmission = require("../src/models/ObservationSubmission");
const {
    compararCodigoColeta,
} = require("../src/services/collectionCode");
const {
    limparTentativasPareamento,
} = require("../src/services/pairingAttemptLimiter");

let mongo;

const tokenDe = (usuario) =>
    jwt.sign({ id: String(usuario._id) }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

const sessaoDeTeste = (aluno, sufixo) => ({
    sessionId: `sessao-teste-${sufixo}`,
    studentId: aluno._id,
    playerId: aluno.name,
    gameId: "jogo-teste",
});

const criarCenarioEscolar = async () => {
    const admin = await User.create({
        name: "Admin de teste",
        email: "admin.testes@ludus.local",
        password: "Senha@123",
        role: "admin",
    });
    const professoraA = await User.create({
        name: "Professora A",
        email: "professora.a@ludus.local",
        password: "Senha@123",
        role: "professor",
    });
    const professoraB = await User.create({
        name: "Professora B",
        email: "professora.b@ludus.local",
        password: "Senha@123",
        role: "professor",
    });

    const instituicaoA = await Institution.create({
        name: "Escola A de teste",
        ownerUserId: professoraA._id,
    });
    const instituicaoB = await Institution.create({
        name: "Escola B de teste",
        ownerUserId: professoraB._id,
    });
    const turmaA = await Group.create({
        name: "Turma A de teste",
        institutionId: instituicaoA._id,
        professorId: professoraA._id,
    });
    const turmaB = await Group.create({
        name: "Turma B de teste",
        institutionId: instituicaoB._id,
        professorId: professoraB._id,
    });
    const alunoA = await Student.create({
        name: "Aluno A de teste",
        groupId: turmaA._id,
        enrollmentMode: "school",
    });
    const segundoAlunoA = await Student.create({
        name: "Segundo aluno A de teste",
        groupId: turmaA._id,
        enrollmentMode: "school",
    });
    const alunoB = await Student.create({
        name: "Aluno B de teste",
        groupId: turmaB._id,
        enrollmentMode: "school",
    });
    const alunoProtegido = await Student.create({
        name: "Aluno protegido de teste",
        groupId: turmaA._id,
        enrollmentMode: "school",
        deletionProtected: true,
    });

    return {
        admin,
        professoraA,
        professoraB,
        instituicaoA,
        instituicaoB,
        turmaA,
        turmaB,
        alunoA,
        segundoAlunoA,
        alunoB,
        alunoProtegido,
    };
};

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    limparTentativasPareamento();
});

after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

test("cria coleta temporaria sem persistir o codigo legivel", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();

    await request(app).post("/api/collections").send({}).expect(401);

    const resposta = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({
            title: "Coleta fictícia da manhã",
            groupId: String(turmaA._id),
            durationMinutes: 60,
            allowedOrigins: [
                "https://jogos.exemplo.test/atividade",
                "https://jogos.exemplo.test/outra",
            ],
        })
        .expect(201);

    assert.match(
        resposta.body.codigoTemporario,
        /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/,
    );
    assert.equal(resposta.body.coleta.status, "active");
    assert.deepEqual(resposta.body.coleta.allowedOrigins, [
        "https://jogos.exemplo.test",
    ]);
    assert.equal(
        Object.hasOwn(resposta.body.coleta, "pairingCodeHash"),
        false,
    );

    const coletaPersistida = await ObservationCollection.findOne({
        collectionId: resposta.body.coleta.collectionId,
    }).select("+pairingCodeHash");
    assert.ok(coletaPersistida);
    assert.notEqual(
        coletaPersistida.pairingCodeHash,
        resposta.body.codigoTemporario,
    );
    assert.equal(
        compararCodigoColeta(
            resposta.body.codigoTemporario.toLowerCase().replaceAll("-", " "),
            coletaPersistida.pairingCodeHash,
        ),
        true,
    );

    const validadeMs =
        new Date(coletaPersistida.expiresAt).getTime() -
        new Date(coletaPersistida.startsAt).getTime();
    assert.equal(validadeMs, 60 * 60 * 1000);

    const listagem = await request(app)
        .get("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    assert.equal(listagem.body.total, 1);
    assert.equal(
        Object.hasOwn(listagem.body.coletas[0], "pairingCodeHash"),
        false,
    );
    assert.equal(
        Object.hasOwn(listagem.body.coletas[0], "codigoTemporario"),
        false,
    );
});

test("isola coleta por professora e permite revogacao idempotente", async () => {
    const { professoraA, professoraB, turmaA, turmaB } =
        await criarCenarioEscolar();

    await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ title: "Turma alheia", groupId: String(turmaB._id) })
        .expect(404);

    const criadaA = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ title: "Coleta A", groupId: String(turmaA._id) })
        .expect(201);
    const criadaB = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraB)}`)
        .send({ title: "Coleta B", groupId: String(turmaB._id) })
        .expect(201);

    await request(app)
        .patch(`/api/collections/${criadaB.body.coleta.collectionId}/revoke`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(404);

    const revogada = await request(app)
        .patch(`/api/collections/${criadaA.body.coleta.collectionId}/revoke`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    assert.equal(revogada.body.coleta.status, "revoked");
    assert.ok(revogada.body.coleta.revokedAt);

    const repetida = await request(app)
        .patch(`/api/collections/${criadaA.body.coleta.collectionId}/revoke`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    assert.equal(repetida.body.coleta.status, "revoked");

    const listaA = await request(app)
        .get("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    assert.equal(listaA.body.total, 1);
});

test("recusa validade, origem e turma invalidas ao criar coleta", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const autorizacao = `Bearer ${tokenDe(professoraA)}`;

    await request(app)
        .post("/api/collections")
        .set("Authorization", autorizacao)
        .send({
            title: "Validade curta",
            groupId: String(turmaA._id),
            durationMinutes: 14,
        })
        .expect(400);
    await request(app)
        .post("/api/collections")
        .set("Authorization", autorizacao)
        .send({
            title: "Origem inválida",
            groupId: String(turmaA._id),
            allowedOrigins: ["javascript:alert(1)"],
        })
        .expect(400);
    await request(app)
        .post("/api/collections")
        .set("Authorization", autorizacao)
        .send({ title: "Turma inválida", groupId: "nao-e-object-id" })
        .expect(400);

    assert.equal(await ObservationCollection.countDocuments(), 0);
});

test("pareia nome e codigo sem criar aluno e emite credencial limitada", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const quantidadeAlunosAntes = await Student.countDocuments();
    const criada = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ title: "Coleta para pareamento", groupId: String(turmaA._id) })
        .expect(201);

    const pareada = await request(app)
        .post("/api/collections/pair")
        .send({
            code: criada.body.codigoTemporario.toLowerCase(),
            participantName: "  Aluna Fictícia  ",
        })
        .expect(200);

    assert.equal(pareada.body.participante.displayName, "Aluna Fictícia");
    assert.equal(pareada.body.participante.resolutionStatus, "pending");
    assert.equal(
        pareada.body.coleta.collectionId,
        criada.body.coleta.collectionId,
    );
    assert.equal(await Student.countDocuments(), quantidadeAlunosAntes);
    assert.equal(await CollectionParticipant.countDocuments(), 1);

    const credencialDecodificada = jwt.verify(
        pareada.body.credencial.token,
        process.env.JWT_SECRET,
        {
            audience: "ludus-observa",
            issuer: "ludus-acompanha",
        },
    );
    assert.equal(credencialDecodificada.tokenType, "observation-upload");
    assert.equal(
        credencialDecodificada.collectionId,
        criada.body.coleta.collectionId,
    );
    assert.equal(
        credencialDecodificada.participantRef,
        pareada.body.participante.participantRef,
    );
    assert.equal(Object.hasOwn(credencialDecodificada, "id"), false);
    assert.equal(Object.hasOwn(credencialDecodificada, "displayName"), false);
    assert.ok(credencialDecodificada.exp - credencialDecodificada.iat > 60 * 60);
    assert.ok(
        credencialDecodificada.exp * 1000 <=
            new Date(criada.body.coleta.expiresAt).getTime(),
    );

    const repetida = await request(app)
        .post("/api/collections/pair")
        .send({
            code: criada.body.codigoTemporario.replace("-", " "),
            participantName: "aluna ficticia",
        })
        .expect(200);
    assert.equal(
        repetida.body.participante.participantRef,
        pareada.body.participante.participantRef,
    );
    assert.equal(await CollectionParticipant.countDocuments(), 1);

    await request(app)
        .get("/api/collections")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .expect(401);
});

test("recusa pareamento indisponivel e limita tentativas de codigo", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const autorizacao = `Bearer ${tokenDe(professoraA)}`;
    const criar = (title) =>
        request(app)
            .post("/api/collections")
            .set("Authorization", autorizacao)
            .send({ title, groupId: String(turmaA._id) });

    await request(app)
        .post("/api/collections/pair")
        .send({ code: "AAA-AAA", participantName: " " })
        .expect(400);
    await request(app)
        .post("/api/collections/pair")
        .send({ code: "AAA-AAA", participantName: "Aluno fictício" })
        .expect(401);

    const revogada = await criar("Coleta revogada").expect(201);
    await request(app)
        .patch(`/api/collections/${revogada.body.coleta.collectionId}/revoke`)
        .set("Authorization", autorizacao)
        .expect(200);
    await request(app)
        .post("/api/collections/pair")
        .send({
            code: revogada.body.codigoTemporario,
            participantName: "Aluno fictício",
        })
        .expect(401);

    const expirada = await criar("Coleta expirada").expect(201);
    await ObservationCollection.updateOne(
        { collectionId: expirada.body.coleta.collectionId },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    await request(app)
        .post("/api/collections/pair")
        .send({
            code: expirada.body.codigoTemporario,
            participantName: "Aluno fictício",
        })
        .expect(401);

    for (let tentativa = 0; tentativa < 20; tentativa += 1) {
        await request(app)
            .post("/api/collections/pair")
            .send({ code: "BBB-BBB", participantName: "Aluno fictício" })
            .expect(401);
    }
    await request(app)
        .post("/api/collections/pair")
        .send({ code: "BBB-BBB", participantName: "Aluno fictício" })
        .expect(429);

    assert.equal(await CollectionParticipant.countDocuments(), 0);
});

const jsonImportavel = () => ({
    sessionId: "arquivo-origem-unico",
    gameId: "jogo-teste",
    playerId: "Jogador do arquivo",
    clicks: [],
    mousePath: [],
    dragPath: [],
    gameEvents: [],
    screenshots: [],
});

const sessaoObservacionalDeLote = (sessionId, gameId) => ({
    schemaVersion: "1.0.0",
    captureMode: "observational",
    source: "ludus-observa-webextension",
    sourceVersion: "0.1.0",
    ingestionMethod: "file-import",
    capabilities: {
        clicks: true,
        mousePath: true,
        dragPath: true,
        screenshots: false,
        inactivity: false,
        focusEvents: false,
        phaseEvents: false,
        correctWrong: false,
        categoryEvents: false,
        customEvents: false,
    },
    sessionId,
    studentId: "000000000000000000000000",
    playerId: "Participante pendente de importação",
    gameId,
    gameVersion: "externo-desconhecido",
    platform: "browser",
    startedAt: "2026-08-31T20:00:00.000Z",
    endedAt: "2026-08-31T20:00:05.000Z",
    durationMs: 5000,
    viewport: {
        widthPx: 800,
        heightPx: 450,
        coordinateUnit: "pixel",
        coordinateOrigin: "bottom-left",
    },
    metrics: {
        totalClicks: 0,
        firstActionMs: -1,
        avgTimeBetweenActionsMs: 0,
        inactivityCount: 0,
        totalInactivityMs: 0,
    },
    clicks: [],
    mousePath: [],
    dragPath: [],
    gameEvents: [],
    screenshots: [],
});

const loteObservacionalDeTeste = (nomeParticipante) => ({
    batchSchemaVersion: "1.0.0",
    batchType: "ludus-observa-batch",
    source: "ludus-observa-webextension",
    sourceVersion: "0.1.0",
    batchId: "batch-teste-multi-jogo-001",
    collectionRef: null,
    createdAt: "2026-08-31T20:01:00.000Z",
    participant: {
        participantRef: "participant-ficticio-001",
        displayName: nomeParticipante,
        resolutionStatus: "local-pending",
        requiresReview: true,
    },
    sessions: [
        sessaoObservacionalDeLote(
            "observa-lote-sessao-a",
            "jogo-observacional-a",
        ),
        sessaoObservacionalDeLote(
            "observa-lote-sessao-b",
            "jogo-observacional-b",
        ),
    ],
});

const prepararColetaPareada = async ({ professora, turma, nomeParticipante }) => {
    const criada = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${tokenDe(professora)}`)
        .send({
            title: "Coleta de recebimento fictícia",
            groupId: String(turma._id),
        })
        .expect(201);
    const pareada = await request(app)
        .post("/api/collections/pair")
        .send({
            code: criada.body.codigoTemporario,
            participantName: nomeParticipante,
        })
        .expect(200);
    const lote = loteObservacionalDeTeste(
        pareada.body.participante.displayName,
    );
    lote.collectionRef = criada.body.coleta.collectionId;
    lote.participant.participantRef =
        pareada.body.participante.participantRef;

    return { criada, lote, pareada };
};

test("recebe lote pareado de forma idempotente sem criar aluno ou sessao", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const alunosAntes = await Student.countDocuments();
    const sessoesAntes = await Session.countDocuments();
    const { lote, pareada } = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "Aluna Fictícia da Coleta",
    });

    await request(app)
        .post("/api/collections/submissions")
        .send({ lote })
        .expect(401);

    const recebida = await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(201);

    assert.equal(recebida.body.totalRecebidas, 2);
    assert.equal(recebida.body.totalJaRecebidas, 0);
    assert.equal(recebida.body.recibos.length, 2);
    assert.ok(recebida.body.recibos.every((item) => item.status === "pending"));
    assert.equal(await ObservationSubmission.countDocuments(), 2);
    assert.equal(await Student.countDocuments(), alunosAntes);
    assert.equal(await Session.countDocuments(), sessoesAntes);

    const repetida = await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(200);
    assert.equal(repetida.body.totalRecebidas, 0);
    assert.equal(repetida.body.totalJaRecebidas, 2);
    assert.equal(await ObservationSubmission.countDocuments(), 2);

    lote.sessions[0].gameId = "jogo-alterado-no-reenvio";
    await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(409);
    assert.equal(await ObservationSubmission.countDocuments(), 2);
});

test("recusa lote de outro participante e coleta revogada", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const { criada, lote, pareada } = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "Participante Fictício Seguro",
    });

    lote.participant.participantRef = "participant-ref-de-outro-computador";
    await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(403);
    assert.equal(await ObservationSubmission.countDocuments(), 0);

    lote.participant.participantRef =
        pareada.body.participante.participantRef;
    await request(app)
        .patch(`/api/collections/${criada.body.coleta.collectionId}/revoke`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(401);
    assert.equal(await ObservationSubmission.countDocuments(), 0);
});

test("lista caixa pendente somente para a professora proprietaria sem expor payload bruto", async () => {
    const { professoraA, professoraB, turmaA } = await criarCenarioEscolar();
    const { criada, lote, pareada } = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "Estudante Fictícia da Caixa",
    });

    await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(201);

    const caminho = `/api/collections/${criada.body.coleta.collectionId}/submissions`;
    await request(app).get(caminho).expect(401);
    await request(app)
        .get(caminho)
        .set("Authorization", `Bearer ${tokenDe(professoraB)}`)
        .expect(404);

    const caixa = await request(app)
        .get(caminho)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);

    assert.equal(caixa.body.totalParticipantes, 1);
    assert.equal(caixa.body.totalSessoes, 2);
    assert.equal(caixa.body.recebimentos[0].displayName, "Estudante Fictícia da Caixa");
    assert.deepEqual(
        caixa.body.recebimentos[0].sessoes.map((item) => item.gameId).sort(),
        ["jogo-observacional-a", "jogo-observacional-b"],
    );
    assert.equal(caixa.body.recebimentos[0].sessoes[0].status, "pending");
    assert.equal(JSON.stringify(caixa.body).includes("sessionPayload"), false);
    assert.equal(JSON.stringify(caixa.body).includes("payloadDigest"), false);
    assert.equal(JSON.stringify(caixa.body).includes('"clicks"'), false);
});

test("resolve participante somente com aluno da turma e preserva revisao explicita", async () => {
    const { professoraA, turmaA, alunoA, alunoB } =
        await criarCenarioEscolar();
    const { criada, lote, pareada } = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "Nome Fictício para Associar",
    });
    await request(app)
        .post("/api/collections/submissions")
        .set("Authorization", `Bearer ${pareada.body.credencial.token}`)
        .send({ lote })
        .expect(201);

    const caminho = `/api/collections/${criada.body.coleta.collectionId}/participants/${pareada.body.participante.participantRef}/resolve`;
    await request(app)
        .post(caminho)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ studentId: String(alunoB._id) })
        .expect(404);

    const resolvida = await request(app)
        .post(caminho)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ studentId: String(alunoA._id) })
        .expect(200);
    assert.equal(resolvida.body.aluno.studentId, String(alunoA._id));
    assert.equal(resolvida.body.aluno.criado, false);

    const caixa = await request(app)
        .get(`/api/collections/${criada.body.coleta.collectionId}/submissions`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);
    assert.equal(caixa.body.recebimentos[0].resolutionStatus, "resolved");
    assert.equal(
        caixa.body.recebimentos[0].resolvedStudent.studentId,
        String(alunoA._id),
    );
    assert.equal(await Session.countDocuments(), 0);
});

const prepararImportacaoDeColeta = async () => {
    const cenario = await criarCenarioEscolar();
    const coleta = await prepararColetaPareada({
        professora: cenario.professoraA, turma: cenario.turmaA,
        nomeParticipante: "Participante Fictício para Histórico",
    });
    const resposta = await request(app).post("/api/collections/submissions")
        .set("Authorization", `Bearer ${coleta.pareada.body.credencial.token}`)
        .send({ lote: coleta.lote }).expect(201);
    const base = `/api/collections/${coleta.criada.body.coleta.collectionId}/participants/${coleta.pareada.body.participante.participantRef}`;
    const auth = `Bearer ${tokenDe(cenario.professoraA)}`;
    await Session.createIndexes();
    await Game.createIndexes();
    return { ...cenario, ...coleta, base, auth, receiptIds: resposta.body.recibos.map((item) => item.receiptId) };
};

test("importa recebimentos revisados por jogo sem duplicar e isola acesso", async () => {
    const c = await prepararImportacaoDeColeta();
    const importar = (auth = c.auth, receiptIds = c.receiptIds) => request(app)
        .patch(`${c.base}/import`).set("Authorization", auth).send({ receiptIds });
    await importar().expect(409);
    assert.equal(await Session.countDocuments(), 0);
    await request(app).post(`${c.base}/resolve`).set("Authorization", c.auth)
        .send({ studentId: String(c.alunoA._id) }).expect(200);
    await importar(`Bearer ${tokenDe(c.professoraB)}`).expect(404);
    await importar(`Bearer ${c.pareada.body.credencial.token}`).expect(401);
    await importar(c.auth, [c.receiptIds[0], "receipt-de-outra-coleta"]).expect(400);
    assert.equal(await Session.countDocuments(), 0);
    await importar().expect(200);
    await importar().expect(200);
    assert.equal(await Session.countDocuments(), 2);
    const sessoes = await Session.find({ studentId: c.alunoA._id });
    assert.deepEqual(sessoes.map((item) => item.gameId).sort(), c.lote.sessions.map((item) => item.gameId).sort());
    assert.ok(sessoes.every((item) => item.playerId === c.alunoA.name && item.captureMode === "observational"));
    assert.equal(await ObservationSubmission.countDocuments({ status: "imported" }), 2);
    assert.equal(await Game.countDocuments({ ownerUserId: c.professoraA._id }), 2);
    const aluno = await Student.findById(c.alunoA._id);
    assert.equal(aluno.assignedGameIds.length, 2);
    const caixa = await request(app).get(`/api/collections/${c.criada.body.coleta.collectionId}/submissions`)
        .set("Authorization", c.auth).expect(200);
    assert.equal(caixa.body.totalPendentes, 0);
    assert.equal(caixa.body.totalImportadas, 2);
});

test("retoma falha após persistir sessão e não sobrescreve importação manual", async () => {
    const c = await prepararImportacaoDeColeta();
    await request(app).post(`${c.base}/resolve`).set("Authorization", c.auth)
        .send({ studentId: String(c.alunoA._id) }).expect(200);
    const salvarOriginal = ObservationSubmission.prototype.save;
    ObservationSubmission.prototype.save = async function (...args) {
        if (this.status === "imported") throw new Error("Falha simulada no recibo");
        return salvarOriginal.apply(this, args);
    };
    try {
        await request(app).patch(`${c.base}/import`).set("Authorization", c.auth)
            .send({ receiptIds: [c.receiptIds[0]] }).expect(207);
    } finally {
        ObservationSubmission.prototype.save = salvarOriginal;
    }
    assert.equal(await Session.countDocuments(), 1);
    assert.equal(await ObservationSubmission.countDocuments({ status: "pending" }), 2);
    await request(app).patch(`${c.base}/import`).set("Authorization", c.auth)
        .send({ receiptIds: [c.receiptIds[0]] }).expect(200);
    assert.equal(await Session.countDocuments(), 1);
    await request(app).post(`/api/sessions/import/${c.alunoA._id}/confirm`)
        .set("Authorization", c.auth).send({ sessao: c.lote.sessions[1] }).expect(201);
    const conflito = await request(app).patch(`${c.base}/import`).set("Authorization", c.auth)
        .send({ receiptIds: [c.receiptIds[1]] }).expect(207);
    assert.match(conflito.body.resultados[0].mensagem, /nenhum dado foi sobrescrito/);
    assert.equal(await Session.countDocuments(), 2);
    assert.equal(await ObservationSubmission.countDocuments({ status: "pending" }), 1);
});

test("cria aluno escolar pela revisao e evita nome equivalente duplicado", async () => {
    const { professoraA, turmaA } = await criarCenarioEscolar();
    const primeira = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "Nova Estudante Fictícia",
    });
    const caminhoPrimeira = `/api/collections/${primeira.criada.body.coleta.collectionId}/participants/${primeira.pareada.body.participante.participantRef}/resolve`;
    const criada = await request(app)
        .post(caminhoPrimeira)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ createNew: true })
        .expect(201);
    const alunoCriado = await Student.findById(criada.body.aluno.studentId);
    assert.equal(alunoCriado.name, "Nova Estudante Fictícia");
    assert.equal(String(alunoCriado.groupId), String(turmaA._id));
    assert.equal(alunoCriado.enrollmentMode, "school");

    const segunda = await prepararColetaPareada({
        professora: professoraA,
        turma: turmaA,
        nomeParticipante: "  Nova Estudante Fictícia  ",
    });
    const caminhoSegunda = `/api/collections/${segunda.criada.body.coleta.collectionId}/participants/${segunda.pareada.body.participante.participantRef}/resolve`;
    const conflito = await request(app)
        .post(caminhoSegunda)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ createNew: true })
        .expect(409);
    assert.equal(conflito.body.codigo, "ALUNO_EQUIVALENTE");
    assert.equal(conflito.body.alunoSugerido.studentId, String(alunoCriado._id));
});

// Representa a forma canônica produzida pelo LUDUS Unity SDK em um build WebGL.
// Os valores são inteiramente fictícios e mantêm coordenadas dentro do viewport.
const sessaoSdkWebglDeTeste = (aluno) => ({
    schemaVersion: "1.0.0",
    captureMode: "sdk",
    source: "ludus-unity-sdk",
    sourceVersion: "0.1.0",
    ingestionMethod: "direct-api",
    capabilities: {
        clicks: true,
        mousePath: true,
        dragPath: false,
        screenshots: false,
        inactivity: false,
        focusEvents: false,
        phaseEvents: false,
        correctWrong: false,
        categoryEvents: false,
        customEvents: true,
    },
    sessionId: "sdk-webgl-sessao-ficticia",
    studentId: String(aluno._id),
    playerId: "Estudante Fictício do SDK",
    gameId: "ludus-ficticio",
    gameVersion: "1.0.0",
    platform: "WebGLPlayer",
    startedAt: "2026-07-27T20:50:17.625Z",
    endedAt: "2026-07-27T20:50:19.625Z",
    durationMs: 2000,
    viewport: {
        widthPx: 1123,
        heightPx: 702,
        coordinateUnit: "pixel",
        coordinateOrigin: "bottom-left",
    },
    metrics: {
        totalClicks: 2,
        totalCorrect: 0,
        totalWrong: 0,
        firstActionMs: 350,
        avgTimeBetweenActionsMs: 700,
        inactivityCount: 0,
        totalInactivityMs: 0,
    },
    clicks: [
        { x: 240, y: 180, timestamp: 350 },
        { x: 860, y: 510, timestamp: 1050 },
    ],
    mousePath: [
        { x: 200, y: 160, t: 300 },
        { x: 240, y: 180, t: 350 },
        { x: 860, y: 510, t: 1050 },
    ],
    dragPath: [],
    gameEvents: [
        {
            eventType: "CaptureContextStarted",
            timestamp: 0,
            payload: {
                displayName: "Atividade fictícia WebGL",
                contextKind: "activity",
            },
        },
    ],
    screenshots: [],
});

test("protege leituras por autenticacao e isola professoras", async () => {
    const { admin, professoraA, alunoA, alunoB } = await criarCenarioEscolar();
    await Session.create(sessaoDeTeste(alunoB, "aluno-b"));

    await request(app)
        .get(`/api/dashboard/summary/${alunoA._id}`)
        .expect(401);

    await request(app)
        .get(`/api/dashboard/summary/${alunoA._id}`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);

    await request(app)
        .get(`/api/dashboard/summary/${alunoB._id}`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(404);

    await request(app)
        .get("/api/sessions/sessao-teste-aluno-b")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(404);

    await request(app)
        .get("/api/sessions")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(403);

    const respostaAdmin = await request(app)
        .get("/api/sessions")
        .set("Authorization", `Bearer ${tokenDe(admin)}`)
        .expect(200);
    assert.equal(respostaAdmin.body.total, 1);
});

test("lista alunos acessiveis com os jogos realmente registrados", async () => {
    const { professoraA, alunoA, segundoAlunoA, alunoB } =
        await criarCenarioEscolar();
    await Session.create([
        sessaoDeTeste(alunoA, "visao-jogo-a-1"),
        sessaoDeTeste(alunoA, "visao-jogo-a-2"),
        {
            ...sessaoDeTeste(alunoA, "visao-jogo-b"),
            gameId: "outro-jogo",
        },
        sessaoDeTeste(alunoB, "visao-inacessivel"),
    ]);

    const resposta = await request(app)
        .get("/api/students/overview")
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);

    const aluno = resposta.body.alunos.find(
        (item) => item._id === String(alunoA._id),
    );
    const segundoAluno = resposta.body.alunos.find(
        (item) => item._id === String(segundoAlunoA._id),
    );

    assert.ok(aluno);
    assert.equal(aluno.totalSessoes, 3);
    assert.deepEqual(
        aluno.jogos
            .map((jogo) => [jogo.gameId, jogo.totalSessoes])
            .sort(),
        [
            ["jogo-teste", 2],
            ["outro-jogo", 1],
        ],
    );
    assert.ok(segundoAluno);
    assert.equal(segundoAluno.totalSessoes, 0);
    assert.deepEqual(segundoAluno.jogos, []);
    assert.equal(
        resposta.body.alunos.some(
            (item) => item._id === String(alunoB._id),
        ),
        false,
    );
});

test("preview nao grava e confirmacao impede importacao duplicada", async () => {
    const { professoraA, alunoA, segundoAlunoA } = await criarCenarioEscolar();
    const authorization = `Bearer ${tokenDe(professoraA)}`;
    const dados = jsonImportavel();

    const previewInicial = await request(app)
        .post(`/api/sessions/import/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ sessao: dados })
        .expect(200);
    assert.equal(previewInicial.body.preview.jaRegistrada, false);
    assert.equal(await Session.countDocuments(), 0);

    await request(app)
        .post(`/api/sessions/import/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ sessao: dados })
        .expect(201);
    assert.equal(await Session.countDocuments(), 1);

    const previewDuplicado = await request(app)
        .post(`/api/sessions/import/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ sessao: dados })
        .expect(200);
    assert.equal(previewDuplicado.body.preview.jaRegistrada, true);

    await request(app)
        .post(`/api/sessions/import/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ sessao: dados })
        .expect(409);
    assert.equal(await Session.countDocuments(), 1);

    await request(app)
        .post(`/api/sessions/import/${segundoAlunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ sessao: dados })
        .expect(201);
    assert.equal(await Session.countDocuments(), 2);
});

test("importacao de JSON sem vinculo tecnico associa ao aluno selecionado", async () => {
    const { professoraA, alunoA } = await criarCenarioEscolar();
    const dados = {
        ...sessaoSdkWebglDeTeste(alunoA),
        sessionId: "arquivo-sem-vinculo-tecnico",
        studentId: "000000000000000000000000",
        playerId: "Teste do tutorial",
    };

    await request(app)
        .post(`/api/sessions/import/${alunoA._id}/confirm`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ sessao: dados })
        .expect(201);

    const sessao = await Session.findOne({
        sourceSessionId: "arquivo-sem-vinculo-tecnico",
    });
    assert.equal(String(sessao.studentId), String(alunoA._id));
    assert.equal(sessao.playerId, alunoA.name);
});

test("importa outro jogo no mesmo aluno sem duplicar seu perfil", async () => {
    const { professoraA, alunoA } = await criarCenarioEscolar();
    const authorization = `Bearer ${tokenDe(professoraA)}`;
    const dados = {
        ...jsonImportavel(),
        sessionId: "arquivo-de-outro-jogo",
        gameId: "jogo-observacional",
        studentId: "000000000000000000000000",
    };

    const incompatibilidade = await request(app)
        .post(`/api/sessions/import/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ sessao: dados, gameId: "jogo-teste" })
        .expect(409);
    assert.equal(incompatibilidade.body.codigo, "JOGO_INCOMPATIVEL");
    assert.equal(
        incompatibilidade.body.jogoDetectado.gameId,
        "jogo-observacional",
    );

    await request(app)
        .post(`/api/sessions/import/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ sessao: dados, gameId: "jogo-observacional" })
        .expect(200);
    await request(app)
        .post(`/api/sessions/import/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ sessao: dados, gameId: "jogo-observacional" })
        .expect(201);

    const alunoAtualizado = await Student.findById(alunoA._id);
    assert.ok(alunoAtualizado.assignedGameIds.includes("jogo-observacional"));
    assert.equal(await Student.countDocuments({ name: alunoA.name }), 1);
    assert.equal(
        await Session.countDocuments({
            studentId: alunoA._id,
            gameId: "jogo-observacional",
        }),
        1,
    );
    assert.equal(
        await Game.countDocuments({ gameId: "jogo-observacional" }),
        1,
    );
});

test("previsualiza e importa lote multi-jogo sem fundir sessoes", async () => {
    const { professoraA, alunoA } = await criarCenarioEscolar();
    const authorization = `Bearer ${tokenDe(professoraA)}`;
    const lote = loteObservacionalDeTeste(alunoA.name);

    const preview = await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ lote })
        .expect(200);

    assert.equal(preview.body.preview.totalSessoes, 2);
    assert.equal(preview.body.preview.totalImportaveis, 2);
    assert.equal(preview.body.preview.totalJaRegistradas, 0);
    assert.equal(preview.body.preview.participante.nomeCoincide, true);
    assert.deepEqual(
        preview.body.preview.jogos.map((jogo) => jogo.gameId).sort(),
        ["jogo-observacional-a", "jogo-observacional-b"],
    );
    assert.equal(await Session.countDocuments(), 0);

    const confirmacao = await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ lote })
        .expect(201);

    assert.equal(confirmacao.body.totalImportadas, 2);
    assert.equal(confirmacao.body.totalErros, 0);
    assert.equal(await Session.countDocuments({ studentId: alunoA._id }), 2);
    assert.equal(await Student.countDocuments({ name: alunoA.name }), 1);
    assert.equal(
        await Game.countDocuments({
            gameId: { $in: ["jogo-observacional-a", "jogo-observacional-b"] },
        }),
        2,
    );

    const repeticao = await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ lote })
        .expect(200);

    assert.equal(repeticao.body.totalImportadas, 0);
    assert.equal(repeticao.body.totalJaRegistradas, 2);
    assert.equal(await Session.countDocuments({ studentId: alunoA._id }), 2);
});

test("lote com participante divergente exige confirmacao explicita", async () => {
    const { professoraA, alunoA } = await criarCenarioEscolar();
    const authorization = `Bearer ${tokenDe(professoraA)}`;
    const lote = loteObservacionalDeTeste("Outro Aluno Fictício");

    const preview = await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/preview`)
        .set("Authorization", authorization)
        .send({ lote })
        .expect(200);

    assert.equal(preview.body.preview.participante.nomeCoincide, false);
    assert.equal(preview.body.preview.participante.requerConfirmacao, true);

    const bloqueada = await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ lote })
        .expect(409);

    assert.equal(bloqueada.body.codigo, "PARTICIPANTE_DIVERGENTE");
    assert.equal(await Session.countDocuments(), 0);

    await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/confirm`)
        .set("Authorization", authorization)
        .send({ lote, confirmarNomeDiferente: true })
        .expect(201);
    assert.equal(await Session.countDocuments({ studentId: alunoA._id }), 2);
});

test("recusa lote adulterado e acesso a aluno de outra professora", async () => {
    const { professoraA, professoraB, alunoA } = await criarCenarioEscolar();
    const lote = loteObservacionalDeTeste(alunoA.name);

    await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/preview`)
        .set("Authorization", `Bearer ${tokenDe(professoraB)}`)
        .send({ lote })
        .expect(404);

    lote.campoNaoPermitido = "não deve ser aceito";
    await request(app)
        .post(`/api/sessions/import-batch/${alunoA._id}/preview`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .send({ lote })
        .expect(400);

    assert.equal(await Session.countDocuments(), 0);
});

test("remove somente sessao JSON autorizada e preserva registros protegidos", async () => {
    const {
        professoraA,
        professoraB,
        alunoA,
        alunoProtegido,
    } = await criarCenarioEscolar();
    const authorizationA = `Bearer ${tokenDe(professoraA)}`;
    const authorizationB = `Bearer ${tokenDe(professoraB)}`;

    const importada = await Session.create({
        ...sessaoDeTeste(alunoA, "importada-removivel"),
        ingestionMethod: "file-import",
    });
    const direta = await Session.create({
        ...sessaoDeTeste(alunoA, "direta-preservada"),
        ingestionMethod: "direct-api",
    });
    const protegida = await Session.create({
        ...sessaoDeTeste(alunoProtegido, "importada-protegida"),
        ingestionMethod: "file-import",
    });

    await request(app)
        .delete(`/api/sessions/${importada.sessionId}`)
        .expect(401);

    await request(app)
        .delete(`/api/sessions/${importada.sessionId}`)
        .set("Authorization", authorizationB)
        .expect(404);

    await request(app)
        .delete(`/api/sessions/${direta.sessionId}`)
        .set("Authorization", authorizationA)
        .expect(409);
    assert.ok(await Session.findById(direta._id));

    await request(app)
        .delete(`/api/sessions/${protegida.sessionId}`)
        .set("Authorization", authorizationA)
        .expect(403);
    assert.ok(await Session.findById(protegida._id));

    await request(app)
        .delete(`/api/sessions/${importada.sessionId}`)
        .set("Authorization", authorizationA)
        .expect(200);
    assert.equal(await Session.countDocuments({ _id: importada._id }), 0);
});

test("recebe sessao WebGL do SDK e disponibiliza dados para heatmap", async () => {
    const { professoraA, alunoA } = await criarCenarioEscolar();
    const sessaoWebgl = sessaoSdkWebglDeTeste(alunoA);

    const recebimento = await request(app)
        .post("/api/sessions")
        .send(sessaoWebgl)
        .expect(201);

    assert.equal(recebimento.body.sucesso, true);
    assert.equal(recebimento.body.sessionId, sessaoWebgl.sessionId);

    const sessaoSalva = await Session.findOne({
        sessionId: sessaoWebgl.sessionId,
    });
    assert.equal(String(sessaoSalva.studentId), String(alunoA._id));
    assert.equal(sessaoSalva.playerId, alunoA.name);
    assert.equal(sessaoSalva.platform, "WebGLPlayer");
    assert.equal(sessaoSalva.captureMode, "sdk");
    assert.equal(sessaoSalva.clicks.length, 2);
    assert.equal(sessaoSalva.mousePath.length, 3);

    const heatmap = await request(app)
        .get(`/api/dashboard/heatmap/${sessaoWebgl.sessionId}`)
        .set("Authorization", `Bearer ${tokenDe(professoraA)}`)
        .expect(200);

    assert.equal(heatmap.body.captureMode, "sdk");
    assert.equal(heatmap.body.viewport.widthPx, 1123);
    assert.equal(heatmap.body.clicks.length, 2);
    assert.equal(heatmap.body.mousePath.length, 3);
});

test("exclusao protegida preserva aluno e sessoes vinculadas", async () => {
    const { professoraA, alunoA, alunoProtegido } = await criarCenarioEscolar();
    const authorization = `Bearer ${tokenDe(professoraA)}`;
    await Session.create(sessaoDeTeste(alunoProtegido, "protegido"));
    await Session.create(sessaoDeTeste(alunoA, "removivel"));

    await request(app)
        .delete(`/api/students/${alunoProtegido._id}`)
        .set("Authorization", authorization)
        .expect(403);
    assert.ok(await Student.findById(alunoProtegido._id));
    assert.equal(
        await Session.countDocuments({ studentId: alunoProtegido._id }),
        1,
    );

    await request(app)
        .delete(`/api/students/${alunoA._id}`)
        .set("Authorization", authorization)
        .expect(200);
    assert.equal(await Student.countDocuments({ _id: alunoA._id }), 0);
    assert.equal(await Session.countDocuments({ studentId: alunoA._id }), 0);
});
