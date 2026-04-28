// =============================================================================
// api.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Camada de serviço — centraliza todas as chamadas à API do backend.
// =============================================================================

import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api",
});

// -------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------
export const resumoJogador = (playerId) =>
    api.get(`/dashboard/summary/${encodeURIComponent(playerId)}`);
export const heatmapSessao = (sessionId) =>
    api.get(`/dashboard/heatmap/${sessionId}`);

// -------------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------------
export const buscarSessao = (sessionId) => api.get(`/sessions/${sessionId}`);

// -------------------------------------------------------------------------
// Schools
// -------------------------------------------------------------------------
export const listarEscolas = () => api.get("/schools");
export const criarEscola = (dados) => api.post("/schools", dados);
export const atualizarEscola = (id, dados) => api.put(`/schools/${id}`, dados);
export const deletarEscola = (id) => api.delete(`/schools/${id}`);

// -------------------------------------------------------------------------
// Groups (Turmas)
// -------------------------------------------------------------------------
export const listarTurmas = () => api.get("/groups");
export const criarTurma = (dados) => api.post("/groups", dados);
export const buscarTurma = (id) => api.get(`/groups/${id}`);
export const atualizarTurma = (id, dados) => api.put(`/groups/${id}`, dados);
export const deletarTurma = (id) => api.delete(`/groups/${id}`);

// -------------------------------------------------------------------------
// Students (Alunos)
// -------------------------------------------------------------------------
export const listarAlunos = (groupId) =>
    api.get(`/students?groupId=${groupId}`);
export const criarAluno = (dados) => api.post("/students", dados);
export const buscarAluno = (id) => api.get(`/students/${id}`);
export const atualizarAluno = (id, dados) => api.put(`/students/${id}`, dados);
export const deletarAluno = (id) => api.delete(`/students/${id}`);
export const adicionarAnotacao = (id, texto) =>
    api.post(`/students/${id}/anotacoes`, { texto });
export const deletarAnotacao = (id, anotacaoId) =>
    api.delete(`/students/${id}/anotacoes/${anotacaoId}`);

export const historicoJogador = (playerId) =>
    api.get(`/sessions/player/${encodeURIComponent(playerId)}`);

// -------------------------------------------------------------------------
// Alertas
// -------------------------------------------------------------------------
export const alertasAluno = (playerId) =>
    api.get(`/dashboard/alerts/${encodeURIComponent(playerId)}`);

// -------------------------------------------------------------------------
// Users (Usuários — apenas admin)
// -------------------------------------------------------------------------
export const listarUsuarios = () => api.get("/users");
export const deletarUsuario = (id) => api.delete(`/users/${id}`);

export const atualizarUsuario = (id, dados) => api.put(`/users/${id}`, dados);
export const atualizarPerfil = (dados) => api.put("/auth/perfil", dados);

export default api;
