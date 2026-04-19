# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.6.0] — 2026-04-19 — Autenticação + Hierarquia 🎉

### Adicionado

- `backend/src/models/User.js` — usuário do sistema
    - Campos: name, email, password (bcrypt), role (admin/professor), schoolId
    - `pre save` para criptografar senha automaticamente
    - Método `compararSenha()` para validação no login
- `backend/src/models/School.js` — escola
- `backend/src/models/Group.js` — turma com referência à escola e professor
- `backend/src/models/Student.js` — aluno com referência à turma e observações
- `backend/src/middleware/auth.js` — middlewares de autenticação
    - `autenticar` — valida token JWT em rotas protegidas
    - `apenasAdmin` — restringe acesso a administradores
- `backend/src/controllers/authController.js`
    - `registrar` — cadastra novo usuário
    - `login` — autentica e retorna token JWT (7 dias)
    - `perfil` — retorna dados do usuário logado
- `backend/src/controllers/schoolsController.js`
    - `criarEscola` (admin), `listarEscolas`, `buscarEscola`
- `backend/src/controllers/groupsController.js`
    - `criarTurma`, `listarTurmas` (filtrado por escola do professor), `buscarTurma`
- `backend/src/controllers/studentsController.js`
    - `criarAluno`, `listarAlunos` (filtrado por turma), `buscarAluno` (com sessões)
- Rotas: `/api/auth`, `/api/schools`, `/api/groups`, `/api/students`
- `backend/src/scripts/criarAdmin.js` — script para criar primeiro administrador
- `docs/LUDUS_API.postman_collection.json` — collection exportada para testes reproduzíveis
    - Script de Post-request no login salva token automaticamente na variável de ambiente

### Dependências adicionadas

- `bcryptjs` — criptografia de senhas
- `jsonwebtoken` — geração e validação de tokens JWT

### Testado via Postman

- Login retornando token JWT válido
- Rota `/me` validando token e retornando perfil
- Criar escola: E. M. Silveira Martins (Bagé)
- Criar turma: Turma A vinculada à escola
- Criar aluno: João Silva vinculado à turma
- Hierarquia completa: Escola → Turma → Aluno funcionando

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout: Sidebar e Header reutilizáveis
- Home: lista de jogadores com avatar e badge
- PerfilJogador: métricas, categorias, gráfico de evolução e histórico
- DetalhesSessao: heatmap em Canvas e timeline de eventos
- Design provisório — será refatorado com material da designer

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de players e dashboard
- Fluxo end-to-end validado: Unity → SDK → MongoDB Atlas

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
- Health check, CORS, middlewares

---

## Próximas versões planejadas

- `[0.7.0]` — Refatorar tela Unity com seleção de aluno cadastrado
- `[0.8.0]` — Funcionalidades pedagógicas: alertas, observações, PDF
- `[0.9.0]` — Dashboard Admin + responsividade
- `[1.0.0]` — Sistema completo publicado e testado nas escolas
