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
│   │   └── database.js         ← conexão com MongoDB Atlas             ✅
│   ├── models/                 ← models Mongoose                       🔜
│   ├── routes/                 ← rotas da API                          🔜
│   ├── controllers/            ← lógica das rotas                      🔜
│   └── app.js                  ← configuração do Express               ✅
├── .env.example                ← modelo de variáveis de ambiente
├── .gitignore
├── package.json
└── server.js                   ← ponto de entrada do servidor          ✅
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

Edite o `.env` com sua connection string do MongoDB Atlas e defina uma porta.

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

| Variável      | Descrição                          | Exemplo             |
| ------------- | ---------------------------------- | ------------------- |
| `PORT`        | Porta do servidor                  | `3000`              |
| `MONGODB_URI` | Connection string do MongoDB Atlas | `mongodb+srv://...` |

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

## API REST

> Em desenvolvimento — rotas serão documentadas conforme implementadas.

| Método | Rota                                | Descrição               | Status |
| ------ | ----------------------------------- | ----------------------- | ------ |
| GET    | `/`                                 | Health check            | ✅     |
| POST   | `/api/sessions`                     | Recebe sessão do Unity  | 🔜     |
| GET    | `/api/players`                      | Lista jogadores         | 🔜     |
| GET    | `/api/players/:id/sessions`         | Histórico de um jogador | 🔜     |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas   | 🔜     |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados para heatmap      | 🔜     |

---

## Status do desenvolvimento

### Etapa 2 — Backend

| Componente                            | Status |
| ------------------------------------- | ------ |
| Servidor Express + conexão MongoDB    | ✅     |
| Models (Session, Player, Institution) | 🔜     |
| Rotas e Controllers                   | 🔜     |

---

## Contexto acadêmico

Este backend é parte da dissertação de mestrado **"LUDUS Acompanha — Uma Ferramenta para Monitoramento e Análise de Dados de Interação em Jogos Educacionais para Auxílio a Professores e Tutores"**, desenvolvida no Programa de Pós-Graduação em Ciência da Computação da UFPel.
