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
├── backend/                         ← Servidor Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          ← conexão MongoDB Atlas
│   │   ├── middleware/
│   │   │   └── auth.js              ← autenticação JWT
│   │   ├── models/
│   │   │   ├── Session.js
│   │   │   ├── Player.js
│   │   │   ├── Institution.js
│   │   │   ├── User.js              ← professor ou admin
│   │   │   ├── School.js            ← escola
│   │   │   ├── Group.js             ← turma
│   │   │   └── Student.js           ← aluno
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── schools.js
│   │   │   ├── groups.js
│   │   │   ├── students.js
│   │   │   ├── sessions.js
│   │   │   ├── players.js
│   │   │   └── dashboard.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── schoolsController.js
│   │   │   ├── groupsController.js
│   │   │   ├── studentsController.js
│   │   │   ├── sessionsController.js
│   │   │   ├── playersController.js
│   │   │   └── dashboardController.js
│   │   ├── scripts/
│   │   │   └── criarAdmin.js        ← cria o primeiro admin
│   │   └── app.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/                        ← Dashboard React + Vite
│   ├── src/
│   │   ├── components/layout/
│   │   ├── pages/
│   │   └── services/api.js
│   └── package.json
└── docs/
    └── LUDUS_API.postman_collection.json  ← collection para testes
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

| Variável      | Descrição                                |
| ------------- | ---------------------------------------- |
| `PORT`        | Porta do servidor (padrão: 3000)         |
| `MONGODB_URI` | Connection string do MongoDB Atlas       |
| `JWT_SECRET`  | Chave secreta para geração de tokens JWT |

---

## Testando a API

Importe a collection do Postman disponível em `docs/LUDUS_API.postman_collection.json` para testar todas as rotas localmente.

Configure o ambiente no Postman com a variável `token` — ela é preenchida automaticamente após o login via script de Post-request.

---

## API REST — Referência completa

### Auth

| Método | Rota                 | Descrição                | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| POST   | `/api/auth/register` | Cadastrar usuário        | —    |
| POST   | `/api/auth/login`    | Login                    | —    |
| GET    | `/api/auth/me`       | Perfil do usuário logado | ✅   |

### Schools

| Método | Rota               | Descrição      | Auth  |
| ------ | ------------------ | -------------- | ----- |
| POST   | `/api/schools`     | Criar escola   | Admin |
| GET    | `/api/schools`     | Listar escolas | ✅    |
| GET    | `/api/schools/:id` | Buscar escola  | ✅    |

### Groups (Turmas)

| Método | Rota              | Descrição     | Auth |
| ------ | ----------------- | ------------- | ---- |
| POST   | `/api/groups`     | Criar turma   | ✅   |
| GET    | `/api/groups`     | Listar turmas | ✅   |
| GET    | `/api/groups/:id` | Buscar turma  | ✅   |

### Students (Alunos)

| Método | Rota                | Descrição              | Auth |
| ------ | ------------------- | ---------------------- | ---- |
| POST   | `/api/students`     | Cadastrar aluno        | ✅   |
| GET    | `/api/students`     | Listar alunos          | ✅   |
| GET    | `/api/students/:id` | Buscar aluno + sessões | ✅   |

### Sessions

| Método | Rota                       | Descrição              | Auth |
| ------ | -------------------------- | ---------------------- | ---- |
| POST   | `/api/sessions`            | Recebe sessão do Unity | —    |
| GET    | `/api/sessions`            | Lista sessões          | —    |
| GET    | `/api/sessions/:sessionId` | Busca sessão completa  | —    |

### Players

| Método | Rota                              | Descrição       | Auth |
| ------ | --------------------------------- | --------------- | ---- |
| GET    | `/api/players`                    | Lista jogadores | —    |
| GET    | `/api/players/:playerId/sessions` | Histórico       | —    |

### Dashboard

| Método | Rota                                | Descrição             | Auth |
| ------ | ----------------------------------- | --------------------- | ---- |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas | —    |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados de heatmap      | —    |

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

- **Admin** — acesso total ao sistema
- **Professor** — acessa apenas sua escola e turmas

---

## Status do desenvolvimento

| Etapa | Descrição                               | Status               |
| ----- | --------------------------------------- | -------------------- |
| 1     | SDK Unity (C#)                          | ✅ Concluída         |
| 1.5   | Integração no Para Que Serve?           | ✅ Concluída         |
| 2     | Backend Node.js + MongoDB               | ✅ Concluída         |
| 3     | Dashboard React                         | 🔧 Design provisório |
| 4     | Autenticação JWT + Hierarquia           | ✅ Concluída         |
| 5     | Refatorar tela Unity (seleção de aluno) | 🔜                   |
| 6     | Funcionalidades pedagógicas             | 🔜                   |
| 7     | Dashboard Admin                         | 🔜                   |
| 8     | Responsividade                          | 🔜                   |
| 9     | Publicar backend                        | 🔜                   |
| 10    | Coleta nas escolas parceiras            | 🔜                   |
| 11    | ML (K-Means + Árvore de Decisão)        | 🔜                   |

---

## Escolas parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
