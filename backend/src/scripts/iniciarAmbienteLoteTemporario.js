// =============================================================================
// iniciarAmbienteLoteTemporario.js
// Ambiente manual efêmero para validar a importação de lotes sem usar Atlas.
// Todo o banco é removido quando este processo é encerrado.
// =============================================================================

process.env.JWT_SECRET = "segredo-local-exclusivo-do-teste-manual-de-lote";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");
const Institution = require("../models/Institution");
const Group = require("../models/Group");
const Student = require("../models/Student");

const PORTA = 3000;
const EMAIL = "professora.lote@ludus.local";
const SENHA = "Teste@2026";
const NOME_ALUNO = "Aluno Fictício Teste";

let mongoTemporario;
let servidorHttp;
let encerrando = false;

const encerrar = async () => {
    if (encerrando) return;
    encerrando = true;

    console.log("\n[LUDUS] Encerrando e apagando o banco temporário...");

    if (servidorHttp) {
        await new Promise((resolve) => servidorHttp.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoTemporario) await mongoTemporario.stop();
};

const prepararDadosFicticios = async () => {
    const professora = await User.create({
        name: "Professora de teste do lote",
        email: EMAIL,
        password: SENHA,
        role: "professor",
    });
    const instituicao = await Institution.create({
        name: "Escola temporária de teste",
        city: "Cidade fictícia",
        ownerUserId: professora._id,
    });
    professora.institutionId = instituicao._id;
    await professora.save();

    const turma = await Group.create({
        name: "Turma temporária de teste",
        institutionId: instituicao._id,
        professorId: professora._id,
    });
    await Student.create({
        name: NOME_ALUNO,
        groupId: turma._id,
        institutionId: instituicao._id,
        ownerUserId: professora._id,
        enrollmentMode: "school",
        deletionProtected: false,
    });
};

const iniciar = async () => {
    mongoTemporario = await MongoMemoryServer.create({
        instance: { dbName: "ludus_lote_manual_temporario" },
    });
    await mongoose.connect(mongoTemporario.getUri());
    await prepararDadosFicticios();

    servidorHttp = app.listen(PORTA, () => {
        console.log("");
        console.log("============================================================");
        console.log(" LUDUS — AMBIENTE TEMPORÁRIO DE TESTE DO LOTE");
        console.log(" Banco em memória: nenhum acesso ao MongoDB Atlas");
        console.log(` API: http://localhost:${PORTA}`);
        console.log(` Login: ${EMAIL}`);
        console.log(` Senha: ${SENHA}`);
        console.log(` Aluno fictício: ${NOME_ALUNO}`);
        console.log(" Ao fechar este CMD, todos os dados serão apagados.");
        console.log("============================================================");
        console.log("");
    });
};

process.on("SIGINT", async () => {
    await encerrar();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await encerrar();
    process.exit(0);
});

iniciar().catch(async (erro) => {
    console.error("[LUDUS] Falha ao iniciar ambiente temporário:", erro.message);
    await encerrar();
    process.exit(1);
});
