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
├── backend/                    ← Servidor Node.js + Express + MongoDB    ✅
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── Session.js
│   │   │   ├── Player.js
│   │   │   └── Institution.js
│   │   ├── routes/
│   │   │   ├── sessions.js
│   │   │   ├── players.js
│   │   │   └── dashboard.js
│   │   ├── controllers/
│   │   │   ├── sessionsController.js
│   │   │   ├── playersController.js
│   │   │   └── dashboardController.js
│   │   └── app.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/                   ← Dashboard React + Vite                  🔧
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Sidebar.jsx
    │   │       └── Header.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── PerfilJogador.jsx
    │   │   └── DetalhesSessao.jsx
    │   ├── services/
    │   │   └── api.js
    │   └── App.jsx
    └── package.json
```

---

## Como rodar localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com sua connection string do MongoDB Atlas
npm run dev
```

Deve aparecer:

```
[LUDUS] MongoDB conectado com sucesso!
[LUDUS] Servidor rodando na porta 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173`

> ⚠️ O backend precisa estar rodando para o dashboard funcionar.

---

## API REST — Referência completa

### Health Check

| Método | Rota | Descrição     |
| ------ | ---- | ------------- |
| GET    | `/`  | Status da API |

### Sessions

| Método | Rota                       | Descrição              |
| ------ | -------------------------- | ---------------------- |
| POST   | `/api/sessions`            | Recebe sessão do Unity |
| GET    | `/api/sessions`            | Lista sessões          |
| GET    | `/api/sessions/:sessionId` | Busca sessão completa  |

### Players

| Método | Rota                              | Descrição            |
| ------ | --------------------------------- | -------------------- |
| POST   | `/api/players`                    | Cria jogador         |
| GET    | `/api/players`                    | Lista jogadores      |
| GET    | `/api/players/:id`                | Busca jogador        |
| GET    | `/api/players/:playerId/sessions` | Histórico de sessões |

### Dashboard

| Método | Rota                                | Descrição             |
| ------ | ----------------------------------- | --------------------- |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados de heatmap      |

---

## Dashboard — Telas implementadas

| Tela   | Rota                 | Descrição                        |
| ------ | -------------------- | -------------------------------- |
| Home   | `/`                  | Lista de jogadores monitorados   |
| Perfil | `/jogador/:playerId` | Métricas, categorias e histórico |
| Sessão | `/sessao/:sessionId` | Heatmap e timeline de eventos    |

---

## Status do desenvolvimento

| Etapa | Descrição                                               | Status               |
| ----- | ------------------------------------------------------- | -------------------- |
| 1     | SDK Unity (C#)                                          | ✅ Concluída         |
| 1.5   | Integração no Para Que Serve?                           | ✅ Concluída         |
| 2     | Backend Node.js + MongoDB                               | ✅ Concluída         |
| 3     | Dashboard React                                         | 🔧 Design provisório |
| 4     | Autenticação + Hierarquia (escola/turma/aluno)          | 🔜                   |
| 5     | Refatorar tela Unity (seleção de aluno)                 | 🔜                   |
| 6     | Funcionalidades pedagógicas (alertas, PDF, observações) | 🔜                   |
| 7     | Dashboard Admin                                         | 🔜                   |
| 8     | Responsividade                                          | 🔜                   |
| 9     | Publicar backend                                        | 🔜                   |
| 10    | Coleta nas escolas parceiras                            | 🔜                   |
| 11    | ML (K-Means + Árvore de Decisão)                        | 🔜                   |

---

## Escolas parceiras

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS

---

## Contexto acadêmico

Este projeto é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
