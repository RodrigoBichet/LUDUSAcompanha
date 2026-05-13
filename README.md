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
│   │   ├── scripts/
│   │   │   ├── criarAdmin.js
│   │   │   ├── seedDemo.js
│   │   │   └── seedDemoRandom.js
│   │   ├── utils/
│   │   │   └── removerSessoes.js
│   │   └── app.js
│   ├── uploads/screenshots/
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
    ├── dataset-demo/
    ├── indicadores-pedagogicos.md
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

## Dataset demonstrativo

O projeto possui dois scripts para gerar dados sinteticos e anonimos de demonstracao.

### Demo fixo

```bash
cd backend
npm run seed:demo
```

Login gerado:

```txt
Email: professor.demo@ludus.local
Senha: Demo@2026
```

O demo fixo cria uma instituicao, uma turma, alunos ficticios e sessoes com diferentes comportamentos pedagogicos. A sessao recente da Clara Demo possui screenshots para demonstrar o mapa de interacoes com imagem por fase.

### Demo random

```bash
cd backend
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1 --seed=2026
```

Login gerado:

```txt
Email: professor.random.demo@ludus.local
Senha: Demo@2026
```

Mesmo quando uma quantidade menor e informada, o script random garante pelo menos 3 alunos para representar tres cenarios pedagogicos: indicadores positivos, desenvolvimento intermediario e necessidade de maior observacao docente.

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

## API REST — Referencia resumida

### Rotas publicas (Unity)

| Metodo | Rota                                        | Descricao                                          |
| ------ | ------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/unity/schools`                        | Lista instituicoes                                 |
| GET    | `/api/unity/groups/:institutionId`          | Lista turmas                                       |
| GET    | `/api/unity/students/:groupId`              | Lista alunos                                       |
| POST   | `/api/unity/students/:id/solicitar-captura` | Liga/desliga imagens para a proxima sessao no jogo |

### Dashboard e sessoes

| Metodo | Rota                                | Observacao                    |
| ------ | ----------------------------------- | ----------------------------- |
| POST   | `/api/sessions`                     | Recebe sessoes do SDK Unity   |
| GET    | `/api/sessions/:sessionId`          | Busca uma sessao especifica   |
| GET    | `/api/sessions/player/:studentId`   | Historico por aluno real      |
| GET    | `/api/dashboard/summary/:studentId` | Aceita `?gameId=...`          |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados do mapa de interacoes   |
| GET    | `/api/dashboard/alerts/:studentId`  | Alertas/indicadores por aluno |

---

## Dashboard — Telas implementadas

| Tela                   | Rota                  | Descricao                                                                 |
| ---------------------- | --------------------- | ------------------------------------------------------------------------- |
| Login                  | `/login`              | Autenticacao JWT                                                          |
| Home                   | `/`                   | Selecao de jogo e listagem de instituicoes                                |
| Detalhes Sessao        | `/sessao/:sessionId`  | Mapa de interacoes e sequencia da sessao por fase                         |
| Turmas                 | `/turmas`             | Gerenciamento de turmas, com filtro por instituicao quando vindo da Home  |
| Detalhe Turma          | `/turmas/:id`         | Lista e cadastro de alunos, preservando o contexto do jogo selecionado    |
| Perfil Aluno           | `/aluno/:id`          | Dados, anotacoes, indicadores, monitoramento, PDF e solicitacao de imagem |
| Gerenciar Instituicoes | `/admin/instituicoes` | CRUD de instituicoes (apenas admin)                                       |
| Gerenciar Usuarios     | `/admin/usuarios`     | CRUD de usuarios (apenas admin)                                           |
| Meu Perfil             | `/perfil`             | Edicao de dados e senha do usuario logado                                 |

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

Com isso, o perfil do aluno filtra resumo, historico e indicadores pelo jogo selecionado. Quando nenhuma selecao de jogo e informada, as chamadas seguem funcionando no modo geral.

---

## Identificacao do aluno nas sessoes

As sessoes recebidas do jogo sao vinculadas ao aluno por `studentId`, e nao apenas pelo nome exibido. O campo `playerId` continua existindo para exibicao nos relatorios, mas o relacionamento principal usa o identificador real do aluno cadastrado.

Esse ajuste evita que alunos com nomes iguais ou reaproveitados herdem sessoes antigas indevidamente.

---

## Exclusao em cascata

O backend remove dados vinculados ao excluir entidades principais:

- Excluir aluno remove suas sessoes e imagens vinculadas.
- Excluir turma remove seus alunos, sessoes e imagens vinculadas.
- Excluir instituicao remove turmas, alunos, sessoes e imagens vinculadas, alem de desvincular usuarios associados.

As imagens de sessoes sao removidas de `backend/uploads/screenshots/` por meio do helper `backend/src/utils/removerSessoes.js`.

---

## Funcionalidades do Perfil do Aluno

- Dados cadastrais completos com edicao
- Indicadores automaticos com linguagem pedagogica nao diagnostica
- Resumo de monitoramento com metricas consolidadas
- Grafico de evolucao temporal
- Categorias jogadas com nomes amigaveis
- Alertas/indicadores pedagogicos automaticos com linguagem cuidadosa
- Historico de sessoes clicavel com nome da categoria em destaque
- Historico de anotacoes do professor com autor e data
- Geracao de PDF formal para apresentacao aos pais
- Solicitacao destacada de imagem da proxima sessao para compor o mapa de calor por fase
- Controle de origem da solicitacao de imagens entre dashboard e jogo Unity
- Modal visual para avisos de captura, sem uso de alerta nativo do navegador
- Filtro por `gameId` quando o perfil e acessado a partir da Home com jogo selecionado

---

## Imagens para mapa de calor

O professor pode ativar, no perfil do aluno, a opcao **Salvar imagem da proxima sessao**. Quando ativada, a proxima sessao/categoria desse aluno salva imagens das fases para serem usadas como fundo na visualizacao do mapa de interacoes.

A solicitacao pode ser feita pelo dashboard ou pelo interruptor do jogo Unity. Para evitar conflitos, o backend registra tambem a origem da solicitacao em `capturaSolicitadaOrigem` (`dashboard` ou `unity`). Se uma origem ja ativou a captura, a outra interface exibe aviso e bloqueia a alteracao ate a sessao ser registrada ou a propria origem cancelar.

Apos o backend receber uma sessao com imagens, `capturaSolicitada` volta para `false` e `capturaSolicitadaOrigem` volta para `null`. As imagens geradas em runtime sao salvas em `backend/uploads/screenshots/` e nao devem ser versionadas no Git.

Na tela de detalhes da sessao, o mapa de interacoes possui aba **Geral** e abas por fase. Quando ha imagens capturadas, cada fase exibe o caminho do mouse, arrastes e cliques sobre o print correspondente. Quando nao ha imagens, o sistema mantem o mapa geral de interacoes em uma area neutra.

A visualizacao diferencia:

- Movimento do mouse: linha continua
- Arraste/segurar item: linha tracejada
- Cliques: marcadores branco/vermelho
- Fases: cores diferentes para facilitar a leitura no mapa geral

Na aba **Geral**, o professor pode clicar em um trajeto ou clique para abrir diretamente a fase correspondente.

---

## Sequencia da sessao

A tela de detalhes da sessao apresenta uma **Sequencia da Sessao** navegavel por fase. Em vez de uma lista longa com todos os eventos, o professor escolhe uma fase e visualiza apenas seus eventos principais:

- fase iniciada;
- tentativa de arraste;
- erro, quando houver;
- acerto;
- fase concluida.

Os dados demonstrativos tambem foram ajustados para registrar erro seguido de acerto final dentro da mesma fase, aproximando a demonstracao do comportamento real do jogo.

---

## Dados registrados por sessao

Cada sessao recebida do jogo pode armazenar dados brutos e eventos pedagogicos para analise posterior:

| Campo           | Descricao                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| `studentId`     | Identificador real do aluno vinculado a sessao                               |
| `playerId`      | Nome do aluno exibido nos relatorios                                         |
| `mousePath[]`   | Pontos do movimento do mouse/cursor durante a sessao                         |
| `dragPath[]`    | Pontos de inicio, movimento e fim do arraste dos itens                       |
| `clicks[]`      | Cliques realizados pelo aluno                                                |
| `gameEvents[]`  | Eventos semanticos do jogo, como fase iniciada, acerto, erro e fim de sessao |
| `screenshots[]` | Imagens das fases, quando a captura foi solicitada                           |
| `metrics`       | Resumo numerico da sessao, incluindo acertos, erros e duracao                |

Esses dados sao usados pelo dashboard para montar historico, indicadores, relatorios e mapas de interacao. O objetivo e apoiar a observacao pedagogica, nao classificar ou diagnosticar a crianca.

---

## Indicadores pedagogicos automaticos

| Indicador                                  | Condicao                              | Severidade |
| ------------------------------------------ | ------------------------------------- | ---------- |
| Taxa de acerto abaixo do esperado          | Taxa < 50% nas ultimas 3 sessoes      | Alta       |
| Taxa de acerto em desenvolvimento          | Taxa entre 50% e 70%                  | Media      |
| Pausas frequentes durante o jogo           | Media >= 3 por sessao                 | Alta       |
| Pausas durante o jogo                      | Media >= 1.5 por sessao               | Media      |
| Intervalo longo sem sessoes registradas    | Ultima sessao ha +14 dias             | Alta       |
| Intervalo sem sessoes recentes             | Ultima sessao ha +7 dias              | Info       |
| Maior ocorrencia de erros em uma categoria | Taxa de erro >= 50% com 3+ tentativas | Media      |
| Aumento de acertos nas sessoes recentes    | Aumento de 20%+ nas sessoes recentes  | Positivo   |

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
| 9     | Indicadores pedagogicos                     | Concluido                       |
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
| 22    | Registro e visualizacao de arraste          | Concluido                       |
| 23    | Dataset sintetico demonstravel              | Concluido                       |
| 24    | Vinculo real por `studentId`                | Concluido                       |
| 25    | Exclusao em cascata                         | Concluido                       |
| 26    | Sequencia da sessao por fase                | Concluido                       |
| 27    | Responsividade                              | Planejado                       |
| 28    | Design final da designer                    | Planejado                       |
| 29    | Publicar backend                            | Planejado                       |
| 30    | Coleta nas escolas parceiras                | Planejado                       |
| 31    | ML (K-Means + Arvore de Decisao)            | Planejado                       |

---

## Instituicoes parceiras

- E. M. Silveira Martins — Bage/RS
- UNIPAMPA — Cacapava do Sul/RS
- APAE — Pelotas/RS

---

## Contexto academico

Este projeto e parte da dissertacao de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Analise de Dados de Interacao em Jogos Educacionais para Auxilio a Professores e Tutores"**, desenvolvida no Programa de Pos-Graduacao em Ciencia da Computacao da UFPel.
