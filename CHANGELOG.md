# Changelog — LUDUS Acompanha Backend

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.4.0] — 2026-04-18 — Backend Completo 🎉

### Adicionado

- `src/controllers/playersController.js` — lógica dos jogadores
    - `criarJogador` — cadastra novo jogador no banco
    - `listarJogadores` — retorna jogadores cadastrados + nomes únicos nas sessões
    - `buscarJogador` — busca jogador por ID
    - `historicoJogador` — retorna todas as sessões de um jogador pelo nome
- `src/controllers/dashboardController.js` — lógica do dashboard pedagógico
    - `resumoJogador` — consolida métricas de todas as sessões: totalClicks, totalCorrect, totalWrong, taxaAcerto, totalDuracaoMs, categorias jogadas e evolução temporal
    - `heatmapSessao` — retorna mousePath e clicks de uma sessão para geração de heatmap
- `src/routes/players.js` — rotas de jogadores
    - `POST /api/players`, `GET /api/players`, `GET /api/players/:id`, `GET /api/players/:playerId/sessions`
- `src/routes/dashboard.js` — rotas do dashboard
    - `GET /api/dashboard/summary/:playerId`, `GET /api/dashboard/heatmap/:sessionId`
- `src/app.js` atualizado — todas as rotas conectadas

### Marco

- **Backend completo** — todas as rotas implementadas e testadas
- **Fluxo end-to-end validado:** Unity → SDK → JSON → Node.js → MongoDB Atlas → API REST

### Testado

- `GET /api/players` retornando jogadores cadastrados e nomes nas sessões
- `GET /api/dashboard/summary/rodrigo teste 04` retornando `taxaAcerto: 80.0%` com evolução temporal
- `GET /api/dashboard/heatmap/:sessionId` retornando mousePath completo para heatmap

---

## [0.3.0] — 2026-04-17

### Adicionado

- `src/controllers/sessionsController.js` — criarSessao, listarSessoes, buscarSessao
- `src/routes/sessions.js` — POST e GET /api/sessions, GET /api/sessions/:sessionId

### Corrigido

- Connection string trocada para formato direto — resolve problema de DNS em algumas redes

### Testado

- `GET /api/sessions` retornando lista corretamente

---

## [0.2.0] — 2026-04-17

### Adicionado

- `src/models/Session.js` — espelha LudusSession com sub-schemas, `unique: true` e `timestamps`
- `src/models/Player.js` — jogador com referência à instituição
- `src/models/Institution.js` — instituição de ensino

---

## [0.1.0] — 2026-04-15

### Adicionado

- `server.js`, `src/app.js`, `src/config/database.js`
- Express com CORS, JSON middleware e health check
- `.env.example`, `.gitignore`, `package.json`
- Dependências: express, mongoose, dotenv, cors, nodemon

### Testado

- Servidor na porta 3000, MongoDB Atlas conectado, health check funcionando

---

## Próximas versões planejadas

- `[1.0.0]` — Backend integrado ao Dashboard React
- `[1.1.0]` — Análise ML com Python + scikit-learn conectada à API
