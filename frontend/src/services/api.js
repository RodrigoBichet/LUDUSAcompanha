// =============================================================================
// api.js
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
// Orientador: Prof. Dr. Leomar Soares da Rosa Júnior
//
// Camada de serviço — centraliza todas as chamadas à API do backend.
// =============================================================================

import axios from "axios";

// URL base do backend — em desenvolvimento aponta para localhost
const api = axios.create({
    baseURL: "http://localhost:3000/api",
});

// -------------------------------------------------------------------------
// Players
// -------------------------------------------------------------------------

// Lista todos os jogadores (cadastrados + que já jogaram)
export const listarJogadores = () => api.get("/players");

// Busca histórico de sessões de um jogador pelo nome
export const historicoJogador = (playerId) =>
    api.get(`/players/${encodeURIComponent(playerId)}/sessions`);

// -------------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------------

// Busca métricas consolidadas de um jogador
export const resumoJogador = (playerId) =>
    api.get(`/dashboard/summary/${encodeURIComponent(playerId)}`);

// Busca dados de heatmap de uma sessão
export const heatmapSessao = (sessionId) =>
    api.get(`/dashboard/heatmap/${sessionId}`);

// -------------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------------

// Busca sessão completa por ID
export const buscarSessao = (sessionId) => api.get(`/sessions/${sessionId}`);

export default api;
