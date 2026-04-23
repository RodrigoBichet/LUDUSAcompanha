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
│   │   │   ├── Player.js
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
│   │   ├── scripts/criarAdmin.js
│   │   └── app.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       ← gerencia autenticação global
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx       ← usuário logado + botão sair
│   │   │   │   └── Header.jsx
│   │   │   └── shared/
│   │   │       └── RotaProtegida.jsx ← protege rotas autenticadas
│   │   ├── pages/
│   │   │   ├── Login.jsx             ← tela de login
│   │   │   ├── Home.jsx
│   │   │   ├── PerfilJogador.jsx
│   │   │   └── DetalhesSessao.jsx
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

O dashboard usa **JWT (JSON Web Token)** para autenticação:

- Token gerado no login com validade de 7 dias
- Salvo no `localStorage` do navegador
- Enviado automaticamente em todas as requisições via header `Authorization: Bearer <token>`
- Rotas protegidas redirecionam para `/login` se não autenticado

### Papéis de usuário

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

### Schools, Groups, Students

| Método              | Rotas           | Auth                                 |
| ------------------- | --------------- | ------------------------------------ |
| POST/GET/PUT/DELETE | `/api/schools`  | ✅ (Admin para criar/editar/deletar) |
| POST/GET/PUT/DELETE | `/api/groups`   | ✅                                   |
| POST/GET/PUT/DELETE | `/api/students` | ✅                                   |

### Sessions / Players / Dashboard

| Método   | Rota                                | Auth |
| -------- | ----------------------------------- | ---- |
| POST/GET | `/api/sessions`                     | —    |
| GET      | `/api/players`                      | —    |
| GET      | `/api/dashboard/summary/:playerId`  | —    |
| GET      | `/api/dashboard/heatmap/:sessionId` | —    |

---

## Testando a API

Importe `docs/LUDUS_API.postman_collection.json` no Postman. O token é salvo automaticamente após o login.

---

## Status do desenvolvimento

| Etapa | Descrição                           | Status                |
| ----- | ----------------------------------- | --------------------- |
| 1     | SDK Unity (C#)                      | ✅                    |
| 1.5   | Integração no Para Que Serve?       | ✅                    |
| 2     | Backend Node.js + MongoDB           | ✅                    |
| 3     | Dashboard React                     | 🔧 Design provisório  |
| 4     | Autenticação JWT + Hierarquia       | ✅                    |
| 5     | CRUD completo + rotas Unity         | ✅                    |
| 6     | Refatorar tela Unity                | ✅                    |
| 7     | Login no dashboard                  | ✅                    |
| 8     | CRUD no dashboard (turmas e alunos) | 🔧 Em desenvolvimento |
| 9     | Funcionalidades pedagógicas         | 🔜                    |
| 10    | Área Admin no dashboard             | 🔜                    |
| 11    | Responsividade                      | 🔜                    |
| 12    | Publicar backend                    | 🔜                    |
| 13    | Coleta nas escolas parceiras        | 🔜                    |
| 14    | ML (K-Means + Árvore de Decisão)    | 🔜                    |

---

## Escolas parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
