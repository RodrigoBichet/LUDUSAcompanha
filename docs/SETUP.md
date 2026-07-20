# Documentacao tecnica - LUDUS Acompanha

> Projeto de Mestrado em Ciencia da Computacao - UFPel (2026)  
> Autor: Rodrigo Leitzke Bichet  
> Orientador: Prof. Dr. Leomar Soares da Rosa Junior

---

## Visao geral

O LUDUS Acompanha utiliza **MongoDB** como banco de dados principal, acessado por um backend **Node.js + Express** por meio do **Mongoose**.

A escolha pelo MongoDB combina com a natureza dos dados coletados pelo jogo: sessoes, eventos, caminhos do mouse, arrastes, cliques e screenshots chegam ao backend como documentos JSON.

O sistema e composto por:

- jogo Unity com SDK LUDUS;
- backend Express;
- banco MongoDB Atlas;
- dashboard React;
- pasta local de uploads para imagens de sessoes.

### Fluxo dos dados

```txt
Unity / WebGL
    -> POST /api/sessions
Backend Node.js + Express
    -> Mongoose
MongoDB Atlas
    -> API REST
Dashboard React
```

---

## Collections

O banco possui cinco collections principais:

| Collection     | Descricao                                   |
| -------------- | ------------------------------------------- |
| `users`        | Professores e administradores do sistema    |
| `institutions` | Instituicoes de ensino ou atendimento       |
| `groups`       | Turmas vinculadas a uma instituicao         |
| `students`     | Alunos vinculados a uma turma               |
| `sessions`     | Sessoes de jogo enviadas pela Unity via SDK |

---

## Collection: `users`

Armazena os usuarios do dashboard. As senhas sao armazenadas com hash bcrypt e nunca devem ser salvas em texto puro.

### Campos

| Campo           | Tipo     | Obrigatorio | Descricao                               |
| --------------- | -------- | ----------- | --------------------------------------- |
| `_id`           | ObjectId | automatico  | Identificador unico gerado pelo MongoDB |
| `name`          | String   | sim         | Nome completo do usuario                |
| `email`         | String   | sim         | Email usado no login                    |
| `password`      | String   | sim         | Senha com hash bcrypt                   |
| `role`          | String   | sim         | `"admin"` ou `"professor"`              |
| `institutionId` | ObjectId | nao         | Instituicao vinculada ao professor      |
| `createdAt`     | Date     | automatico  | Data de criacao                         |
| `updatedAt`     | Date     | automatico  | Data da ultima atualizacao              |

### Regras

- `email` e unico.
- `admin` visualiza todas as instituicoes.
- `professor` visualiza apenas a instituicao vinculada a `institutionId`.
- `institutionId` pode ficar vazio para administradores.

### Exemplo

```json
{
    "_id": "ObjectId('...')",
    "name": "Professora Demo",
    "email": "professora.demo@ludus.local",
    "password": "$2b$10$...",
    "role": "professor",
    "institutionId": "ObjectId('...')",
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

---

## Collection: `institutions`

Armazena instituicoes cadastradas no sistema.

### Campos

| Campo       | Tipo     | Obrigatorio | Descricao                  |
| ----------- | -------- | ----------- | -------------------------- |
| `_id`       | ObjectId | automatico  | Identificador unico        |
| `name`      | String   | sim         | Nome da instituicao        |
| `city`      | String   | nao         | Cidade da instituicao      |
| `createdAt` | Date     | automatico  | Data de criacao            |
| `updatedAt` | Date     | automatico  | Data da ultima atualizacao |

### Exemplo

```json
{
    "_id": "ObjectId('...')",
    "name": "Demo - Instituicao Demonstrativa",
    "city": "Cidade Ficticia",
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

---

## Collection: `groups`

Armazena turmas. Cada turma pertence a uma instituicao e pode estar vinculada a um professor.

### Campos

| Campo           | Tipo     | Obrigatorio | Descricao                   |
| --------------- | -------- | ----------- | --------------------------- |
| `_id`           | ObjectId | automatico  | Identificador unico         |
| `name`          | String   | sim         | Nome da turma               |
| `institutionId` | ObjectId | sim         | Referencia a `institutions` |
| `professorId`   | ObjectId | nao         | Referencia a `users`        |
| `createdAt`     | Date     | automatico  | Data de criacao             |
| `updatedAt`     | Date     | automatico  | Data da ultima atualizacao  |

### Exemplo

```json
{
    "_id": "ObjectId('...')",
    "name": "Demo - Turma Demonstrativa A",
    "institutionId": "ObjectId('...')",
    "professorId": "ObjectId('...')",
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

---

## Collection: `students`

Armazena alunos acompanhados pelo sistema. Cada aluno pertence a uma turma.

As anotacoes do professor ficam embutidas dentro do documento do aluno, pois sao sempre lidas junto ao perfil.

### Campos

| Campo                     | Tipo     | Obrigatorio | Descricao                                                  |
| ------------------------- | -------- | ----------- | ---------------------------------------------------------- |
| `_id`                     | ObjectId | automatico  | Identificador real do aluno                                |
| `name`                    | String   | sim         | Nome do aluno                                              |
| `birthDate`               | Date     | nao         | Data de nascimento                                         |
| `groupId`                 | ObjectId | sim         | Referencia a `groups`                                      |
| `supportLevel`            | String   | nao         | `"Nivel 1"`, `"Nivel 2"`, `"Nivel 3"` ou `"Nao informado"` |
| `otherConditions`         | String   | nao         | Campo textual para outras informacoes relevantes           |
| `guardianName`            | String   | nao         | Nome do responsavel                                        |
| `guardianContact`         | String   | nao         | Contato do responsavel                                     |
| `anotacoes`               | Array    | nao         | Observacoes registradas pelo professor                     |
| `capturaSolicitada`       | Boolean  | nao         | Indica se a proxima sessao deve salvar imagens             |
| `capturaSolicitadaOrigem` | String   | nao         | `"dashboard"`, `"unity"` ou `null`                         |
| `createdAt`               | Date     | automatico  | Data de criacao                                            |
| `updatedAt`               | Date     | automatico  | Data da ultima atualizacao                                 |

### Estrutura de `anotacoes`

| Campo       | Tipo     | Descricao                    |
| ----------- | -------- | ---------------------------- |
| `_id`       | ObjectId | Identificador da anotacao    |
| `texto`     | String   | Conteudo da observacao       |
| `autorId`   | ObjectId | Usuario que criou a anotacao |
| `autorNome` | String   | Nome do autor                |
| `createdAt` | Date     | Data de criacao da anotacao  |
| `updatedAt` | Date     | Data da ultima atualizacao   |

### Observacao sobre captura

Quando `capturaSolicitada` esta `true`, o jogo Unity deve capturar screenshots por fase na proxima sessao desse aluno. Depois que o backend recebe uma sessao contendo imagens, ele reseta:

```txt
capturaSolicitada = false
capturaSolicitadaOrigem = null
```

---

## Collection: `sessions`

Armazena sessoes de jogo enviadas pelo SDK Unity.

Cada sessao pertence a um aluno por meio de `studentId`. O campo `playerId` continua existindo para exibicao e compatibilidade historica, mas o relacionamento real com o aluno deve usar `studentId`.

### Campos principais

| Campo         | Tipo     | Obrigatorio | Descricao                                       |
| ------------- | -------- | ----------- | ----------------------------------------------- |
| `_id`         | ObjectId | automatico  | Identificador interno do MongoDB                |
| `sessionId`   | String   | sim         | Identificador unico da sessao enviado pelo jogo |
| `studentId`   | ObjectId | sim         | Referencia real ao aluno em `students`          |
| `playerId`    | String   | sim         | Nome/identificador exibivel do jogador          |
| `gameId`      | String   | sim         | Identificador do jogo, ex: `para-que-serve`     |
| `gameVersion` | String   | nao         | Versao do jogo ou dataset                       |
| `platform`    | String   | nao         | Plataforma, ex: `WebGL`                         |
| `startedAt`   | String   | nao         | Inicio da sessao                                |
| `endedAt`     | String   | nao         | Fim da sessao                                   |
| `durationMs`  | Number   | nao         | Duracao total em milissegundos                  |

### `metrics`

| Campo                     | Tipo   | Descricao                                   |
| ------------------------- | ------ | ------------------------------------------- |
| `totalClicks`             | Number | Total de interacoes/cliques                 |
| `totalCorrect`            | Number | Total de acertos                            |
| `totalWrong`              | Number | Total de erros                              |
| `firstActionMs`           | Number | Tempo ate a primeira acao                   |
| `avgTimeBetweenActionsMs` | Number | Tempo medio entre acoes                     |
| `inactivityCount`         | Number | Quantidade de periodos de inatividade       |
| `totalInactivityMs`       | Number | Tempo total de inatividade em milissegundos |

### `clicks`

Lista de cliques ou toques registrados durante a sessao.

| Campo       | Tipo   | Descricao                |
| ----------- | ------ | ------------------------ |
| `element`   | String | Elemento clicado         |
| `x`         | Number | Coordenada X normalizada |
| `y`         | Number | Coordenada Y normalizada |
| `timestamp` | Number | Tempo relativo da acao   |

### `mousePath`

Caminho do cursor/toque usado no mapa de interacoes.

| Campo | Tipo   | Descricao                |
| ----- | ------ | ------------------------ |
| `x`   | Number | Coordenada X normalizada |
| `y`   | Number | Coordenada Y normalizada |
| `t`   | Number | Tempo relativo           |

### `dragPath`

Caminho registrado quando o aluno segura e arrasta um item.

| Campo     | Tipo   | Descricao                                     |
| --------- | ------ | --------------------------------------------- |
| `element` | String | Elemento arrastado                            |
| `x`       | Number | Coordenada X normalizada                      |
| `y`       | Number | Coordenada Y normalizada                      |
| `t`       | Number | Tempo relativo                                |
| `state`   | String | Estado do arraste, ex: `start`, `move`, `end` |

### `gameEvents`

Eventos semanticos enviados pelo jogo.

| Campo       | Tipo   | Descricao                              |
| ----------- | ------ | -------------------------------------- |
| `eventType` | String | Tipo do evento                         |
| `timestamp` | Number | Tempo relativo ao inicio da sessao     |
| `payload`   | String | JSON serializado com dados especificos |

Tipos comuns:

| Evento               | Descricao                         |
| -------------------- | --------------------------------- |
| `CategorySelected`   | Categoria escolhida               |
| `PhaseStarted`       | Fase iniciada, item alvo e opcoes |
| `DragAttempt`        | Tentativa de arraste              |
| `WrongMatch`         | Item incorreto selecionado        |
| `CorrectMatch`       | Item correto selecionado          |
| `PhaseCompleted`     | Fase concluida                    |
| `InactivityDetected` | Periodo de inatividade            |
| `SessionEnded`       | Sessao encerrada                  |

### `screenshots`

Imagens capturadas por fase quando a captura estava ativa.

| Campo       | Tipo   | Descricao                                            |
| ----------- | ------ | ---------------------------------------------------- |
| `faseIndex` | Number | Indice da fase, iniciando em 0                       |
| `timestamp` | Number | Tempo relativo da captura                            |
| `caminho`   | String | Caminho publico da imagem em `/uploads/screenshots/` |

O backend nao salva `screenshotBase64` no banco. Ele recebe a imagem em base64, grava o arquivo em disco e armazena apenas o caminho publico.

---

## Identificacao do aluno

O identificador correto para relacionar sessoes e alunos e:

```txt
studentId
```

`studentId` referencia o `_id` do documento em `students`.

`playerId` continua existindo para exibicao, compatibilidade e leitura humana, mas nao deve ser usado como chave principal de relacionamento.

Esse ajuste evita que alunos com nomes iguais ou reutilizados recebam sessoes antigas indevidamente.

---

## Indices recomendados

### Ja existentes ou esperados

| Collection | Campo       | Tipo  | Motivo                                    |
| ---------- | ----------- | ----- | ----------------------------------------- |
| Todas      | `_id`       | Unico | Padrao do MongoDB                         |
| `users`    | `email`     | Unico | Login e validacao de email duplicado      |
| `sessions` | `sessionId` | Unico | Evita registrar a mesma sessao duas vezes |

### Recomendados para criar/confirmar no Atlas

| Collection | Campo(s)               | Tipo     | Query beneficiada                |
| ---------- | ---------------------- | -------- | -------------------------------- |
| `sessions` | `studentId`            | Simples  | Buscar sessoes de um aluno       |
| `sessions` | `studentId, startedAt` | Composto | Historico ordenado de sessoes    |
| `sessions` | `gameId`               | Simples  | Filtro por jogo acompanhado      |
| `students` | `groupId`              | Simples  | Listar alunos de uma turma       |
| `groups`   | `institutionId`        | Simples  | Listar turmas de uma instituicao |
| `groups`   | `professorId`          | Simples  | Buscar turmas de um professor    |

---

## Configurando o MongoDB Atlas do zero

### 1. Criar conta e cluster

1. Acesse `https://cloud.mongodb.com`.
2. Crie um projeto para o LUDUS.
3. Crie um cluster MongoDB Atlas.
4. Aguarde o provisionamento.

### 2. Criar usuario do banco

1. Acesse **Database Access**.
2. Clique em **Add New Database User**.
3. Escolha autenticacao por senha.
4. Defina usuario e senha fortes.
5. Conceda permissao de leitura e escrita no banco usado pelo projeto.

### 3. Liberar acesso por IP

1. Acesse **Network Access**.
2. Clique em **Add IP Address**.
3. Para desenvolvimento local, adicione seu IP atual.
4. Para producao, adicione o IP do servidor do backend.
5. Evite `0.0.0.0/0` em producao.

### 4. Obter connection string

No cluster, clique em **Connect** e copie a connection string do driver Node.js:

```txt
mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/<banco>?retryWrites=true&w=majority
```

Substitua:

- `<usuario>` pelo usuario criado;
- `<senha>` pela senha criada;
- `<banco>` pelo nome do banco usado pelo projeto.

---

## Variaveis de ambiente do backend

Na pasta `backend/`, crie o arquivo `.env` com base em `.env.example`.

Exemplo:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/test?retryWrites=true&w=majority
JWT_SECRET=uma_chave_secreta_longa_e_aleatoria
```

| Variavel      | Descricao                                   | Exemplo             |
| ------------- | ------------------------------------------- | ------------------- |
| `PORT`        | Porta do servidor Express                   | `3000`              |
| `MONGODB_URI` | Connection string completa do MongoDB Atlas | `mongodb+srv://...` |
| `JWT_SECRET`  | Chave para assinar e verificar tokens JWT   | string longa        |

Nunca versione o arquivo `.env`.

---

## Ambiente publicado e deploy

O primeiro ambiente publico foi publicado em **20/07/2026**.

| Componente | Plataforma | URL |
| ---------- | ---------- | --- |
| Backend/API | Render (Free, Oregon) | `https://ludus-acompanha-api.onrender.com` |
| Frontend/dashboard | Netlify | `https://ludus-acompanha.netlify.app` |

### Backend no Render

Configuracao aplicada:

```txt
Repository: RodrigoBichet/LUDUSAcompanha
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

Variaveis configuradas no Render:

```env
MONGODB_URI=<connection-string-do-Atlas>
JWT_SECRET=<segredo-gerado-ou-definido-em-ambiente-seguro>
```

Nao definir `PORT` manualmente: o Render fornece a porta pelo ambiente. O health check esta disponivel em `GET /` e deve retornar `status: "ok"`.

### Frontend no Netlify

Configuracao aplicada:

```txt
Repository: RodrigoBichet/LUDUSAcompanha
Branch: main
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

Variaveis publicas configuradas no Netlify:

```env
VITE_API_URL=https://ludus-acompanha-api.onrender.com/api
VITE_BACKEND_ORIGIN=https://ludus-acompanha-api.onrender.com
VITE_MODO_ANONIMO=false
```

O arquivo `frontend/public/_redirects` contem `/* /index.html 200`, necessario para que rotas React, como `/login`, `/aluno/:id` e `/sessao/:sessionId`, funcionem ao abrir ou recarregar diretamente.

### Seguranca, CORS e limitacoes atuais

- o CORS do backend esta aberto temporariamente com `app.use(cors())`; depois de estabilizar o ambiente, restringir as origens ao dominio do Netlify e ao desenvolvimento local;
- valores de `MONGODB_URI`, `JWT_SECRET`, senhas e tokens devem existir apenas nos provedores e nos arquivos `.env` locais ignorados pelo Git;
- como o plano Free do Render pode hibernar, o primeiro acesso apos inatividade pode demorar;
- o filesystem do Render e efemero. Portanto, screenshots em `backend/uploads/screenshots/` podem desaparecer depois de reinicios ou redeploys. Antes de uso continuado com dados reais, migrar imagens para storage persistente, como Cloudinary, S3 ou R2;
- o jogo Unity permanece configurado inicialmente para `localhost`; apontar o SDK e os controladores do jogo para a API publicada exige uma etapa propria e novo build WebGL.

---

## Uploads e persistencia de imagens

As imagens capturadas durante as sessoes do jogo sao salvas localmente pelo backend em:

```txt
backend/uploads/screenshots/
```

Essa pasta e servida pelo Express pela rota publica:

```txt
/uploads
```

Exemplo de caminho salvo em uma sessao:

```txt
/uploads/screenshots/<sessionId>_fase0.jpg
```

### Controle no Git

A pasta `backend/uploads/` esta no `.gitignore` e nao deve ser versionada.

Isso evita que screenshots geradas em desenvolvimento, testes ou demonstracoes sejam enviadas para o repositorio.

### Cuidados em producao

Em ambiente de producao, `backend/uploads/` deve ser tratado como armazenamento persistente. Se o backend for hospedado em VM, container ou servico com deploy automatizado, a pasta precisa permanecer fora do ciclo de recriacao da aplicacao.

Recomendacoes:

- configurar `backend/uploads/` como volume persistente quando usar Docker ou ambiente semelhante;
- manter backup periodico se as imagens forem relevantes para acompanhamento;
- evitar apagar a pasta em processos de deploy;
- monitorar o crescimento do diretorio conforme o uso de screenshots aumentar;
- considerar uma politica futura de limpeza ou arquivamento para sessoes antigas;
- nunca publicar screenshots com dados reais em repositorios, artigos ou materiais sem anonimizar e validar o uso.

### Relacao com exclusao em cascata

Quando alunos, turmas ou instituicoes sao excluidos, o backend remove tambem as sessoes vinculadas e tenta apagar os arquivos de screenshots associados por meio do helper:

```txt
backend/src/utils/removerSessoes.js
```

Esse comportamento reduz acumulo de arquivos sem referencia no banco, mas nao substitui uma politica de backup ou limpeza em producao.

---

## Rodando o projeto localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O backend inicia em:

```txt
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O dashboard inicia em:

```txt
http://localhost:5173
```

---

## Criar o primeiro administrador

Com o `.env` configurado, execute o script de criacao do administrador inicial:

```bash
cd backend
node src/scripts/criarAdmin.js
```

Antes de rodar, confira o email e a senha definidos no script.

---

## Datasets demonstrativos

O projeto possui scripts para gerar dados sinteticos e anonimos de demonstracao.

### Dataset fixo

```bash
cd backend
npm run seed:demo
```

Login gerado:

```txt
Email: professora.demo@ludus.local
Senha: Demo@2026
```

### Dataset random

```bash
cd backend
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1 --seed=2026
```

Login gerado:

```txt
Email: professor.random.demo@ludus.local
Senha: Demo@2026
```

Modos uteis:

```bash
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append --no-screenshots
```

Observacoes:

- sem `--append`, o dataset random anterior e recriado;
- com `--append`, novos lotes sao adicionados;
- com `--no-screenshots`, as sessoes sao criadas sem imagens;
- quando `--seed` nao e informado, o script usa a data/hora atual.

---

## Referencia de rotas

### Health check

| Metodo | Rota | Descricao                  |
| ------ | ---- | -------------------------- |
| GET    | `/`  | Verifica se a API responde |

### Autenticacao

| Metodo | Rota               | Descricao              |
| ------ | ------------------ | ---------------------- |
| POST   | `/api/auth/login`  | Login no dashboard     |
| GET    | `/api/auth/me`     | Usuario autenticado    |
| PUT    | `/api/auth/perfil` | Atualiza perfil logado |

### Unity

| Metodo | Rota                                        | Descricao                                |
| ------ | ------------------------------------------- | ---------------------------------------- |
| GET    | `/api/unity/schools`                        | Lista instituicoes para o jogo           |
| GET    | `/api/unity/groups/:institutionId`          | Lista turmas da instituicao              |
| GET    | `/api/unity/students/:groupId`              | Lista alunos da turma                    |
| POST   | `/api/unity/students/:id/solicitar-captura` | Liga/desliga captura de imagem pelo jogo |

### Instituicoes, turmas e alunos

| Metodo | Rota                                  | Descricao                           |
| ------ | ------------------------------------- | ----------------------------------- |
| GET    | `/api/institutions`                   | Lista instituicoes                  |
| POST   | `/api/institutions`                   | Cria instituicao                    |
| GET    | `/api/institutions/:id`               | Busca instituicao                   |
| PUT    | `/api/institutions/:id`               | Atualiza instituicao                |
| DELETE | `/api/institutions/:id`               | Remove instituicao em cascata       |
| GET    | `/api/groups`                         | Lista turmas                        |
| POST   | `/api/groups`                         | Cria turma                          |
| GET    | `/api/groups/:id`                     | Busca turma                         |
| PUT    | `/api/groups/:id`                     | Atualiza turma                      |
| DELETE | `/api/groups/:id`                     | Remove turma em cascata             |
| GET    | `/api/students`                       | Lista alunos                        |
| POST   | `/api/students`                       | Cria aluno                          |
| GET    | `/api/students/:id`                   | Busca aluno                         |
| PUT    | `/api/students/:id`                   | Atualiza aluno                      |
| DELETE | `/api/students/:id`                   | Remove aluno e sessoes              |
| POST   | `/api/students/:id/anotacoes`         | Adiciona anotacao                   |
| PATCH  | `/api/students/:id/solicitar-captura` | Liga/desliga captura pelo dashboard |

### Sessoes e dashboard

| Metodo | Rota                                | Descricao                        |
| ------ | ----------------------------------- | -------------------------------- |
| POST   | `/api/sessions`                     | Recebe sessao enviada pela Unity |
| GET    | `/api/sessions`                     | Lista sessoes para debug         |
| GET    | `/api/sessions/:sessionId`          | Busca sessao especifica          |
| GET    | `/api/sessions/student/:studentId`  | Historico de sessoes de um aluno |
| GET    | `/api/dashboard/summary/:studentId` | Resumo consolidado do aluno      |
| GET    | `/api/dashboard/alerts/:studentId`  | Indicadores pedagogicos do aluno |
| GET    | `/api/dashboard/heatmap/:sessionId` | Dados para o mapa de interacoes  |

As rotas de resumo, historico e indicadores aceitam filtro opcional por jogo:

```txt
?gameId=para-que-serve
```

---

## Exclusao em cascata

O backend remove dados dependentes quando entidades principais sao excluidas:

- excluir aluno remove suas sessoes e imagens vinculadas;
- excluir turma remove alunos, sessoes e imagens vinculadas;
- excluir instituicao remove turmas, alunos, sessoes e imagens vinculadas, alem de desvincular usuarios associados.

As imagens sao removidas pelo helper:

```txt
backend/src/utils/removerSessoes.js
```

---

## Cuidados eticos e de privacidade

O LUDUS Acompanha e uma ferramenta de apoio pedagogico. Os indicadores apresentados pelo dashboard e pelo PDF nao devem ser interpretados como diagnostico clinico, classificacao definitiva do estudante ou medida isolada de aprendizagem.

Recomendacoes:

- usar linguagem pedagogica e nao diagnostica em relatorios e apresentacoes;
- evitar publicar dados reais de alunos, professores ou instituicoes;
- anonimizar prints usados em artigos, slides e documentos;
- usar datasets demonstrativos para testes publicos e reproducao tecnica;
- tratar screenshots reais como dados sensiveis do contexto educacional.

---

## Checklist tecnico rapido

Antes de demonstrar ou entregar o ambiente, conferir:

- backend inicia sem erro;
- frontend inicia sem erro;
- MongoDB conecta corretamente;
- login admin funciona;
- login professor funciona;
- professor visualiza apenas sua instituicao;
- `npm run seed:demo` funciona;
- `npm run seed:demo:random` funciona;
- sessoes sao vinculadas por `studentId`;
- heatmap funciona com screenshots;
- heatmap funciona sem screenshots;
- exclusao em cascata remove sessoes e imagens;
- `backend/uploads/` nao aparece como arquivo versionado no Git.
- health check publicado responde `200 OK`;
- dashboard publicado abre e permite login;
- rotas React carregam diretamente no Netlify;
- configuracoes e segredos do deploy nao foram versionados.
