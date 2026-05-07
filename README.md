# LUDUS Acompanha

> Projeto de Mestrado em Ciencia da Computacao — UFPel (2026)  
> Autor: Rodrigo Leitzke Bichet  
> Orientador: Prof. Dr. Leomar Soares da Rosa Junior

---

## O que e

O **LUDUS Acompanha** e uma ferramenta computacional de monitoramento e analise de dados de interacao em jogos educacionais, desenvolvida para auxiliar professores e tutores no acompanhamento pedagogico de criancas com necessidades educacionais especificas, incluindo TEA.

> **Principio fundamental:** O LUDUS Acompanha e uma ferramenta de apoio pedagogico. Fornece dados e indicadores para auxiliar professores e tutores nas suas observacoes. **Nunca substitui avaliacao profissional e nunca emite diagnosticos.**

---

## Arquitetura geral

```txt
Unity (C# SDK) -> JSON -> Node.js + Express -> MongoDB -> API REST -> Dashboard React
```

---

## Estrutura do repositorio

```txt
LUDUSAcompanha/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── middleware/auth.js
│   │   ├── models/
│   │   │   ├── Session.js
│   │   │   ├── Institution.js
│   │   │   ├── User.js
│   │   │   ├── Group.js
│   │   │   └── Student.js
│   │   ├── routes/
│   │   │   ├── unity.js
│   │   │   ├── auth.js
│   │   │   ├── institutions.js
│   │   │   ├── groups.js
│   │   │   ├── students.js
│   │   │   ├── sessions.js
│   │   │   ├── dashboard.js
│   │   │   └── users.js
│   │   ├── controllers/
│   │   │   ├── unityController.js
│   │   │   ├── authController.js
│   │   │   ├── institutionsController.js
│   │   │   ├── groupsController.js
│   │   │   ├── studentsController.js
│   │   │   ├── sessionsController.js
│   │   │   ├── dashboardController.js
│   │   │   └── usersController.js
│   │   ├── scripts/criarAdmin.js
│   │   └── app.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── contexts/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   └── shared/
│   │   │       ├── RotaProtegida.jsx
│   │   │       ├── RotaAdmin.jsx
│   │   │       ├── RelatorioPDF.jsx
│   │   │       └── RelatorioPDF.css
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── DetalhesSessao.jsx
│   │   │   ├── Turmas.jsx
│   │   │   ├── DetalheTurma.jsx
│   │   │   ├── PerfilAluno.jsx
│   │   │   ├── GerenciarInstituicoes.jsx
│   │   │   ├── GerenciarUsuarios.jsx
│   │   │   └── Perfil.jsx
│   │   ├── services/api.js
│   │   └── App.jsx
│   └── package.json
└── docs/
    ├── LUDUS_API.postman_collection.json
    └── SETUP.md
```

---

## Como rodar localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas credenciais
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173` — sera redirecionado para a tela de login.

### Criar primeiro administrador

```bash
cd backend
# Edite src/scripts/criarAdmin.js com seu email e senha
node src/scripts/criarAdmin.js
```

---

## Variaveis de ambiente (backend)

| Variavel      | Descricao                          |
| ------------- | ---------------------------------- |
| `PORT`        | Porta do servidor (padrao: 3000)   |
| `MONGODB_URI` | Connection string do MongoDB Atlas |
| `JWT_SECRET`  | Chave secreta para tokens JWT      |

---

## Autenticacao

| Papel       | Acesso                                                 |
| ----------- | ------------------------------------------------------ |
| `admin`     | Acesso total — todas as instituicoes e funcionalidades |
| `professor` | Acesso restrito a sua instituicao e turmas             |

---

## API REST — Referencia completa

### Rotas publicas (Unity)

| Metodo | Rota                                        | Descricao                                          |
| ------ | ------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/unity/schools`                        | Lista instituicoes                                 |
| GET    | `/api/unity/groups/:institutionId`          | Lista turmas                                       |
| GET    | `/api/unity/students/:groupId`              | Lista alunos                                       |
| POST   | `/api/unity/students/:id/solicitar-captura` | Liga/desliga imagens para a proxima sessao no jogo |

### Auth

| Metodo | Rota                 | Auth |
| ------ | -------------------- | ---- |
| POST   | `/api/auth/register` | —    |
| POST   | `/api/auth/login`    | —    |
| GET    | `/api/auth/me`       | sim  |
| PUT    | `/api/auth/perfil`   | sim  |

### Users

| Metodo | Rota             | Auth  |
| ------ | ---------------- | ----- |
| GET    | `/api/users`     | Admin |
| PUT    | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

### Institutions

| Metodo              | Rota                    | Auth  |
| ------------------- | ----------------------- | ----- |
| POST/GET/PUT/DELETE | `/api/institutions`     | Admin |
| GET                 | `/api/institutions/:id` | sim   |

### Groups / Students

| Metodo              | Rotas                                     | Auth |
| ------------------- | ----------------------------------------- | ---- |
| POST/GET/PUT/DELETE | `/api/groups`                             | sim  |
| POST/GET/PUT/DELETE | `/api/students`                           | sim  |
| POST                | `/api/students/:id/anotacoes`             | sim  |
| DELETE              | `/api/students/:id/anotacoes/:anotacaoId` | sim  |
| PATCH               | `/api/students/:id/solicitar-captura`     | sim  |

### Sessions

| Metodo | Rota                             | Auth | Observacao                  |
| ------ | -------------------------------- | ---- | --------------------------- |
| POST   | `/api/sessions`                  | —    | Recebe sessoes do SDK Unity |
| GET    | `/api/sessions`                  | —    | Lista sessoes recentes      |
| GET    | `/api/sessions/:sessionId`       | —    | Busca uma sessao especifica |
| GET    | `/api/sessions/player/:playerId` | —    | Aceita `?gameId=...`        |

### Dashboard

| Metodo | Rota                                | Auth | Observacao           |
| ------ | ----------------------------------- | ---- | -------------------- |
| GET    | `/api/dashboard/summary/:playerId`  | —    | Aceita `?gameId=...` |
| GET    | `/api/dashboard/heatmap/:sessionId` | —    | Dados do heatmap     |
| GET    | `/api/dashboard/alerts/:playerId`   | —    | Aceita `?gameId=...` |

---

## Dashboard — Telas implementadas

| Tela                   | Rota                  | Descricao                                                                |
| ---------------------- | --------------------- | ------------------------------------------------------------------------ |
| Login                  | `/login`              | Autenticacao JWT                                                         |
| Home                   | `/`                   | Selecao de jogo e listagem de instituicoes                               |
| Detalhes Sessao        | `/sessao/:sessionId`  | Heatmap geral e por fase, com imagens quando disponiveis                 |
| Turmas                 | `/turmas`             | Gerenciamento de turmas, com filtro por instituicao quando vindo da Home |
| Detalhe Turma          | `/turmas/:id`         | Lista e cadastro de alunos, preservando o contexto do jogo selecionado   |
| Perfil Aluno           | `/aluno/:id`          | Dados, anotacoes, alertas, monitoramento, PDF e solicitacao de imagens   |
| Gerenciar Instituicoes | `/admin/instituicoes` | CRUD de instituicoes (apenas admin)                                      |
| Gerenciar Usuarios     | `/admin/usuarios`     | CRUD de usuarios (apenas admin)                                          |
| Meu Perfil             | `/perfil`             | Edicao de dados e senha do usuario logado                                |

---

## Fluxo por jogo, instituicao, turma e aluno

A Home do dashboard funciona como entrada do acompanhamento pedagogico. O professor primeiro seleciona o jogo acompanhado e, em seguida, visualiza as instituicoes cadastradas.

Fluxo atual:

```txt
Jogo acompanhado -> Instituicao -> Turma -> Aluno -> Sessao
```

O jogo atual ativo e **Para Que Serve?** (`gameId: para-que-serve`). A interface ja exibe **Historietas Divertidas** como integracao futura, ainda bloqueada.

Ao selecionar um jogo, o dashboard preserva o `gameId` nas URLs:

```txt
/?gameId=para-que-serve
/turmas?institutionId=...&gameId=para-que-serve
/turmas/:id?gameId=para-que-serve
/aluno/:id?gameId=para-que-serve
/sessao/:sessionId?gameId=para-que-serve
```

Com isso, o perfil do aluno filtra resumo, historico e alertas pelo jogo selecionado. Quando nenhuma selecao de jogo e informada, as chamadas seguem funcionando no modo geral.

---

## Funcionalidades do Perfil do Aluno

- Dados cadastrais completos com edicao
- Indicador automatico de desempenho
- Resumo de monitoramento com metricas consolidadas
- Grafico de evolucao temporal
- Categorias jogadas com nomes amigaveis
- Alertas pedagogicos automaticos com linguagem acessivel
- Historico de sessoes clicavel com nome da categoria em destaque
- Historico de anotacoes do professor com autor e data
- Geracao de PDF formal para apresentacao aos pais
- Solicitacao de imagens da proxima sessao para compor o mapa de calor por fase
- Controle de origem da solicitacao de imagens entre dashboard e jogo Unity
- Modal visual para avisos de captura, sem uso de alerta nativo do navegador
- Filtro por `gameId` quando o perfil e acessado a partir da Home com jogo selecionado

---

## Imagens para mapa de calor

O professor pode ativar, no perfil do aluno, a opcao **Imagens no mapa de calor**. Quando ativada, a proxima sessao/categoria desse aluno salva imagens das fases para serem usadas como fundo na visualizacao do mapa de calor.

A solicitacao pode ser feita pelo dashboard ou pelo interruptor do jogo Unity. Para evitar conflitos, o backend registra tambem a origem da solicitacao em `capturaSolicitadaOrigem` (`dashboard` ou `unity`). Se uma origem ja ativou a captura, a outra interface exibe aviso e bloqueia a alteracao ate a sessao ser registrada ou a propria origem cancelar.

Apos o backend receber uma sessao com imagens, `capturaSolicitada` volta para `false` e `capturaSolicitadaOrigem` volta para `null`. As imagens geradas em runtime sao salvas em `backend/uploads/screenshots/` e nao devem ser versionadas no Git.

Na tela de detalhes da sessao, o mapa de interacoes possui aba **Geral** e abas por fase. Quando ha imagens capturadas, cada fase exibe o caminho do mouse e os cliques sobre o print correspondente. Quando nao ha imagens, o sistema mantem o mapa geral de interacoes.

O relatorio PDF do aluno tambem resume quais sessoes possuem imagens por fase e quais possuem apenas o mapa geral.

---

## Alertas pedagogicos automaticos

| Alerta                   | Condicao                              | Severidade |
| ------------------------ | ------------------------------------- | ---------- |
| Taxa de acerto baixa     | Taxa < 50% nas ultimas 3 sessoes      | Alta       |
| Taxa de acerto regular   | Taxa entre 50% e 70%                  | Media      |
| Inatividade frequente    | Media >= 3 por sessao                 | Alta       |
| Inatividade detectada    | Media >= 1.5 por sessao               | Media      |
| Sem jogar ha muito tempo | Ultima sessao ha +14 dias             | Alta       |
| Sem jogar ha uma semana  | Ultima sessao ha +7 dias              | Info       |
| Dificuldade em categoria | Taxa de erro >= 50% com 3+ tentativas | Media      |
| Evolucao positiva        | Melhora de 20%+ nas ultimas sessoes   | Positivo   |

---

## Categorias do jogo Para Que Serve?

| Cena Unity | Nome exibido |
| ---------- | ------------ |
| Fase01     | Acoes        |
| Fase02     | Alimentos    |
| Fase03     | Cotidiano    |
| Fase04     | Diversao     |
| Fase05     | Higiene      |

---

## Status do desenvolvimento

| Etapa | Descricao                                   | Status                          |
| ----- | ------------------------------------------- | ------------------------------- |
| 1     | SDK Unity (C#)                              | Concluido                       |
| 1.5   | Integracao no Para Que Serve?               | Concluido                       |
| 2     | Backend Node.js + MongoDB                   | Concluido                       |
| 3     | Dashboard React                             | Design provisorio               |
| 4     | Autenticacao JWT + Hierarquia               | Concluido                       |
| 5     | CRUD completo + rotas Unity                 | Concluido                       |
| 6     | Refatorar tela Unity                        | Concluido                       |
| 7     | Login no dashboard                          | Concluido                       |
| 8     | CRUD turmas e alunos                        | Concluido                       |
| 9     | Alertas pedagogicos                         | Concluido                       |
| 10    | Geracao de PDF formal                       | Concluido                       |
| 11    | Indicador de desempenho na Home             | Substituido pelo fluxo por jogo |
| 12    | Area Admin no dashboard                     | Concluido                       |
| 13    | Tela de perfil do usuario                   | Concluido                       |
| 14    | Refactor Escolas -> Instituicoes            | Concluido                       |
| 15    | Fix bug sessao multipla por categoria       | Concluido                       |
| 16    | Historico de sessoes com categoria          | Concluido                       |
| 17    | Solicitacao de imagens para mapa de calor   | Concluido                       |
| 18    | Controle de origem dashboard/Unity          | Concluido                       |
| 19    | Heatmap com abas Geral e por fase           | Concluido                       |
| 20    | Home com selecao de jogo                    | Concluido                       |
| 21    | Fluxo jogo -> instituicao -> turma -> aluno | Concluido                       |
| 22    | Responsividade                              | Planejado                       |
| 23    | Design final da designer                    | Planejado                       |
| 24    | Publicar backend                            | Planejado                       |
| 25    | Coleta nas escolas parceiras                | Planejado                       |
| 26    | ML (K-Means + Arvore de Decisao)            | Planejado                       |

---

## Instituicoes parceiras

- E. M. Silveira Martins — Bage/RS
- UNIPAMPA — Cacapava do Sul/RS
- APAE — Pelotas/RS

---

## Contexto academico

Este projeto e parte da dissertacao de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Analise de Dados de Interacao em Jogos Educacionais para Auxilio a Professores e Tutores"**, desenvolvida no Programa de Pos-Graduacao em Ciencia da Computacao da UFPel.
