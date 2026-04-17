# Changelog — LUDUS Acompanha Backend

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.2.0] — 2026-04-17

### Adicionado

- `src/models/Session.js` — model Mongoose da sessão de jogo
    - Espelha exatamente a estrutura da `LudusSession` gerada pelo SDK Unity
    - Sub-schemas: `MetricasSchema`, `CliqueSchema`, `PathPointSchema`, `GameEventSchema`
    - `_id: false` nos sub-schemas — evita IDs desnecessários dentro dos arrays
    - `sessionId` com `unique: true` — garante que não haverá sessões duplicadas
    - `timestamps: true` — adiciona `createdAt` e `updatedAt` automaticamente
- `src/models/Player.js` — model Mongoose do jogador
    - Campos: `name`, `institutionId` (ref à Institution), `notes`
    - `timestamps: true`
- `src/models/Institution.js` — model Mongoose da instituição de ensino
    - Campos: `name`, `city`
    - `timestamps: true`

---

## [0.1.0] — 2026-04-15

### Adicionado

- `server.js` — ponto de entrada do servidor
    - Carrega variáveis de ambiente via `dotenv`
    - Conecta ao MongoDB e inicia o Express na porta configurada
- `src/app.js` — configuração do Express
    - Middleware `cors` para permitir requisições do Unity e do Dashboard
    - Middleware `express.json()` para interpretar JSON no corpo das requisições
    - Rota de health check `GET /` retornando status e versão da API
- `src/config/database.js` — conexão com MongoDB Atlas via Mongoose
    - Encerra o processo com `process.exit(1)` se a conexão falhar
- `.env.example` — modelo de variáveis de ambiente para novos desenvolvedores
- `.gitignore` — exclui `node_modules/` e `.env` do versionamento

### Dependências instaladas

- `express`, `mongoose`, `dotenv`, `cors`, `nodemon`

### Testado

- Servidor iniciando corretamente na porta 3000
- MongoDB Atlas conectado com sucesso
- Health check `GET /` retornando `{ status: 'ok' }`

---

## Próximas versões planejadas

- `[0.3.0]` — Rotas e Controllers: sessions, players, dashboard
- `[0.4.0]` — Integração com o SDK Unity testada end-to-end
- `[1.0.0]` — Backend completo conectado ao dashboard
