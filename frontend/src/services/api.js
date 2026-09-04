// =============================================================================
// api.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Camada de serviço — centraliza todas as chamadas à API do backend.
// =============================================================================

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
});

export const cadastrarConta = (dados) => api.post("/auth/register", dados);
export const confirmarEmail = (token) => api.post("/auth/confirmar-email", { token });
export const reenviarConfirmacao = (email) => api.post("/auth/reenviar-confirmacao", { email });
export const solicitarRedefinicaoSenha = (email) => api.post("/auth/esqueci-senha", { email });
export const redefinirSenha = (token, password) => api.post("/auth/redefinir-senha", { token, password });

const montarQueryJogo = (gameId) => {
    if (!gameId || gameId === "todos") return "";

    return `?gameId=${encodeURIComponent(gameId)}`;
};

// -------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------
export const resumoAluno = (studentId, gameId) =>
    api.get(
        `/dashboard/summary/${encodeURIComponent(studentId)}${montarQueryJogo(gameId)}`,
    );

export const heatmapSessao = (sessionId) =>
    api.get(`/dashboard/heatmap/${sessionId}`);

// -------------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------------
export const buscarSessao = (sessionId) => api.get(`/sessions/${sessionId}`);
export const previsualizarImportacaoSessao = (studentId, sessao, gameId) =>
    api.post(`/sessions/import/${encodeURIComponent(studentId)}/preview`, {
        sessao,
        gameId,
    });
export const confirmarImportacaoSessao = (studentId, sessao, gameId) =>
    api.post(`/sessions/import/${encodeURIComponent(studentId)}/confirm`, {
        sessao,
        gameId,
    });
export const previsualizarImportacaoLote = (studentId, lote) =>
    api.post(`/sessions/import-batch/${encodeURIComponent(studentId)}/preview`, {
        lote,
    });
export const confirmarImportacaoLote = (
    studentId,
    lote,
    confirmarNomeDiferente = false,
) =>
    api.post(`/sessions/import-batch/${encodeURIComponent(studentId)}/confirm`, {
        lote,
        confirmarNomeDiferente,
    });
export const removerSessaoImportada = (sessionId) =>
    api.delete(`/sessions/${encodeURIComponent(sessionId)}`);

// -------------------------------------------------------------------------
// Institutions (Instituições)
// -------------------------------------------------------------------------
export const listarInstituicoes = () => api.get("/institutions");
export const criarInstituicao = (dados) => api.post("/institutions", dados);
export const atualizarInstituicao = (id, dados) =>
    api.put(`/institutions/${id}`, dados);
export const deletarInstituicao = (id) => api.delete(`/institutions/${id}`);

// -------------------------------------------------------------------------
// Groups (Turmas)
// -------------------------------------------------------------------------
export const listarTurmas = () => api.get("/groups");
export const criarTurma = (dados) => api.post("/groups", dados);
export const buscarTurma = (id) => api.get(`/groups/${id}`);
export const atualizarTurma = (id, dados) => api.put(`/groups/${id}`, dados);
export const deletarTurma = (id) => api.delete(`/groups/${id}`);

// -------------------------------------------------------------------------
// Coletas observacionais
// -------------------------------------------------------------------------
export const listarColetas = () => api.get("/collections");
export const listarRecebimentosColeta = (collectionId) =>
    api.get(`/collections/${encodeURIComponent(collectionId)}/submissions`);
export const resolverParticipanteColeta = (
    collectionId,
    participantRef,
    dados,
) =>
    api.post(
        `/collections/${encodeURIComponent(collectionId)}/participants/${encodeURIComponent(participantRef)}/resolve`,
        dados,
    );
export const criarColeta = (dados) => api.post("/collections", dados);
export const importarSessoesColeta = (collectionId, participantRef, receiptIds) =>
    api.patch(
        `/collections/${encodeURIComponent(collectionId)}/participants/${encodeURIComponent(participantRef)}/import`,
        { receiptIds },
    );
export const revogarColeta = (collectionId) =>
    api.patch(`/collections/${encodeURIComponent(collectionId)}/revoke`);

// -------------------------------------------------------------------------
// Students (Alunos)
// -------------------------------------------------------------------------
export const listarAlunos = (groupId) =>
    api.get(`/students?groupId=${groupId}`);
export const listarVisaoGeralAlunos = () => api.get("/students/overview");
export const criarAluno = (dados) => api.post("/students", dados);
export const listarAlunosIndividuais = () => api.get("/students/individual");
export const criarAlunoIndividual = (dados) =>
    api.post("/students/individual", dados);
export const listarAlunosPorJogo = (gameId) =>
    api.get(`/students/for-game/${encodeURIComponent(gameId)}`);
export const buscarAluno = (id) => api.get(`/students/${id}`);
export const atualizarAluno = (id, dados) => api.put(`/students/${id}`, dados);
export const deletarAluno = (id) => api.delete(`/students/${id}`);
export const adicionarAnotacao = (id, texto) =>
    api.post(`/students/${id}/anotacoes`, { texto });
export const deletarAnotacao = (id, anotacaoId) =>
    api.delete(`/students/${id}/anotacoes/${anotacaoId}`);

export const solicitarCaptura = (id, ativo = true) =>
    api.patch(`/students/${id}/solicitar-captura`, { ativo });

export const historicoAluno = (studentId, gameId) =>
    api.get(
        `/sessions/student/${encodeURIComponent(studentId)}${montarQueryJogo(gameId)}`,
    );

// -------------------------------------------------------------------------
// Alertas
// -------------------------------------------------------------------------
export const alertasAluno = (studentId, gameId) =>
    api.get(
        `/dashboard/alerts/${encodeURIComponent(studentId)}${montarQueryJogo(gameId)}`,
    );

// -------------------------------------------------------------------------
// Users (Usuários — apenas admin)
// -------------------------------------------------------------------------
export const listarUsuarios = () => api.get("/users");
export const criarUsuario = (dados) => api.post("/users", dados);
export const deletarUsuario = (id) => api.delete(`/users/${id}`);

export const atualizarUsuario = (id, dados) => api.put(`/users/${id}`, dados);
export const recusarSolicitacaoInstituicao = (id, reason) =>
    api.patch(`/users/${id}/institution-request/reject`, { reason });
export const atualizarPerfil = (dados) => api.put("/auth/perfil", dados);
export const atualizarSolicitacaoInstituicao = (dados) =>
    api.put("/auth/institution-request", dados);

// -------------------------------------------------------------------------
// Jogos
// -------------------------------------------------------------------------
export const listarJogos = () => api.get("/games");
export const criarJogo = (dados) => api.post("/games", dados);
export const criarJogoDetectado = (dados) => api.post("/games/detected", dados);
export const atualizarJogo = (id, dados) => api.patch(`/games/${id}`, dados);
export const arquivarJogo = (id) => api.delete(`/games/${id}`);

export default api;
