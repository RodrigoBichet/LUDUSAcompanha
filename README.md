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
│   │   │   ├── School.js
│   │   │   ├── Group.js
│   │   │   └── Student.js
│   │   ├── routes/
│   │   │   ├── unity.js
│   │   │   ├── auth.js
│   │   │   ├── schools.js
│   │   │   ├── groups.js
│   │   │   ├── students.js
│   │   │   ├── sessions.js
│   │   │   ├── dashboard.js
│   │   │   └── users.js
│   │   ├── controllers/
│   │   │   ├── unityController.js
│   │   │   ├── authController.js
│   │   │   ├── schoolsController.js
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
│   │   │   ├── GerenciarEscolas.jsx
│   │   │   ├── GerenciarUsuarios.jsx
│   │   │   └── Perfil.jsx
│   │   ├── services/api.js
│   │   └── App.jsx
│   └── package.json
└── docs/
    └── LUDUS_API.postman_collection.json
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

| Papel       | Acesso                                            |
| ----------- | ------------------------------------------------- |
| `admin`     | Acesso total — todas as escolas e funcionalidades |
| `professor` | Acesso restrito à sua escola e turmas             |

---

## API REST — Referência completa

### Rotas públicas (Unity)

| Método | Rota                           | Descrição     |
| ------ | ------------------------------ | ------------- |
| GET    | `/api/unity/schools`           | Lista escolas |
| GET    | `/api/unity/groups/:schoolId`  | Lista turmas  |
| GET    | `/api/unity/students/:groupId` | Lista alunos  |

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

### Schools / Groups / Students

| Método              | Rotas                                     | Auth     |
| ------------------- | ----------------------------------------- | -------- |
| POST/GET/PUT/DELETE | `/api/schools`                            | ✅ Admin |
| POST/GET/PUT/DELETE | `/api/groups`                             | ✅       |
| POST/GET/PUT/DELETE | `/api/students`                           | ✅       |
| POST                | `/api/students/:id/anotacoes`             | ✅       |
| DELETE              | `/api/students/:id/anotacoes/:anotacaoId` | ✅       |

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

| Tela               | Rota                 | Descrição                                      |
| ------------------ | -------------------- | ---------------------------------------------- |
| Login              | `/login`             | Autenticação JWT                               |
| Home               | `/`                  | Lista de alunos com indicador de desempenho    |
| Detalhes Sessão    | `/sessao/:sessionId` | Heatmap e timeline                             |
| Turmas             | `/turmas`            | Gerenciamento de turmas                        |
| Detalhe Turma      | `/turmas/:id`        | Lista e cadastro de alunos                     |
| Perfil Aluno       | `/aluno/:id`         | Dados, anotações, alertas, monitoramento e PDF |
| Gerenciar Escolas  | `/admin/escolas`     | CRUD de escolas (apenas admin)                 |
| Gerenciar Usuários | `/admin/usuarios`    | CRUD de usuários (apenas admin)                |
| Meu Perfil         | `/perfil`            | Edição de dados e senha do usuário logado      |

---

## Funcionalidades do Perfil do Aluno

- Dados cadastrais completos com edição
- Indicador automático de desempenho (🟢 🟡 🔴)
- Resumo de monitoramento com métricas consolidadas
- Gráfico de evolução temporal
- Categorias jogadas com nomes amigáveis
- Alertas pedagógicos automáticos com linguagem acessível
- Histórico de sessões clicável
- Histórico de anotações do professor com autor e data
- Geração de PDF formal para apresentação aos pais

---

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

| Etapa | Descrição                        | Status               |
| ----- | -------------------------------- | -------------------- |
| 1     | SDK Unity (C#)                   | ✅                   |
| 1.5   | Integração no Para Que Serve?    | ✅                   |
| 2     | Backend Node.js + MongoDB        | ✅                   |
| 3     | Dashboard React                  | 🔧 Design provisório |
| 4     | Autenticação JWT + Hierarquia    | ✅                   |
| 5     | CRUD completo + rotas Unity      | ✅                   |
| 6     | Refatorar tela Unity             | ✅                   |
| 7     | Login no dashboard               | ✅                   |
| 8     | CRUD turmas e alunos             | ✅                   |
| 9     | Alertas pedagógicos              | ✅                   |
| 10    | Geração de PDF formal            | ✅                   |
| 11    | Indicador de desempenho na Home  | ✅                   |
| 12    | Área Admin no dashboard          | ✅                   |
| 13    | Tela de perfil do usuário        | ✅                   |
| 14    | Responsividade                   | 🔜                   |
| 15    | Design final da designer         | 🔜                   |
| 16    | Publicar backend                 | 🔜                   |
| 17    | Coleta nas escolas parceiras     | 🔜                   |
| 18    | ML (K-Means + Árvore de Decisão) | 🔜                   |

---

## Escolas parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
