# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2026-04-25 — Alertas pedagógicos + refatoração 🎉

### Adicionado

- `backend/src/controllers/dashboardController.js` — alertas pedagógicos automáticos
    - `GET /api/dashboard/alerts/:playerId` analisa últimas 10 sessões
    - Alertas: taxa baixa/regular, inatividade alta/média, sem jogar, categoria problemática, evolução positiva
- `backend/src/controllers/sessionsController.js`
    - `GET /api/sessions/player/:playerId` — busca sessões por nome do jogador
- `frontend/src/pages/PerfilAluno.jsx`
    - Gráfico de evolução temporal com Recharts
    - Categorias jogadas com tradução (Fase01→Ações, etc.)
    - Função `traduzirCategoria` para mapeamento de nomes
- `frontend/src/index.css` — estilos globais para `btn-voltar` e `item-sessao`

### Removido

- `backend/src/controllers/playersController.js` — collection players substituída por students
- `backend/src/models/Player.js` — model legado removido
- `backend/src/routes/players.js` — rotas legadas removidas
- `frontend/src/pages/PerfilJogador.jsx` — substituído por PerfilAluno
- `frontend/src/pages/PerfilJogador.css`

### Corrigido

- `backend/src/controllers/studentsController.js`
    - `atualizarAluno` agora sincroniza `playerId` em todas as sessões quando nome muda
    - `criarAluno` salva todos os campos: `supportLevel`, `otherConditions`, `guardianName`, `guardianContact`
    - `returnDocument: 'after'` substituindo `new: true` deprecado
- `frontend/src/pages/Home.jsx` — busca alunos cadastrados em vez de players das sessões
- `frontend/src/services/api.js` — `historicoJogador` aponta para nova rota `/sessions/player/:playerId`

### Testado

- Alerta de inatividade disparando corretamente com média ≥ 3 por sessão
- Renomear aluno sincroniza sessões automaticamente no banco
- Categorias exibidas com nomes amigáveis no perfil do aluno
- Gráfico de evolução aparecendo quando há 2+ sessões

---

## [0.9.0] — 2026-04-21

### Adicionado — CRUD de turmas e alunos

- Turmas, DetalheTurma, PerfilAluno com dados cadastrais e anotações
- Student model com supportLevel, otherConditions, guardianName, guardianContact
- Histórico de anotações com autor e data

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuário logado e botão sair

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas públicas `/api/unity` para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

- Models: User, School, Group, Student
- Auth JWT, middleware, script criarAdmin

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout, Home, DetalhesSessao
- Heatmap em Canvas e timeline de eventos

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de sessions e dashboard

---

## [0.3.0] — 2026-04-17

### Adicionado

- Controller e rotas de sessions

---

## [0.2.0] — 2026-04-17

### Adicionado

- Models: Session, Institution

---

## [0.1.0] — 2026-04-15

### Adicionado

- Setup inicial: Express + MongoDB Atlas + nodemon

---

## Próximas versões planejadas

- `[1.1.0]` — Exibir alertas no frontend (perfil do aluno e home)
- `[1.2.0]` — Geração de PDF formal por aluno
- `[1.3.0]` — Área Admin: cadastro de professores e escolas
- `[1.4.0]` — Responsividade + design final da designer
- `[1.5.0]` — Sistema publicado e testado nas escolas
