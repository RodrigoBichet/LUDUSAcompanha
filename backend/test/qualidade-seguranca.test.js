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
        alunoA,
        segundoAlunoA,
        alunoB,
        alunoProtegido,
    };
};

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

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
});

after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
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
