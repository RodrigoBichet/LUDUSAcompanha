# Changelog — LUDUS Acompanha

Todas as mudancas relevantes do projeto sao registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.10.1] — 2026-07-20 — Preparacao e publicacao inicial do ambiente online

### Adicionado

- `frontend/.env.example` com as variaveis publicas do Vite.
- `frontend/public/_redirects` para fallback de rotas SPA no Netlify.
- ambiente publicado no Render para API e no Netlify para dashboard.

### Alterado

- `frontend/src/services/api.js` passa a usar `VITE_API_URL`, mantendo fallback para o backend local.
- `frontend/src/pages/DetalhesSessao.jsx` passa a usar `VITE_BACKEND_ORIGIN` para carregar screenshots do backend publicado, mantendo fallback local.
- README e SETUP passam a documentar URLs, configuracao de deploy, validacoes e limitacoes atuais.

### Validado

- API publicada respondeu ao health check e conectou ao MongoDB Atlas.
- dashboard publicado abriu no Netlify, incluindo carregamento direto da rota `/login`.
- login de administrador e criacao de dados foram confirmados no ambiente publicado.

### Limitacoes conhecidas

- instancias Free do Render podem hibernar apos inatividade;
- screenshots ainda usam filesystem efemero do Render;
- CORS permanece aberto temporariamente;
- o jogo Unity ainda precisa de uma etapa propria para apontar ao backend publicado e gerar novo build WebGL.

---

## [1.10.0] — 2026-05-13 — Fluxo demonstrativo e leitura das sessoes

### Adicionado

- `seedDemo.js` — sessoes demonstrativas com erro seguido de acerto final na mesma fase
- `seedDemo.js` — screenshot ativado na sessao recente da Clara Demo para demonstrar o mapa com imagem
- `seedDemoRandom.js` — sessoes aleatorias tambem registram tentativa errada, erro, tentativa correta e acerto
- `DetalhesSessao.jsx` — compatibilidade com payloads `target` e `expected` dos dados demonstrativos
- `DetalhesSessao.jsx` — sequencia da sessao navegavel por fase
- `DetalhesSessao.css` — abas visuais para selecionar fases na sequencia da sessao
- `PerfilAluno.jsx` — card de captura com icone e destaque visual
- `PerfilAluno.css` — estilos do card destacado para salvar imagem da proxima sessao

### Alterado

- `DetalhesSessao.jsx` — cabeçalho da sessao deixa de exibir o ID tecnico e passa a mostrar aluno, data e duracao
- `DetalhesSessao.jsx` — linha do tempo foi substituida por uma leitura por fases, reduzindo excesso de scroll
- `DetalhesSessao.jsx` — campos tecnicos duplicados, como `target`, deixam de aparecer nos chips da sequencia
- `PerfilAluno.jsx` — texto da captura passa a indicar claramente que a imagem sera salva na proxima sessao

### Comportamento

- A demonstracao fica mais realista para professores e avaliadores, pois fases com erro mostram a tentativa incorreta e o acerto posterior.
- A sessao recente da Clara Demo ja apresenta imagens no mapa de interacoes, facilitando a demonstracao inicial.
- A tela de detalhes da sessao fica mais legivel, com navegacao por fase em vez de lista longa de eventos.
- O recurso de imagem no mapa de calor fica mais visivel no perfil do aluno.

---

## [1.9.0] — 2026-05-11 — Mapa de interacoes com arraste

### Adicionado

- `Session.js` — campo `dragPath[]` para armazenar pontos de inicio, movimento e fim do arraste
- `dashboardController.js` — retorno de `dragPath` no endpoint de heatmap da sessao
- `DetalhesSessao.jsx` — desenho de trajetos de arraste no mapa de interacoes
- `DetalhesSessao.jsx` — cores por fase no mapa geral para diferenciar as interacoes
- `DetalhesSessao.jsx` — linhas continuas para movimento e linhas tracejadas para arraste
- `DetalhesSessao.jsx` — marcadores menores para cliques, com destaque branco/vermelho
- `DetalhesSessao.jsx` — hover interativo em trajetos e cliques do mapa
- `DetalhesSessao.jsx` — clique no mapa geral para abrir diretamente a fase correspondente
- `DetalhesSessao.css` — legenda visual e indicadores coloridos nas abas de fase

### Alterado

- `DetalhesSessao.jsx` — mapa geral passa a combinar movimento, arraste e cliques por fase
- `DetalhesSessao.jsx` — sessoes sem imagem usam escala fixa de referencia para evitar zoom artificial
- `DetalhesSessao.jsx` — visualizacao por fase agora destaca o trajeto correspondente com maior intensidade no hover
- `DetalhesSessao.jsx` — legenda do mapa foi atualizada para explicar cores, linhas e cliques

### Comportamento

- O professor consegue diferenciar visualmente movimento livre, cliques e momentos em que o aluno segurou/arrastou um item.
- Cada fase possui uma cor propria no mapa geral.
- O arraste aparece tracejado para nao ser confundido com o caminho normal do mouse.
- Ao clicar em um trajeto ou clique no mapa geral, o dashboard abre a fase relacionada.
- Sessoes antigas sem `dragPath` continuam funcionando normalmente, exibindo apenas movimento, cliques e imagens quando existirem.

---

## [1.8.0] — 2026-05-07 — Home com selecao de jogo e fluxo por instituicao

### Adicionado

- `Home.jsx` — selecao de jogo na visao geral do dashboard
- `Home.jsx` — card para **Para Que Serve?** como jogo ativo
- `Home.jsx` — card para **Historietas Divertidas** como integracao futura bloqueada
- `Home.jsx` — listagem de instituicoes apos selecao do jogo acompanhado
- `Home.css` — estilos para selecao de jogo e cards de instituicao
- `Turmas.jsx` — leitura de `institutionId` e `gameId` via query string
- `Turmas.jsx` — filtro visual de turmas por instituicao ao acessar pela Home
- `DetalheTurma.jsx` — preservacao de `gameId` ao abrir o perfil do aluno
- `PerfilAluno.jsx` — preservacao de `gameId` ao abrir detalhes de sessao
- `DetalheTurma.jsx` — indicador visual do jogo acompanhado na tela da turma
- `api.js` — suporte opcional a `gameId` nas chamadas de resumo, historico e alertas

### Alterado

- `Home.jsx` — deixou de listar diretamente todos os alunos e passou a seguir o fluxo jogo -> instituicao -> turma -> aluno
- `Home.jsx` — passa a persistir o jogo selecionado na URL com `?gameId=...`
- `Turmas.jsx` — botao de voltar preserva `gameId` ao retornar para a Home
- `Turmas.jsx` — criacao de turma a partir de uma instituicao ja vem vinculada a essa instituicao
- `Turmas.jsx` — botao de cancelar foi movido para dentro do formulario de turma
- `DetalheTurma.jsx` — botao de cancelar foi movido para dentro do formulario de aluno
- `DetalheTurma.jsx` — formulario de aluno agora limpa os campos ao cancelar ou concluir cadastro
- `dashboardController.js` — resumo e alertas aceitam filtro opcional por `gameId`
- `sessionsController.js` — historico de sessoes por jogador aceita filtro opcional por `gameId`

### Comportamento

- O dashboard agora preserva o contexto do jogo acompanhado nas principais rotas:
    - `/?gameId=para-que-serve`
    - `/turmas?institutionId=...&gameId=para-que-serve`
    - `/turmas/:id?gameId=para-que-serve`
    - `/aluno/:id?gameId=para-que-serve`
    - `/sessao/:sessionId?gameId=para-que-serve`
- Quando `gameId` e informado, resumo, historico e alertas do aluno sao filtrados por jogo.
- Quando `gameId` nao e informado, as chamadas continuam funcionando no modo geral.
- A estrutura prepara a plataforma para receber novos jogos futuramente, sem implementar ainda cadastro completo de jogos.

---

## [1.7.0] — 2026-05-06 — Controle de origem e heatmap por fase

### Adicionado

- `Student.js` — campo `capturaSolicitadaOrigem` para registrar se a captura foi ativada pelo dashboard ou pela Unity
- `unityController.js` — rota publica para a Unity ligar/desligar captura de imagens da proxima sessao
- `DetalhesSessao.jsx` — abas **Geral** e por fase no mapa de interacoes
- `DetalhesSessao.jsx` — desenho do caminho do mouse e cliques sobre imagens capturadas por fase
- `RelatorioPDF.jsx` — secao "Mapas de Interacao" com resumo de sessoes com imagens e sessoes com mapa geral
- `PerfilAluno.jsx` — modal visual para avisos de captura, substituindo alerta nativo do navegador

### Alterado

- `studentsController.js` — solicitacoes feitas pelo dashboard agora respeitam a origem da captura
- `unityController.js` — solicitacoes feitas pela Unity agora respeitam a origem da captura
- `sessionsController.js` — reset automatico limpa `capturaSolicitada` e `capturaSolicitadaOrigem` apos receber sessao com imagens
- `PerfilAluno.jsx` — bloqueia alteracao no dashboard quando a captura foi ativada pelo jogo
- `DetalhesSessao.css` e `PerfilAluno.css` — estilos para abas de heatmap, badge de imagens e modal de captura

### Comportamento

- A captura vale para a proxima sessao/categoria.
- Dashboard e Unity nao sobrescrevem solicitacoes feitas pela outra origem.
- Sessoes sem imagens continuam exibindo o mapa geral de interacoes.

---

## [1.6.0] — 2026-05-06 — Solicitacao de imagens para mapa de calor

### Adicionado

- `Student.js` — campo `capturaSolicitada` para controlar captura sob demanda por aluno
- `Session.js` — sub-schema `FaseScreenshotSchema` e campo `screenshots[]` para armazenar caminhos das imagens por fase
- `studentsController.js` — metodo `solicitarCaptura()` para ativar ou cancelar captura de imagens
- `students.js` — rota `PATCH /api/students/:id/solicitar-captura`
- `sessionsController.js` — processamento de screenshots em base64, salvando arquivos em `backend/uploads/screenshots/`
- `app.js` — exposicao estatica de `/uploads` e limite maior para JSON com imagens
- `unityController.js` — retorno de `capturaSolicitada` na listagem publica de alunos consumida pela Unity
- `PerfilAluno.jsx` — bloco "Imagens no mapa de calor" para professor ativar/desativar a proxima captura
- `PerfilAluno.css` — estilos do bloco e botao de solicitacao de imagens
- `api.js` — funcao `solicitarCaptura()`
- `.gitignore` — ignora `backend/uploads/`, evitando versionar imagens geradas em runtime

### Comportamento

- A captura e sob demanda: apos o backend receber uma sessao com screenshots, `capturaSolicitada` volta automaticamente para `false`.

---

## [1.5.0] — 2026-05-02 — Fix bug de sessao + historico com categoria

### Corrigido

- `LudusMonitor.cs` — adiciona campo `_currentPlayerId` para persistir jogador entre sessoes
- `LudusMonitor.cs` — adiciona metodo `DefinirJogador()` — registra jogador sem iniciar sessao
- `LudusMonitor.cs` — simplifica `ReiniciarSessao()` — remove `EndSession()` automatico que gerava sessao extra vazia
- `LudusGameEvents.cs` — adiciona `DefinirJogador()` — API publica para tela de identificacao
- `LudusGameEvents.cs` — adiciona `NovaSessaoCategoria()` — reinicia sessao e registra categoria
- `Menu.cs` — substitui chamada de `CategorySelected()` por `NovaSessaoCategoria()` ao selecionar categoria
- Tela de identificacao — substitui `StartSession()` por `DefinirJogador()`, separando identificacao do inicio de sessao

### Adicionado

- `PerfilAluno.jsx` — funcao `extrairCategoria()` — le `gameEvents` para obter o nome da categoria de cada sessao
- `PerfilAluno.jsx` — card do historico de sessoes exibe categoria em destaque e data em tamanho secundario
- `PerfilAluno.css` — classes `.sessao-categoria` e `.sessao-data-menor`
- `DetalhesSessao.jsx` — Header dinamico exibe nome da categoria da sessao no titulo da pagina

---

## [1.4.0] — 2026-04-29 — Refactor: Escolas renomeadas para Instituicoes

### Alterado

- `backend/src/models/School.js` -> `Institution.js` — model renomeado
- `backend/src/controllers/schoolsController.js` -> `institutionsController.js`
- `backend/src/routes/schools.js` -> `institutions.js`
- `/api/schools` -> `/api/institutions` em `app.js`
- `User.js` e `Group.js` — `schoolId` -> `institutionId`, ref `"School"` -> `"Institution"`
- `groupsController.js` — filtro e populate atualizados para `institutionId`
- `authController.js` — `schoolId` -> `institutionId` em registro, login, perfil e atualizarPerfil
- `usersController.js` — `schoolId` -> `institutionId` em listar e atualizar
- `unityController.js` — `School` -> `Institution`, `schoolId` -> `institutionId`
- `unity.js` (routes) — parametro `:schoolId` -> `:institutionId`
- `frontend/src/services/api.js` — funcoes `listarEscolas`, `criarEscola`, etc. -> `listarInstituicoes`, `criarInstituicao`, etc.; URL `/schools` -> `/institutions`
- `frontend/src/pages/GerenciarEscolas.jsx` -> `GerenciarInstituicoes.jsx` — todos os labels e variaveis atualizados
- `frontend/src/pages/GerenciarUsuarios.jsx` — `listarEscolas` -> `listarInstituicoes`, `schoolId` -> `institutionId`
- `frontend/src/pages/Turmas.jsx` — `listarEscolas` -> `listarInstituicoes`, `schoolId` -> `institutionId`
- `frontend/src/components/layout/Sidebar.jsx` — "Escolas" -> "Instituicoes", rota `/admin/escolas` -> `/admin/instituicoes`
- `frontend/src/App.jsx` — import e rota atualizados

---

## [1.3.0] — 2026-04-28 — Area Admin completa + tela de perfil do usuario

### Adicionado

- `frontend/src/components/shared/RotaAdmin.jsx` — protecao de rotas exclusivas para admin
- `frontend/src/pages/GerenciarEscolas.jsx` — CRUD completo de escolas (listar, criar, editar, remover)
- `frontend/src/pages/GerenciarUsuarios.jsx` — CRUD completo de usuarios (listar, criar, editar, remover)
- `frontend/src/pages/Perfil.jsx` — tela de perfil acessivel por qualquer usuario logado
- `backend/src/controllers/usersController.js` — listar, atualizar e deletar usuarios
- `backend/src/routes/users.js` — rotas protegidas por autenticacao + admin
- `PUT /api/users/:id` — admin edita qualquer usuario
- `PUT /api/auth/perfil` — usuario edita o proprio perfil com mensagem dinamica
- Menu admin na sidebar visivel apenas para `role === 'admin'`
- Card de usuario na sidebar vira link clicavel para `/perfil`
- Classes globais adicionadas ao `index.css`

### Alterado

- `frontend/src/contexts/AuthContext.jsx` — `setUsuario` exposto no Provider
- `frontend/src/components/layout/Sidebar.jsx` — menu admin condicional + card de usuario como NavLink
- `frontend/src/services/api.js` — funcoes `listarUsuarios`, `deletarUsuario`, `atualizarUsuario`, `atualizarPerfil`
- `frontend/src/App.jsx` — rotas `/admin/escolas`, `/admin/usuarios`, `/perfil`
- `backend/src/controllers/authController.js` — adicionado `atualizarPerfil` com mensagem dinamica
- `backend/src/routes/auth.js` — adicionado `PUT /api/auth/perfil`
- `backend/src/app.js` — registrado `/api/users`

---

## [1.2.0] — 2026-04-27 — Indicador de desempenho na Home

### Adicionado

- `frontend/src/pages/Home.jsx` — indicador visual de desempenho nos cards
    - Componente `CardAluno` com busca individual de resumo via `resumoJogador`
    - Bom desempenho — taxa >= 70%
    - Desempenho regular — taxa entre 50% e 70%
    - Atencao necessaria — taxa < 50%
    - Criterio exibido explicitamente: "(taxa de acerto)"

---

## [1.1.0] — 2026-04-26 — Geracao de PDF formal

### Adicionado

- `frontend/src/components/shared/RelatorioPDF.jsx`
    - Template formal com linguagem acessivel para pais/responsaveis
    - Secoes: dados do aluno, resumo de desempenho, categorias, alertas, historico de sessoes e anotacoes
    - Tabela de sessoes com categoria, acertos, erros, taxa, duracao, avaliacao em estrelas e pausas
    - Alertas traduzidos para linguagem nao tecnica com explicacoes detalhadas
    - Nome do professor que gerou o relatorio no cabecalho
    - Aviso formal de que o documento nao constitui diagnostico
- `frontend/src/pages/PerfilAluno.jsx`
    - Botao "Gerar Relatorio PDF"
    - Geracao via `html2pdf.js` com nome do arquivo incluindo nome do aluno e data
    - Template invisivel na tela, renderizado apenas no PDF

---

## [1.0.0] — 2026-04-25

### Adicionado — Alertas pedagogicos + refatoracao

- Alertas automaticos no backend: taxa baixa, inatividade, sem jogar, categoria problematica, evolucao positiva
- Alertas exibidos no perfil do aluno com cores por severidade
- Fix: renomear aluno atualiza playerId em todas as sessoes
- Fix: criarAluno salva todos os campos corretamente
- Home refatorada para buscar alunos cadastrados
- Rota GET /api/sessions/player/:playerId
- Categorias traduzidas no perfil do aluno
- Grafico de evolucao adicionado ao PerfilAluno
- Remocao da collection players legada

---

## [0.9.0] — 2026-04-21

### Adicionado — CRUD de turmas e alunos

- Turmas, DetalheTurma, PerfilAluno
- Student model com campos clinicos e historico de anotacoes

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuario logado e botao sair

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas publicas /api/unity para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticacao + Hierarquia

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

## Proximas versoes planejadas

- `[1.11.0]` — Tutorial WebGL e ajustes de compatibilidade do jogo
- `[2.0.0]` — Preparacao para primeiros testadores programadores
- `[2.1.0]` — Responsividade + design final da designer
- `[2.2.0]` — Sistema publicado e testado nas instituicoes parceiras
- `[3.0.0]` — ML: K-Means + Arvore de Decisao
