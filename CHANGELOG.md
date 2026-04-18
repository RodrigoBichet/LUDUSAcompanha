# Changelog — LUDUS Acompanha Backend

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.3.0] — 2026-04-17

### Adicionado

- `src/controllers/sessionsController.js` — lógica das rotas de sessões
    - `criarSessao` — valida campos obrigatórios, verifica duplicatas e salva no MongoDB
    - `listarSessoes` — retorna até 50 sessões com campos essenciais, ordenadas por data
    - `buscarSessao` — retorna sessão completa pelo `sessionId`
    - Respostas padronizadas com campo `sucesso` e mensagens descritivas
- `src/routes/sessions.js` — rotas de sessões
    - `POST /api/sessions` — recebe sessão do Unity
    - `GET /api/sessions` — lista sessões
    - `GET /api/sessions/:sessionId` — busca sessão por ID
- `src/app.js` atualizado — rota `/api/sessions` conectada

### Corrigido

- Connection string do MongoDB Atlas trocada para formato direto (`mongodb://`) em vez de `mongodb+srv://` — resolve problema de DNS em algumas redes

### Testado

- `GET /api/sessions` retornando `{ sucesso: true, total: 0, sessoes: [] }` corretamente
- Servidor conectando ao Atlas com a nova connection string

---

## [0.2.0] — 2026-04-17

### Adicionado

- `src/models/Session.js` — model Mongoose da sessão de jogo
    - Espelha exatamente a estrutura da `LudusSession` gerada pelo SDK Unity
    - Sub-schemas: `MetricasSchema`, `CliqueSchema`, `PathPointSchema`, `GameEventSchema`
    - `_id: false` nos sub-schemas, `sessionId` com `unique: true`, `timestamps: true`
- `src/models/Player.js` — model do jogador com referência à instituição
- `src/models/Institution.js` — model da instituição de ensino

---

## [0.1.0] — 2026-04-15

### Adicionado

- `server.js` — ponto de entrada do servidor
- `src/app.js` — Express com middlewares `cors` e `express.json()`
- `src/config/database.js` — conexão com MongoDB Atlas via Mongoose
- `.env.example`, `.gitignore`, `package.json` configurados

### Testado

- Servidor iniciando na porta 3000, MongoDB conectado, health check funcionando

---

## Próximas versões planejadas

- `[0.4.0]` — Rotas e Controllers de Players e Dashboard
- `[0.5.0]` — Teste end-to-end Unity → Backend → MongoDB Atlas
- `[1.0.0]` — Backend completo conectado ao dashboard
