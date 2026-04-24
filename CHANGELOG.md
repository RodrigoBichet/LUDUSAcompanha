# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.9.0] — 2026-04-21 — CRUD de turmas e alunos + perfil completo 🎉

### Adicionado

- `frontend/src/pages/Turmas.jsx` + `Turmas.css`
    - Listagem de turmas do professor com escola vinculada
    - Formulário inline para criar nova turma
    - Exclusão com confirmação
- `frontend/src/pages/DetalheTurma.jsx` + `DetalheTurma.css`
    - Listagem de alunos com avatar, idade e chips de TEA/condições
    - Formulário completo de cadastro de aluno
    - Campos: nome, data de nascimento, grau de suporte, outras condições, responsável, contato
- `frontend/src/pages/PerfilAluno.jsx` + `PerfilAluno.css`
    - Dados cadastrais completos com modo de edição
    - Indicador de desempenho automático (🟢 🟡 🔴) baseado na taxa de acerto
    - Última sessão em destaque com métricas rápidas
    - Histórico de anotações com autor, data e exclusão individual
    - Formulário de nova anotação com textarea
    - Histórico de sessões clicável
- `frontend/src/services/api.js` — novas funções
    - CRUD completo de schools, groups, students
    - `adicionarAnotacao`, `deletarAnotacao`
- `frontend/src/components/layout/Sidebar.jsx` — link Minhas Turmas
- `frontend/src/App.jsx` — rotas `/turmas`, `/turmas/:id`, `/aluno/:id`

### Atualizado

- `backend/src/models/Student.js`
    - Novos campos: `supportLevel`, `otherConditions`, `guardianName`, `guardianContact`
    - Sub-schema `AnotacaoSchema` com texto, autorId, autorNome e timestamps
- `backend/src/controllers/studentsController.js`
    - `atualizarAluno` — agora salva todos os campos novos
    - `adicionarAnotacao` — cria anotação com nome do autor
    - `deletarAnotacao` — remove anotação por ID
    - Fix: `returnDocument: 'after'` substituindo `new: true` (deprecation warning)
- `backend/src/routes/students.js` — rotas de anotações adicionadas

### Testado

- Criar turma e listar corretamente
- Cadastrar aluno com todos os campos
- Editar dados do aluno — todos os campos salvando
- Adicionar e deletar anotações com autor e data
- Indicador de desempenho calculado automaticamente

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuário logado e botão sair
- Rotas protegidas por JWT

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups, students
- Rotas públicas `/api/unity` para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

- Models: User, School, Group, Student
- Auth JWT, middleware, script criarAdmin

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout, Home, PerfilJogador, DetalhesSessao

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de players e dashboard

---

## [0.3.0] — 2026-04-17

### Adicionado

- Controller e rotas de sessions

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

- `[1.0.0]` — Funcionalidades pedagógicas: alertas e geração de PDF
- `[1.1.0]` — Área Admin: cadastro de professores e escolas
- `[1.2.0]` — Responsividade + design final da designer
- `[1.3.0]` — Sistema publicado e testado nas escolas
