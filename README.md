# LUDUS Acompanha — Backend

> Parte do projeto **LUDUS Acompanha** — Mestrado em Ciência da Computação, UFPel (2026)  
> Autor: Rodrigo Leitzke Bichet  
> Orientador: Prof. Dr. Leomar Soares da Rosa Júnior

---

## O que é

O **LUDUS Acompanha Backend** é o servidor que recebe os dados de gameplay coletados pelo LUDUS Monitor SDK (Unity), armazena no MongoDB e disponibiliza via API REST para o dashboard web.

---

## Arquitetura geral do projeto

```
Unity (C# SDK) → JSON → Node.js + Express → MongoDB → API REST → Python ML → Dashboard React
```

---

## Estrutura do projeto

```
LUDUSAcompanha/
├── src/
│   ├── config/
│   │   └── database.js              ← conexão com MongoDB Atlas             ✅
│   ├── models/
│   │   ├── Session.js               ← model da sessão de jogo               ✅
│   │   ├── Player.js                ← model do jogador                      ✅
│   │   └── Institution.js           ← model da instituição                  ✅
│   ├── routes/
│   │   ├── sessions.js              ← rotas de sessões                      ✅
│   │   ├── players.js               ← rotas de jogadores                    ✅
│   │   └── dashboard.js             ← rotas do dashboard                    ✅
│   ├── controllers/
│   │   ├── sessionsController.js    ← lógica das sessões                    ✅
│   │   ├── playersController.js     ← lógica dos jogadores                  ✅
│   │   └── dashboardController.js   ← lógica do dashboard                   ✅
│   └── app.js                       ← configuração do Express               ✅
├── .env.example                     ← modelo de variáveis de ambiente
├── .gitignore
├── package.json
└── server.js                        ← ponto de entrada do servidor          ✅
```

---

## Pré-requisitos

- Node.js v18 ou superior
- Conta no MongoDB Atlas (gratuita)

---

## Como rodar localmente

**1. Clone o repositório:**

```bash
git clone https://github.com/seu-usuario/LUDUSAcompanha.git
cd LUDUSAcompanha
```

**2. Instale as dependências:**

```bash
npm install
```

**3. Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

Edite o `.env` com sua connection string do MongoDB Atlas.

> ⚠️ Use o formato de connection string **direta** (não o formato `mongodb+srv`), pois pode haver problemas de resolução DNS em algumas redes.

**4. Inicie o servidor em modo desenvolvimento:**

```bash
npm run dev
```

Deve aparecer:

```
[LUDUS] MongoDB conectado com sucesso!
[LUDUS] Servidor rodando na porta 3000
```

---

## Variáveis de ambiente

| Variável      | Descrição                                 |
| ------------- | ----------------------------------------- |
| `PORT`        | Porta do servidor (padrão: 3000)          |
| `MONGODB_URI` | Connection string direta do MongoDB Atlas |

---

## Dependências

| Pacote   | Uso                                    |
| -------- | -------------------------------------- |
| express  | Framework web                          |
| mongoose | ODM para MongoDB                       |
| dotenv   | Variáveis de ambiente                  |
| cors     | Cross-Origin Resource Sharing          |
| nodemon  | Reinício automático em desenvolvimento |

---

## API REST — Referência completa

### Sessions

| Método | Rota                       | Descrição                    |
| ------ | -------------------------- | ---------------------------- |
| GET    | `/`                        | Health check                 |
| POST   | `/api/sessions`            | Recebe sessão do Unity       |
| GET    | `/api/sessions`            | Lista sessões (últimas 50)   |
| GET    | `/api/sessions/:sessionId` | Busca sessão completa por ID |

### Players

| Método | Rota                              | Descrição                                       |
| ------ | --------------------------------- | ----------------------------------------------- |
| POST   | `/api/players`                    | Cria um jogador                                 |
| GET    | `/api/players`                    | Lista jogadores cadastrados e nomes nas sessões |
| GET    | `/api/players/:id`                | Busca jogador por ID                            |
| GET    | `/api/players/:playerId/sessions` | Histórico de sessões de um jogador              |

### Dashboard

| Método | Rota                                | Descrição                        |
| ------ | ----------------------------------- | -------------------------------- |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas do jogador |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados de heatmap de uma sessão   |

---

## Exemplos de resposta

### GET /api/dashboard/summary/:playerId

```json
{
  "sucesso": true,
  "playerId": "rodrigo",
  "totalSessoes": 3,
  "totalClicks": 45,
  "totalCorrect": 12,
  "totalWrong": 3,
  "taxaAcerto": "80.0%",
  "totalDuracaoMs": 42000,
  "totalInatividade": 1,
  "categorias": { "Fase01": 2, "Fase05": 1 },
  "evolucaoTemporal": [ ... ]
}
```

### GET /api/dashboard/heatmap/:sessionId

```json
{
  "sucesso": true,
  "sessionId": "xxxx-xxxx",
  "playerId": "rodrigo",
  "mousePath": [ { "x": 320, "y": 210, "t": 1200 }, ... ],
  "clicks": [ { "element": "btn_categoria", "x": 320, "y": 210, "timestamp": 1200 }, ... ]
}
```

---

## Status do desenvolvimento

### Etapa 2 — Backend ✅ Completo

| Componente                                 | Status |
| ------------------------------------------ | ------ |
| Servidor Express + conexão MongoDB         | ✅     |
| Models (Session, Player, Institution)      | ✅     |
| Rotas e Controller de Sessions             | ✅     |
| Rotas e Controller de Players              | ✅     |
| Rotas e Controller de Dashboard            | ✅     |
| Fluxo end-to-end Unity → Backend → MongoDB | ✅     |

### Próximas etapas

| Etapa   | Descrição                        | Status |
| ------- | -------------------------------- | ------ |
| Etapa 3 | Dashboard React + Vite           | 🔜     |
| Etapa 4 | Análise ML Python + scikit-learn | 🔜     |

---

## Contexto acadêmico

Este backend é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
