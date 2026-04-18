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
│   │   └── sessions.js              ← rotas de sessões                      ✅
│   ├── controllers/
│   │   └── sessionsController.js    ← lógica das sessões                    ✅
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

Exemplo de `.env`:

```
PORT=3000
MONGODB_URI=mongodb://usuario:senha@shard-00-00.xxxxx.mongodb.net:27017,shard-00-01.xxxxx.mongodb.net:27017,shard-00-02.xxxxx.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx&authSource=admin&appName=Cluster0
```

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

## Models do banco de dados

### Session

Espelha exatamente a estrutura gerada pelo SDK Unity (`LudusSession`).

| Campo                   | Tipo           | Descrição                               |
| ----------------------- | -------------- | --------------------------------------- |
| `sessionId`             | String (único) | UUID gerado pelo Unity                  |
| `playerId`              | String         | Nome/ID do jogador                      |
| `gameId`                | String         | Identificador do jogo                   |
| `gameVersion`           | String         | Versão do jogo                          |
| `platform`              | String         | `WebGL` ou `Android`                    |
| `startedAt` / `endedAt` | String         | Timestamps ISO 8601                     |
| `durationMs`            | Number         | Duração total em ms                     |
| `metrics`               | Object         | Métricas agregadas da sessão            |
| `clicks`                | Array          | Lista de cliques com posição e elemento |
| `mousePath`             | Array          | Caminho do mouse/dedo para heatmap      |
| `gameEvents`            | Array          | Eventos semânticos do jogo              |

### Player

| Campo           | Tipo     | Descrição                |
| --------------- | -------- | ------------------------ |
| `name`          | String   | Nome da criança          |
| `institutionId` | ObjectId | Referência à instituição |
| `notes`         | String   | Observações do professor |

### Institution

| Campo  | Tipo   | Descrição           |
| ------ | ------ | ------------------- |
| `name` | String | Nome da instituição |
| `city` | String | Cidade              |

---

## API REST

| Método | Rota                                | Descrição               | Status |
| ------ | ----------------------------------- | ----------------------- | ------ |
| GET    | `/`                                 | Health check            | ✅     |
| POST   | `/api/sessions`                     | Recebe sessão do Unity  | ✅     |
| GET    | `/api/sessions`                     | Lista sessões           | ✅     |
| GET    | `/api/sessions/:sessionId`          | Busca sessão por ID     | ✅     |
| GET    | `/api/players`                      | Lista jogadores         | 🔜     |
| GET    | `/api/players/:id/sessions`         | Histórico de um jogador | 🔜     |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas   | 🔜     |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados para heatmap      | 🔜     |

---

## Status do desenvolvimento

### Etapa 2 — Backend

| Componente                            | Status                |
| ------------------------------------- | --------------------- |
| Servidor Express + conexão MongoDB    | ✅                    |
| Models (Session, Player, Institution) | ✅                    |
| Rotas e Controller de Sessions        | ✅                    |
| Rotas de Players e Dashboard          | 🔧 Em desenvolvimento |

---

## Contexto acadêmico

Este backend é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
