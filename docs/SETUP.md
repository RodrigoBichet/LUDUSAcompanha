# Documentação do Banco de Dados — LUDUS Acompanha

> Projeto de Mestrado em Ciência da Computação — UFPel (2026)  
> Autor: Rodrigo Leitzke Bichet  
> Orientador: Prof. Dr. Leomar Soares da Rosa Júnior

---

## Visão geral

O LUDUS Acompanha utiliza **MongoDB** como banco de dados, hospedado no **MongoDB Atlas** (cloud). A escolha pelo MongoDB é justificada pela natureza dos dados coletados: os eventos do jogo chegam da Unity em formato JSON, e o MongoDB armazena documentos nesse mesmo formato sem necessidade de transformação.

O banco de dados de produção está na organização **Rodrigo's Org - 2026** no Atlas, projeto **LUDUS**, cluster **Cluster0**, banco **test**.

### Fluxo dos dados

```
Unity (C# SDK)
    ↓  POST /api/sessions  (JSON)
Node.js + Express
    ↓  Mongoose
MongoDB Atlas (banco: test)
    ↓  GET /api/dashboard/*
Dashboard React
```

---

## Collections

O banco possui cinco collections:

| Collection     | Descrição                                   |
| -------------- | ------------------------------------------- |
| `users`        | Professores e administradores do sistema    |
| `institutions` | Instituições de ensino parceiras            |
| `groups`       | Turmas vinculadas a uma instituição         |
| `students`     | Alunos vinculados a uma turma               |
| `sessions`     | Sessões de jogo enviadas pela Unity via SDK |

---

### Collection: `users`

Armazena os usuários do dashboard (professores e administradores). As senhas são armazenadas com hash bcrypt — nunca em texto puro.

**Campos:**

| Campo       | Tipo     | Obrigatório | Descrição                                  |
| ----------- | -------- | ----------- | ------------------------------------------ |
| `_id`       | ObjectId | automático  | Identificador único gerado pelo MongoDB    |
| `name`      | String   | sim         | Nome completo do usuário                   |
| `email`     | String   | sim, único  | Email de login                             |
| `password`  | String   | sim         | Senha com hash bcrypt                      |
| `role`      | String   | sim         | `"admin"` ou `"professor"`                 |
| `schoolId`  | ObjectId | não         | Referência à instituição (null para admin) |
| `createdAt` | Date     | automático  | Data de criação (Mongoose timestamps)      |
| `updatedAt` | Date     | automático  | Data da última atualização                 |

**Exemplo de documento:**

```json
{
    "_id": "ObjectId('69e9684620d65d77b316bd0e')",
    "name": "Admin",
    "email": "rodrigobichet39@gmail.com",
    "password": "$2b$10$...",
    "role": "admin",
    "schoolId": null,
    "createdAt": "2026-04-23T00:31:02.886Z",
    "updatedAt": "2026-04-28T20:29:46.883Z",
    "__v": 0
}
```

**Regras:**

- O campo `email` é único no banco (índice único criado automaticamente pelo Mongoose).
- Usuários com `role: "admin"` têm acesso irrestrito a todas as instituições e funcionalidades.
- Usuários com `role: "professor"` têm acesso apenas à sua instituição e turmas.

---

### Collection: `institutions`

Armazena as instituições de ensino parceiras do projeto.

**Campos:**

| Campo       | Tipo     | Obrigatório | Descrição                  |
| ----------- | -------- | ----------- | -------------------------- |
| `_id`       | ObjectId | automático  | Identificador único        |
| `name`      | String   | sim         | Nome da instituição        |
| `city`      | String   | não         | Cidade da instituição      |
| `createdAt` | Date     | automático  | Data de criação            |
| `updatedAt` | Date     | automático  | Data da última atualização |

**Exemplo de documento:**

```json
{
    "_id": "ObjectId('...')",
    "name": "E. M. Silveira Martins",
    "city": "Bagé",
    "createdAt": "2026-04-23T00:00:00.000Z",
    "updatedAt": "2026-04-23T00:00:00.000Z",
    "__v": 0
}
```

**Instituições parceiras do projeto:**

- E. M. Silveira Martins — Bagé/RS
- UNIPAMPA — Caçapava do Sul/RS
- APAE — Pelotas/RS

---

### Collection: `groups`

Armazena as turmas. Cada turma pertence a uma instituição.

**Campos:**

| Campo           | Tipo     | Obrigatório | Descrição                              |
| --------------- | -------- | ----------- | -------------------------------------- |
| `_id`           | ObjectId | automático  | Identificador único                    |
| `name`          | String   | sim         | Nome da turma (ex: "Turma A - 2026")   |
| `institutionId` | ObjectId | sim         | Referência à collection `institutions` |
| `createdAt`     | Date     | automático  | Data de criação                        |
| `updatedAt`     | Date     | automático  | Data da última atualização             |

**Exemplo de documento:**

```json
{
    "_id": "ObjectId('...')",
    "name": "Turma A - 2026",
    "institutionId": "ObjectId('...')",
    "createdAt": "2026-04-23T00:00:00.000Z",
    "updatedAt": "2026-04-23T00:00:00.000Z",
    "__v": 0
}
```

---

### Collection: `students`

Armazena os alunos. Cada aluno pertence a uma turma. As anotações do professor são armazenadas como array **embutido** dentro do próprio documento do aluno, sem collection separada.

**Campos:**

| Campo       | Tipo     | Obrigatório | Descrição                                   |
| ----------- | -------- | ----------- | ------------------------------------------- |
| `_id`       | ObjectId | automático  | Identificador único                         |
| `name`      | String   | sim         | Nome do aluno                               |
| `groupId`   | ObjectId | sim         | Referência à collection `groups`            |
| `anotacoes` | Array    | não         | Lista de anotações do professor (embutidas) |
| `createdAt` | Date     | automático  | Data de criação                             |
| `updatedAt` | Date     | automático  | Data da última atualização                  |

**Estrutura de cada item em `anotacoes`:**

| Campo       | Tipo     | Descrição                        |
| ----------- | -------- | -------------------------------- |
| `_id`       | ObjectId | Identificador da anotação        |
| `texto`     | String   | Conteúdo da observação           |
| `autorId`   | ObjectId | Referência ao usuário que anotou |
| `autorNome` | String   | Nome do autor (desnormalizado)   |
| `createdAt` | Date     | Data da anotação                 |

**Exemplo de documento:**

```json
{
    "_id": "ObjectId('...')",
    "name": "Maria",
    "groupId": "ObjectId('...')",
    "anotacoes": [
        {
            "_id": "ObjectId('...')",
            "texto": "Demonstrou dificuldade na categoria Higiene.",
            "autorId": "ObjectId('...')",
            "autorNome": "Prof. João",
            "createdAt": "2026-04-25T14:00:00.000Z"
        }
    ],
    "createdAt": "2026-04-23T00:00:00.000Z",
    "updatedAt": "2026-04-25T14:00:00.000Z",
    "__v": 0
}
```

**Por que as anotações são embutidas?**  
As anotações sempre são lidas junto com o perfil do aluno e não são consultadas de forma independente. Embutir é a abordagem recomendada pelo MongoDB para este padrão de acesso.

---

### Collection: `sessions`

É a collection central do sistema. Cada documento representa uma sessão de jogo enviada pelo SDK da Unity ao final de uma partida. Uma sessão corresponde a uma rodada em uma categoria específica do jogo.

**Campos de identificação:**

| Campo      | Tipo     | Obrigatório | Descrição                                                  |
| ---------- | -------- | ----------- | ---------------------------------------------------------- |
| `_id`      | ObjectId | automático  | Identificador único da sessão                              |
| `playerId` | String   | sim         | ID do aluno (referência ao `_id` da collection `students`) |
| `gameId`   | String   | sim         | Identificador do jogo (ex: `"ParaQueServe"`)               |
| `platform` | String   | sim         | Plataforma de execução (`"WebGL"` ou `"Android"`)          |
| `scene`    | String   | não         | Cena Unity onde a sessão ocorreu                           |

**Campos de tempo:**

| Campo        | Tipo   | Descrição                                |
| ------------ | ------ | ---------------------------------------- |
| `startedAt`  | Date   | Momento de início da sessão              |
| `endedAt`    | Date   | Momento de encerramento da sessão        |
| `durationMs` | Number | Duração total da sessão em milissegundos |

**Campos de eventos semânticos (específicos do Para Que Serve?):**

| Campo          | Tipo   | Descrição                                                |
| -------------- | ------ | -------------------------------------------------------- |
| `category`     | String | Categoria jogada (ex: `"Fase01"`, `"Fase02"`)            |
| `totalPhases`  | Number | Número de fases completadas na sessão                    |
| `totalAcertos` | Number | Total de acertos na sessão                               |
| `totalErros`   | Number | Total de erros na sessão                                 |
| `stars`        | Number | Estrelas recebidas ao final (1, 2 ou 3)                  |
| `events`       | Array  | Lista de eventos semânticos registrados durante a sessão |

**Estrutura de cada evento em `events`:**

| Campo       | Tipo   | Descrição                                                |
| ----------- | ------ | -------------------------------------------------------- |
| `type`      | String | Tipo do evento (`"PhaseStarted"`, `"DragAttempt"`, etc.) |
| `timestamp` | Number | Tempo relativo ao início da sessão em milissegundos      |
| `data`      | Object | Dados específicos do evento (varia conforme o `type`)    |

**Tipos de eventos registrados:**

| Tipo do evento       | Descrição                                                  |
| -------------------- | ---------------------------------------------------------- |
| `CategorySelected`   | Categoria escolhida pelo aluno                             |
| `PhaseStarted`       | Nova fase iniciada — item-alvo e 4 opções geradas          |
| `DragAttempt`        | Tentativa de arrastar — item escolhido, destino, resultado |
| `CorrectMatch`       | Pareamento correto — inclui tempo gasto na fase            |
| `WrongMatch`         | Item errado escolhido                                      |
| `PhaseCompleted`     | Fase encerrada — resumo de acertos, erros, tempo, estrelas |
| `InactivityDetected` | Período de inatividade detectado automaticamente pelo SDK  |
| `SessionEnded`       | Sessão encerrada — dispara o envio do JSON ao backend      |

**Campos de métricas consolidadas:**

| Campo                          | Tipo   | Descrição                                        |
| ------------------------------ | ------ | ------------------------------------------------ |
| `metrics.totalClicks`          | Number | Total de interações na sessão                    |
| `metrics.firstActionMs`        | Number | Tempo até a primeira ação em milissegundos       |
| `metrics.avgTimeBetweenClicks` | Number | Tempo médio entre interações                     |
| `metrics.inactivityPeriods`    | Number | Quantidade de períodos de inatividade detectados |
| `metrics.clicksByElement`      | Object | Contagem de cliques por elemento identificado    |

**Campos de rastreamento de interação:**

| Campo        | Tipo  | Descrição                                                  |
| ------------ | ----- | ---------------------------------------------------------- |
| `clicks`     | Array | Lista de cliques com elemento, coordenadas x/y e timestamp |
| `mousePath`  | Array | Caminho do cursor/toque compactado para geração de heatmap |
| `rawReports` | Array | JSON bruto completo para reprocessamento futuro            |

**Exemplo de documento (simplificado):**

```json
{
    "_id": "ObjectId('...')",
    "playerId": "ObjectId('...')",
    "gameId": "ParaQueServe",
    "platform": "WebGL",
    "category": "Fase01",
    "startedAt": "2026-04-25T14:00:00.000Z",
    "endedAt": "2026-04-25T14:05:30.000Z",
    "durationMs": 330000,
    "totalPhases": 4,
    "totalAcertos": 3,
    "totalErros": 1,
    "stars": 2,
    "metrics": {
        "totalClicks": 12,
        "firstActionMs": 4200,
        "avgTimeBetweenClicks": 8500,
        "inactivityPeriods": 1,
        "clicksByElement": {
            "opcao_1": 4,
            "opcao_3": 3
        }
    },
    "events": [
        {
            "type": "PhaseStarted",
            "timestamp": 1200,
            "data": {
                "alvo": "escova_de_dentes",
                "opcoes": ["tesoura", "escova_de_dentes", "bola", "colher"]
            }
        },
        {
            "type": "DragAttempt",
            "timestamp": 5400,
            "data": {
                "itemArrastado": "tesoura",
                "resultado": "errou"
            }
        },
        {
            "type": "CorrectMatch",
            "timestamp": 9800,
            "data": {
                "item": "escova_de_dentes",
                "tempoFaseMs": 8600
            }
        }
    ],
    "clicks": [{ "element": "opcao_1", "x": 210, "y": 380, "timestamp": 5400 }],
    "mousePath": [
        { "x": 200, "y": 350, "t": 5200 },
        { "x": 210, "y": 380, "t": 5400 }
    ],
    "rawReports": [],
    "__v": 0
}
```

---

## Índices

Os índices a seguir são recomendados para garantir bom desempenho nas queries do dashboard conforme o volume de dados crescer.

### Índices existentes (criados automaticamente pelo Mongoose)

| Collection | Campo   | Tipo  | Motivo                               |
| ---------- | ------- | ----- | ------------------------------------ |
| Todas      | `_id`   | Único | Padrão do MongoDB                    |
| `users`    | `email` | Único | Login e validação de email duplicado |

### Índices recomendados para criar no Atlas

| Collection | Campo(s)              | Tipo     | Query beneficiada                                  |
| ---------- | --------------------- | -------- | -------------------------------------------------- |
| `sessions` | `playerId`            | Simples  | Buscar todas as sessões de um aluno                |
| `sessions` | `playerId, startedAt` | Composto | Histórico de sessões de um aluno ordenado por data |
| `sessions` | `category`            | Simples  | Filtrar sessões por categoria                      |
| `students` | `groupId`             | Simples  | Listar alunos de uma turma                         |
| `groups`   | `institutionId`       | Simples  | Listar turmas de uma instituição                   |

**Como criar um índice no Atlas:**

1. Acesse o cluster no MongoDB Atlas
2. Vá em **Collections** → selecione a collection
3. Clique na aba **Indexes**
4. Clique em **Create Index**
5. Informe os campos e o tipo (1 = crescente, -1 = decrescente)

---

## Configurando o MongoDB Atlas do zero

### 1. Criar conta e cluster

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com) e crie uma conta
2. Crie um novo **Project** chamado `LUDUS`
3. Crie um **Cluster** gratuito (M0 Sandbox é suficiente para desenvolvimento)
4. Aguarde o cluster ser provisionado (alguns minutos)

### 2. Criar usuário do banco

1. No menu lateral, acesse **Database Access**
2. Clique em **Add New Database User**
3. Escolha **Password** como método de autenticação
4. Defina um nome de usuário e uma senha forte — guarde essas credenciais
5. Em **Database User Privileges**, selecione **Read and Write to any database**
6. Clique em **Add User**

### 3. Liberar acesso por IP

1. No menu lateral, acesse **Network Access**
2. Clique em **Add IP Address**
3. Para desenvolvimento local: clique em **Add Current IP Address**
4. Para produção: adicione o IP do servidor onde o backend estará hospedado
5. Para liberar qualquer IP (não recomendado em produção): use `0.0.0.0/0`

### 4. Obter a connection string

1. No cluster, clique em **Connect**
2. Selecione **Drivers**
3. Escolha **Node.js** como driver
4. Copie a connection string no formato:
    ```
    mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/<banco>?retryWrites=true&w=majority
    ```
5. Substitua `<usuario>` e `<senha>` pelas credenciais criadas no passo 2
6. Substitua `<banco>` por `test` (nome do banco atual do projeto)

### 5. Configurar o arquivo `.env`

Na raiz do diretório `backend/`, copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env` com os seus valores:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/test?retryWrites=true&w=majority
JWT_SECRET=uma_chave_secreta_longa_e_aleatoria_aqui
```

> A `JWT_SECRET` pode ser qualquer string longa e aleatória. Em produção, use um gerador de strings seguras.

### 6. Criar o primeiro administrador

Com o backend rodando e o `.env` configurado, execute o script de seed:

```bash
cd backend
# Edite o email e a senha em src/scripts/criarAdmin.js antes de rodar
node src/scripts/criarAdmin.js
```

Esse script cria o usuário administrador inicial no banco. Após criá-lo, faça login no dashboard com as credenciais definidas.

---

## Variáveis de ambiente (backend)

| Variável      | Descrição                                         | Exemplo                         |
| ------------- | ------------------------------------------------- | ------------------------------- |
| `PORT`        | Porta em que o servidor Express será iniciado     | `3000`                          |
| `MONGODB_URI` | Connection string completa do MongoDB Atlas       | `mongodb+srv://...`             |
| `JWT_SECRET`  | Chave secreta para assinar e verificar tokens JWT | `minha_chave_super_secreta_123` |

> Nunca versione o arquivo `.env` no repositório. Ele está listado no `.gitignore`.

---

## Rodando o projeto localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Preencha o .env com suas credenciais
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O dashboard estará disponível em `http://localhost:5173`.

---

## Referência de rotas (resumo)

| Método | Rota                                | Descrição                        |
| ------ | ----------------------------------- | -------------------------------- |
| POST   | `/api/sessions`                     | Recebe sessão enviada pela Unity |
| GET    | `/api/sessions/player/:playerId`    | Histórico de sessões de um aluno |
| GET    | `/api/dashboard/summary/:playerId`  | Métricas consolidadas do aluno   |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados para heatmap de uma sessão |
| GET    | `/api/dashboard/alerts/:playerId`   | Alertas pedagógicos do aluno     |
| POST   | `/api/auth/login`                   | Login no dashboard               |

A coleção completa de rotas com exemplos de requisição está em `docs/LUDUS_API.postman_collection.json`.
