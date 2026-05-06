# LUDUS Acompanha

> Projeto de Mestrado em Ciência da Computação — UFPel (2026)  
> Autor: Rodrigo Leitzke Bichet  
> Orientador: Prof. Dr. Leomar Soares da Rosa Júnior

---

## O que é

O **LUDUS Acompanha** é uma ferramenta computacional de monitoramento e análise de dados de interação em jogos educacionais, desenvolvida para auxiliar professores e tutores no acompanhamento do desempenho de crianças com necessidades educacionais específicas (TEA).

> ⚠️ **Princípio fundamental:** O LUDUS Acompanha é uma ferramenta de apoio pedagógico. Fornece dados e indicadores para auxiliar professores e tutores nas suas observações. **Nunca substitui avaliação profissional e nunca emite diagnósticos.**

---

## Arquitetura geral

```
Unity (C# SDK) → JSON → Node.js + Express → MongoDB → API REST → Dashboard React
```

---

## Estrutura do repositório

```
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

Acesse em `http://localhost:5173` — será redirecionado para a tela de login.

### Criar primeiro administrador

```bash
cd backend
# Edite src/scripts/criarAdmin.js com seu email e senha
node src/scripts/criarAdmin.js
```

---

## Variáveis de ambiente (backend)

| Variável      | Descrição                          |
| ------------- | ---------------------------------- |
| `PORT`        | Porta do servidor (padrão: 3000)   |
| `MONGODB_URI` | Connection string do MongoDB Atlas |
| `JWT_SECRET`  | Chave secreta para tokens JWT      |

---

## Autenticação

| Papel       | Acesso                                                 |
| ----------- | ------------------------------------------------------ |
| `admin`     | Acesso total — todas as instituições e funcionalidades |
| `professor` | Acesso restrito à sua instituição e turmas             |

---

## API REST — Referência completa

### Rotas públicas (Unity)

| Método | Rota                               | Descrição          |
| ------ | ---------------------------------- | ------------------ |
| GET    | `/api/unity/schools`               | Lista instituições |
| GET    | `/api/unity/groups/:institutionId` | Lista turmas       |
| GET    | `/api/unity/students/:groupId`               | Lista alunos       |
| POST   | `/api/unity/students/:id/solicitar-captura` | Liga/desliga imagens para a próxima sessão no jogo |

### Auth

| Método | Rota                 | Auth |
| ------ | -------------------- | ---- |
| POST   | `/api/auth/register` | —    |
| POST   | `/api/auth/login`    | —    |
| GET    | `/api/auth/me`       | ✅   |
| PUT    | `/api/auth/perfil`   | ✅   |

### Users

| Método | Rota             | Auth     |
| ------ | ---------------- | -------- |
| GET    | `/api/users`     | ✅ Admin |
| PUT    | `/api/users/:id` | ✅ Admin |
| DELETE | `/api/users/:id` | ✅ Admin |

### Institutions

| Método              | Rota                    | Auth     |
| ------------------- | ----------------------- | -------- |
| POST/GET/PUT/DELETE | `/api/institutions`     | ✅ Admin |
| GET                 | `/api/institutions/:id` | ✅       |

### Groups / Students

| Método              | Rotas                                     | Auth |
| ------------------- | ----------------------------------------- | ---- |
| POST/GET/PUT/DELETE | `/api/groups`                             | ✅   |
| POST/GET/PUT/DELETE | `/api/students`                           | ✅   |
| POST                | `/api/students/:id/anotacoes`             | ✅   |
| DELETE              | `/api/students/:id/anotacoes/:anotacaoId` | ✅   |
| PATCH               | `/api/students/:id/solicitar-captura`     | ✅   |

### Sessions

| Método | Rota                             | Auth |
| ------ | -------------------------------- | ---- |
| POST   | `/api/sessions`                  | —    |
| GET    | `/api/sessions`                  | —    |
| GET    | `/api/sessions/:sessionId`       | —    |
| GET    | `/api/sessions/player/:playerId` | —    |

### Dashboard

| Método | Rota                                | Auth |
| ------ | ----------------------------------- | ---- |
| GET    | `/api/dashboard/summary/:playerId`  | —    |
| GET    | `/api/dashboard/heatmap/:sessionId` | —    |
| GET    | `/api/dashboard/alerts/:playerId`   | —    |

---

## Dashboard — Telas implementadas

| Tela                   | Rota                  | Descrição                                      |
| ---------------------- | --------------------- | ---------------------------------------------- |
| Login                  | `/login`              | Autenticação JWT                               |
| Home                   | `/`                   | Lista de alunos com indicador de desempenho    |
| Detalhes Sessão        | `/sessao/:sessionId`  | Heatmap geral e por fase, com imagens quando disponíveis |
| Turmas                 | `/turmas`             | Gerenciamento de turmas                        |
| Detalhe Turma          | `/turmas/:id`         | Lista e cadastro de alunos                     |
| Perfil Aluno           | `/aluno/:id`          | Dados, anotações, alertas, monitoramento, PDF e solicitação de imagens |
| Gerenciar Instituições | `/admin/instituicoes` | CRUD de instituições (apenas admin)            |
| Gerenciar Usuários     | `/admin/usuarios`     | CRUD de usuários (apenas admin)                |
| Meu Perfil             | `/perfil`             | Edição de dados e senha do usuário logado      |

---

## Funcionalidades do Perfil do Aluno

- Dados cadastrais completos com edição
- Indicador automático de desempenho (🟢 🟡 🔴)
- Resumo de monitoramento com métricas consolidadas
- Gráfico de evolução temporal
- Categorias jogadas com nomes amigáveis
- Alertas pedagógicos automáticos com linguagem acessível
- Histórico de sessões clicável com nome da categoria em destaque
- Histórico de anotações do professor com autor e data
- Geração de PDF formal para apresentação aos pais
- Solicitação de imagens da próxima sessão para compor o mapa de calor por fase
- Controle de origem da solicitação de imagens entre dashboard e jogo Unity
- Modal visual para avisos de captura, sem uso de alerta nativo do navegador

---

## Imagens para mapa de calor

O professor pode ativar, no perfil do aluno, a opção **Imagens no mapa de calor**. Quando ativada, a próxima sessão/categoria desse aluno salva imagens das fases para serem usadas como fundo na visualização do mapa de calor.

A solicitação pode ser feita pelo dashboard ou pelo interruptor do jogo Unity. Para evitar conflitos, o backend registra também a origem da solicitação em `capturaSolicitadaOrigem` (`dashboard` ou `unity`). Se uma origem já ativou a captura, a outra interface exibe aviso e bloqueia a alteração até a sessão ser registrada ou a própria origem cancelar.

Após o backend receber uma sessão com imagens, `capturaSolicitada` volta para `false` e `capturaSolicitadaOrigem` volta para `null`. As imagens geradas em runtime são salvas em `backend/uploads/screenshots/` e não devem ser versionadas no Git.

Na tela de detalhes da sessão, o mapa de interações possui aba **Geral** e abas por fase. Quando há imagens capturadas, cada fase exibe o caminho do mouse e os cliques sobre o print correspondente. Quando não há imagens, o sistema mantém o mapa geral de interações.

O relatório PDF do aluno também resume quais sessões possuem imagens por fase e quais possuem apenas o mapa geral.

## Alertas pedagógicos automáticos

| Alerta                   | Condição                             | Severidade  |
| ------------------------ | ------------------------------------ | ----------- |
| Taxa de acerto baixa     | Taxa < 50% nas últimas 3 sessões     | 🔴 Alta     |
| Taxa de acerto regular   | Taxa entre 50% e 70%                 | 🟡 Média    |
| Inatividade frequente    | Média ≥ 3 por sessão                 | 🔴 Alta     |
| Inatividade detectada    | Média ≥ 1.5 por sessão               | 🟡 Média    |
| Sem jogar há muito tempo | Última sessão há +14 dias            | 🔴 Alta     |
| Sem jogar há uma semana  | Última sessão há +7 dias             | 🔵 Info     |
| Dificuldade em categoria | Taxa de erro ≥ 50% com 3+ tentativas | 🟡 Média    |
| Evolução positiva        | Melhora de 20%+ nas últimas sessões  | 🟢 Positivo |

---

## Indicador de desempenho na Home

| Indicador             | Critério             |
| --------------------- | -------------------- |
| 🟢 Bom desempenho     | Taxa de acerto ≥ 70% |
| 🟡 Desempenho regular | Taxa entre 50% e 70% |
| 🔴 Atenção necessária | Taxa < 50%           |

---

## Categorias do jogo

| Cena Unity | Nome exibido |
| ---------- | ------------ |
| Fase01     | Ações        |
| Fase02     | Alimentos    |
| Fase03     | Cotidiano    |
| Fase04     | Diversão     |
| Fase05     | Higiene      |

---

## Status do desenvolvimento

| Etapa | Descrição                             | Status               |
| ----- | ------------------------------------- | -------------------- |
| 1     | SDK Unity (C#)                        | ✅                   |
| 1.5   | Integração no Para Que Serve?         | ✅                   |
| 2     | Backend Node.js + MongoDB             | ✅                   |
| 3     | Dashboard React                       | 🔧 Design provisório |
| 4     | Autenticação JWT + Hierarquia         | ✅                   |
| 5     | CRUD completo + rotas Unity           | ✅                   |
| 6     | Refatorar tela Unity                  | ✅                   |
| 7     | Login no dashboard                    | ✅                   |
| 8     | CRUD turmas e alunos                  | ✅                   |
| 9     | Alertas pedagógicos                   | ✅                   |
| 10    | Geração de PDF formal                 | ✅                   |
| 11    | Indicador de desempenho na Home       | ✅                   |
| 12    | Área Admin no dashboard               | ✅                   |
| 13    | Tela de perfil do usuário             | ✅                   |
| 14    | Refactor Escolas → Instituições       | ✅                   |
| 15    | Fix bug sessão múltipla por categoria | ✅                   |
| 16    | Histórico de sessões com categoria    | ✅                   |
| 17    | Solicitação de imagens para mapa de calor | ✅                   |
| 18    | Controle de origem dashboard/Unity para captura | ✅                   |
| 19    | Heatmap com abas Geral e por fase     | ✅                   |
| 20    | Edição de turmas no dashboard         | 🔜                   |
| 21    | Responsividade                        | 🔜                   |
| 22    | Design final da designer              | 🔜                   |
| 23    | Publicar backend                      | 🔜                   |
| 24    | Coleta nas escolas parceiras          | 🔜                   |
| 25    | ML (K-Means + Árvore de Decisão)      | 🔜                   |

---

## Instituições parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS
- APAE — Pelotas/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
