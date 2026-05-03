# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.5.0] — 2026-05-02 — Fix bug de sessão + histórico com categoria

### Corrigido

- `LudusMonitor.cs` — adiciona campo `_currentPlayerId` para persistir jogador entre sessões
- `LudusMonitor.cs` — adiciona método `DefinirJogador()` — registra jogador sem iniciar sessão
- `LudusMonitor.cs` — simplifica `ReiniciarSessao()` — remove `EndSession()` automático que gerava sessão extra vazia
- `LudusGameEvents.cs` — adiciona `DefinirJogador()` — API pública para tela de identificação
- `LudusGameEvents.cs` — adiciona `NovaSessaoCategoria()` — reinicia sessão e registra categoria
- `Menu.cs` — substitui chamada de `CategorySelected()` por `NovaSessaoCategoria()` ao selecionar categoria
- Tela de identificação — substitui `StartSession()` por `DefinirJogador()`, separando identificação do início de sessão

### Adicionado

- `PerfilAluno.jsx` — função `extrairCategoria()` — lê `gameEvents` para obter o nome da categoria de cada sessão
- `PerfilAluno.jsx` — card do histórico de sessões exibe categoria em destaque e data em tamanho secundário
- `PerfilAluno.css` — classes `.sessao-categoria` e `.sessao-data-menor`
- `DetalhesSessao.jsx` — Header dinâmico exibe nome da categoria da sessão no título da página

---

## [1.4.0] — 2026-04-29 — Refactor: Escolas renomeadas para Instituições

### Alterado

- `backend/src/models/School.js` → `Institution.js` — model renomeado
- `backend/src/controllers/schoolsController.js` → `institutionsController.js`
- `backend/src/routes/schools.js` → `institutions.js`
- `/api/schools` → `/api/institutions` em `app.js`
- `User.js` e `Group.js` — `schoolId` → `institutionId`, ref `"School"` → `"Institution"`
- `groupsController.js` — filtro e populate atualizados para `institutionId`
- `authController.js` — `schoolId` → `institutionId` em registro, login, perfil e atualizarPerfil
- `usersController.js` — `schoolId` → `institutionId` em listar e atualizar
- `unityController.js` — `School` → `Institution`, `schoolId` → `institutionId`
- `unity.js` (routes) — parâmetro `:schoolId` → `:institutionId`
- `frontend/src/services/api.js` — funções `listarEscolas`, `criarEscola`, etc. → `listarInstituicoes`, `criarInstituicao`, etc.; URL `/schools` → `/institutions`
- `frontend/src/pages/GerenciarEscolas.jsx` → `GerenciarInstituicoes.jsx` — todos os labels e variáveis atualizados
- `frontend/src/pages/GerenciarUsuarios.jsx` — `listarEscolas` → `listarInstituicoes`, `schoolId` → `institutionId`
- `frontend/src/pages/Turmas.jsx` — `listarEscolas` → `listarInstituicoes`, `schoolId` → `institutionId`
- `frontend/src/components/layout/Sidebar.jsx` — "Escolas" → "Instituições", rota `/admin/escolas` → `/admin/instituicoes`
- `frontend/src/App.jsx` — import e rota atualizados

---

## [1.3.0] — 2026-04-28 — Área Admin completa + tela de perfil do usuário

### Adicionado

- `frontend/src/components/shared/RotaAdmin.jsx` — proteção de rotas exclusivas para admin
- `frontend/src/pages/GerenciarEscolas.jsx` — CRUD completo de escolas (listar, criar, editar, remover)
- `frontend/src/pages/GerenciarUsuarios.jsx` — CRUD completo de usuários (listar, criar, editar, remover)
    - Campo senha oculto no modo edição — troca de senha apenas pelo próprio usuário
    - Vínculo de instituição ao criar/editar professor
- `frontend/src/pages/Perfil.jsx` — tela de perfil acessível por qualquer usuário logado
    - Edição de nome e email
    - Troca de senha com validação de senha atual e confirmação
    - Atualização reflete na sidebar sem precisar relogar
- `backend/src/controllers/usersController.js` — listar, atualizar e deletar usuários
- `backend/src/routes/users.js` — rotas protegidas por autenticação + admin
- `PUT /api/users/:id` — admin edita qualquer usuário
- `PUT /api/auth/perfil` — usuário edita o próprio perfil com mensagem dinâmica
- Menu admin na sidebar visível apenas para `role === 'admin'`
- Card de usuário na sidebar vira link clicável para `/perfil`
- Classes globais adicionadas ao `index.css`: `btn-primario`, `btn-secundario`, `campo-input`, `campo-grupo`, `campo-label`, `badge`, `secao-titulo`, `estado-vazio`, `spinner`, etc.

### Alterado

- `frontend/src/contexts/AuthContext.jsx` — `setUsuario` exposto no Provider
- `frontend/src/components/layout/Sidebar.jsx` — menu admin condicional + card de usuário como NavLink
- `frontend/src/services/api.js` — funções `listarUsuarios`, `deletarUsuario`, `atualizarUsuario`, `atualizarPerfil`
- `frontend/src/App.jsx` — rotas `/admin/escolas`, `/admin/usuarios`, `/perfil`
- `backend/src/controllers/authController.js` — adicionado `atualizarPerfil` com mensagem dinâmica
- `backend/src/routes/auth.js` — adicionado `PUT /api/auth/perfil`
- `backend/src/app.js` — registrado `/api/users`

---

## [1.2.0] — 2026-04-27 — Indicador de desempenho na Home

### Adicionado

- `frontend/src/pages/Home.jsx` — indicador visual de desempenho nos cards
    - Componente `CardAluno` com busca individual de resumo via `resumoJogador`
    - 🟢 Bom desempenho — taxa ≥ 70%
    - 🟡 Desempenho regular — taxa entre 50% e 70%
    - 🔴 Atenção necessária — taxa < 50%
    - Critério exibido explicitamente: "(taxa de acerto)"

---

## [1.1.0] — 2026-04-26 — Geração de PDF formal

### Adicionado

- `frontend/src/components/shared/RelatorioPDF.jsx`
    - Template formal com linguagem acessível para pais/responsáveis
    - Seções: dados do aluno, resumo de desempenho, categorias, alertas, histórico de sessões e anotações
    - Tabela de sessões com categoria, acertos, erros, taxa, duração, avaliação em estrelas e pausas
    - Alertas traduzidos para linguagem não técnica com explicações detalhadas
    - Nome do professor que gerou o relatório no cabeçalho
    - Aviso formal de que o documento não constitui diagnóstico
- `frontend/src/pages/PerfilAluno.jsx`
    - Botão "📄 Gerar Relatório PDF"
    - Geração via `html2pdf.js` com nome do arquivo incluindo nome do aluno e data
    - Template invisível na tela, renderizado apenas no PDF

---

## [1.0.0] — 2026-04-25

### Adicionado — Alertas pedagógicos + refatoração

- Alertas automáticos no backend: taxa baixa, inatividade, sem jogar, categoria problemática, evolução positiva
- Alertas exibidos no perfil do aluno com cores por severidade
- Fix: renomear aluno atualiza playerId em todas as sessões
- Fix: criarAluno salva todos os campos corretamente
- Home refatorada para buscar alunos cadastrados
- Rota GET /api/sessions/player/:playerId
- Categorias traduzidas no perfil do aluno
- Gráfico de evolução adicionado ao PerfilAluno
- Remoção da collection players legada

---

## [0.9.0] — 2026-04-21

### Adicionado — CRUD de turmas e alunos

- Turmas, DetalheTurma, PerfilAluno
- Student model com campos clínicos e histórico de anotações

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuário logado e botão sair

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas públicas /api/unity para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

- Models: User, School, Group, Student
- Auth JWT, middleware, script criarAdmin

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout, Home, DetalhesSessao, heatmap e timeline

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

- `[1.6.0]` — Edição de turmas no dashboard
- `[1.7.0]` — Responsividade + design final da designer
- `[1.8.0]` — Sistema publicado e testado nas instituições parceiras
- `[2.0.0]` — ML: K-Means + Árvore de Decisão
