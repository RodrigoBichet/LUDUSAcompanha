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
