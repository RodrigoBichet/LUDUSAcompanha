# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.7.0] — 2026-04-19 — CRUD completo + rotas Unity

### Adicionado

- `backend/src/controllers/unityController.js` — rotas públicas para o Unity
    - `listarEscolas` — GET /api/unity/schools
    - `listarTurmas` — GET /api/unity/groups/:schoolId
    - `listarAlunos` — GET /api/unity/students/:groupId
    - Sem autenticação JWT — acessível diretamente pelo Unity
- `backend/src/routes/unity.js` — rotas públicas montadas em `/api/unity`

### Atualizado

- `schoolsController` — adicionados `atualizarEscola` e `deletarEscola`
- `groupsController` — adicionados `atualizarTurma` e `deletarTurma`
- `studentsController` — adicionados `atualizarAluno` e `deletarAluno`
- Rotas de schools, groups e students atualizadas com PUT e DELETE

### Testado

- GET /api/unity/schools → retorna escolas cadastradas
- GET /api/unity/groups/:schoolId → retorna turmas da escola
- GET /api/unity/students/:groupId → retorna alunos da turma
- Cascata completa: Escola → Turma → Aluno funcionando

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

- Models: User, School, Group, Student
- Middleware: autenticar, apenasAdmin
- Auth: registro, login JWT, perfil
- CRUD inicial: schools, groups, students
- Script criarAdmin
- Collection Postman exportada em docs/

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout: Sidebar e Header
- Home, PerfilJogador, DetalhesSessao
- Heatmap em Canvas e timeline de eventos
- Design provisório

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de players e dashboard
- Fluxo end-to-end validado

---

## [0.3.0] — 2026-04-17

### Adicionado

- Controller e rotas de sessions
- Fix: connection string MongoDB formato direto

---

## [0.2.0] — 2026-04-17

### Adicionado

- Models: Session, Player, Institution

---

## [0.1.0] — 2026-04-15

### Adicionado

- Setup inicial: Express + MongoDB Atlas + nodemon

---

## Próximas versões planejadas

- `[0.8.0]` — Refatorar tela Unity com seleção em cascata (escola → turma → aluno)
- `[0.9.0]` — Funcionalidades pedagógicas: alertas, observações, PDF
- `[1.0.0]` — Dashboard Admin + CRUD no frontend + responsividade
- `[1.1.0]` — Sistema publicado e testado nas escolas
