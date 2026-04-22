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
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── Session.js
│   │   │   ├── Player.js
│   │   │   ├── Institution.js
│   │   │   ├── User.js
│   │   │   ├── School.js
│   │   │   ├── Group.js
│   │   │   └── Student.js
│   │   ├── routes/
│   │   │   ├── unity.js       ← rotas públicas para o Unity
│   │   │   ├── auth.js
│   │   │   ├── schools.js
│   │   │   ├── groups.js
│   │   │   ├── students.js
│   │   │   ├── sessions.js
│   │   │   ├── players.js
│   │   │   └── dashboard.js
│   │   ├── controllers/
│   │   │   ├── unityController.js
│   │   │   ├── authController.js
│   │   │   ├── schoolsController.js
│   │   │   ├── groupsController.js
│   │   │   ├── studentsController.js
│   │   │   ├── sessionsController.js
│   │   │   ├── playersController.js
│   │   │   └── dashboardController.js
│   │   ├── scripts/
│   │   │   └── criarAdmin.js
│   │   └── app.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/layout/
│   │   ├── pages/
│   │   └── services/api.js
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

Acesse em `http://localhost:5173`

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

## Testando a API

Importe `docs/LUDUS_API.postman_collection.json` no Postman. Configure o ambiente com a variável `token` — preenchida automaticamente após o login.

---

## API REST — Referência completa

### Rotas públicas (Unity — sem autenticação)

| Método | Rota                           | Descrição              |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/api/unity/schools`           | Lista escolas          |
| GET    | `/api/unity/groups/:schoolId`  | Lista turmas da escola |
| GET    | `/api/unity/students/:groupId` | Lista alunos da turma  |

### Auth

| Método | Rota                 | Auth |
| ------ | -------------------- | ---- |
| POST   | `/api/auth/register` | —    |
| POST   | `/api/auth/login`    | —    |
| GET    | `/api/auth/me`       | ✅   |

### Schools

| Método | Rota               | Auth  |
| ------ | ------------------ | ----- |
| POST   | `/api/schools`     | Admin |
| GET    | `/api/schools`     | ✅    |
| GET    | `/api/schools/:id` | ✅    |
| PUT    | `/api/schools/:id` | Admin |
| DELETE | `/api/schools/:id` | Admin |

### Groups (Turmas)

| Método | Rota              | Auth |
| ------ | ----------------- | ---- |
| POST   | `/api/groups`     | ✅   |
| GET    | `/api/groups`     | ✅   |
| GET    | `/api/groups/:id` | ✅   |
| PUT    | `/api/groups/:id` | ✅   |
| DELETE | `/api/groups/:id` | ✅   |

### Students (Alunos)

| Método | Rota                | Auth |
| ------ | ------------------- | ---- |
| POST   | `/api/students`     | ✅   |
| GET    | `/api/students`     | ✅   |
| GET    | `/api/students/:id` | ✅   |
| PUT    | `/api/students/:id` | ✅   |
| DELETE | `/api/students/:id` | ✅   |

### Sessions

| Método | Rota                       | Auth |
| ------ | -------------------------- | ---- |
| POST   | `/api/sessions`            | —    |
| GET    | `/api/sessions`            | —    |
| GET    | `/api/sessions/:sessionId` | —    |

### Players

| Método | Rota                              | Auth |
| ------ | --------------------------------- | ---- |
| GET    | `/api/players`                    | —    |
| GET    | `/api/players/:playerId/sessions` | —    |

### Dashboard

| Método | Rota                                | Auth |
| ------ | ----------------------------------- | ---- |
| GET    | `/api/dashboard/summary/:playerId`  | —    |
| GET    | `/api/dashboard/heatmap/:sessionId` | —    |

---

## Hierarquia do sistema

```
ADMINISTRADOR
└── Escola
    ├── Professor
    │   ├── Turma A
    │   │   ├── Aluno 1
    │   │   └── Aluno 2
    │   └── Turma B
    └── Professor B
        └── Turma C
```

---

## Status do desenvolvimento

| Etapa | Descrição                               | Status               |
| ----- | --------------------------------------- | -------------------- |
| 1     | SDK Unity (C#)                          | ✅                   |
| 1.5   | Integração no Para Que Serve?           | ✅                   |
| 2     | Backend Node.js + MongoDB               | ✅                   |
| 3     | Dashboard React                         | 🔧 Design provisório |
| 4     | Autenticação JWT + Hierarquia           | ✅                   |
| 5     | CRUD completo + rotas Unity             | ✅                   |
| 6     | Refatorar tela Unity (seleção de aluno) | 🔧 Em andamento      |
| 7     | Funcionalidades pedagógicas             | 🔜                   |
| 8     | Dashboard Admin + CRUD no frontend      | 🔜                   |
| 9     | Responsividade                          | 🔜                   |
| 10    | Publicar backend                        | 🔜                   |
| 11    | Coleta nas escolas parceiras            | 🔜                   |
| 12    | ML (K-Means + Árvore de Decisão)        | 🔜                   |

---

## Escolas parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
