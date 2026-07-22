# Modelo de dados — Marco 2.1 multi-jogo

> Status: proposta técnica. Nenhum modelo Mongoose, dado existente ou índice
> do MongoDB é alterado por este documento.

## 1. Diagnóstico do modelo atual

| Entidade | Estado atual relevante | Consequência para o fluxo individual |
| --- | --- | --- |
| `Student` | `groupId` é obrigatório. | Não permite criar aluno fora de uma turma. |
| `Group` | Exige `institutionId`. | O contexto escolar é obrigatório indiretamente. |
| `Session` | Liga-se por `studentId` e possui `gameId` textual. | Já permite múltiplos jogos por aluno, mas não há cadastro de jogo. |
| Importação | Autoriza por usuário → instituição da turma do aluno. | Um aluno sem turma seria negado pelo fluxo atual. |

Dados existentes não devem ser convertidos em lote. Em especial, os registros
do Centro de Autismo e seus vínculos atuais devem permanecer intactos.

## 2. Princípios do novo modelo

1. Uma sessão continua vinculada canonicamente a um `studentId`.
2. Um aluno pode ter sessões de múltiplos jogos sem tabela de matrícula no
   primeiro MVP.
3. O contexto escolar continua disponível, mas passa a ser opcional em novos
   alunos.
4. Todo aluno novo deve ter um contexto de autorização: turma/instituição ou
   dono individual.
5. `gameId` textual permanece por compatibilidade; uma referência a `Game` é
   adicional e opcional.
6. Campos novos devem ser opcionais para leitura de dados históricos.

## 3. Novo modelo `Game`

### 3.1 Responsabilidade

Representar um jogo cadastrado, com nome exibível e escopo de acesso. Não
representa uma sessão, uma versão específica em execução nem garante que o
jogo emita determinada telemetria.

### 3.2 Estrutura proposta

```js
{
  gameId: "2d-project",             // estável, slug técnico
  name: "2D Project",               // exibível
  description: "",                  // opcional
  defaultVersion: "1.0",            // opcional
  sourceType: "external-json",      // sdk-ludus | external-json | manual
  active: true,

  scopeType: "personal",            // personal | institutional
  scopeKey: "user:<objectId>",      // chave estável para índice composto
  ownerUserId: ObjectId("..."),      // criador/responsável
  institutionId: null,               // preenchido no escopo institucional

  createdAt: Date,
  updatedAt: Date
}
```

### 3.3 Regras e índices

- `gameId` usa apenas minúsculas, números e hífen.
- `name` é obrigatório e pode ser editado.
- `scopeKey` é obrigatório: `user:<id>` para jogo pessoal ou
  `institution:<id>` para jogo institucional.
- Índice único proposto: `{ scopeKey: 1, gameId: 1 }`.
- Um mesmo identificador pode existir em escopos diferentes; não pode duplicar
  no mesmo escopo.
- `ownerUserId` registra autoria, mas não substitui permissões futuras por
  instituição.

### 3.4 Não usar ainda

- Não preencher retroativamente `Game` para todas as sessões históricas.
- Não trocar `Session.gameId` por `gameRef` de uma vez.
- Não criar catálogo público/global antes de definir curadoria e moderação.

## 4. Evolução não destrutiva de `Student`

### 4.1 Estrutura-alvo

```js
{
  name: "Aluno Deploy",
  birthDate: Date,

  // Contexto escolar, opcional para alunos criados no fluxo novo
  groupId: ObjectId("...") || null,
  institutionId: ObjectId("...") || null,

  // Contexto individual, obrigatório quando não houver turma
  ownerUserId: ObjectId("...") || null,

  // Proveniência do cadastro
  enrollmentMode: "individual", // individual | school | legacy

  // Campos existentes preservados
  supportLevel: "Não informado",
  otherConditions: "",
  guardianName: "",
  guardianContact: "",
  anotacoes: [],
  capturaSolicitada: false,
  capturaSolicitadaOrigem: null,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 Regras de consistência no controller

| Caso | Regra |
| --- | --- |
| Aluno escolar | `groupId` obrigatório; `institutionId` é derivado/validado da turma; `ownerUserId` pode permanecer nulo. |
| Aluno individual | `groupId` e `institutionId` nulos; `ownerUserId` obrigatório e igual ao usuário autenticado, salvo admin autorizado. |
| Aluno legado | Campos novos podem estar ausentes; leitura funciona pela turma existente. |
| Atualização | Não permitir remover turma sem definir explicitamente dono individual e confirmar a mudança de contexto. |

`institutionId` em `Student` é uma conveniência de consulta e autorização. A
turma continua sendo fonte de verdade para contexto escolar; o controller deve
impedir divergência entre `Student.institutionId` e `Group.institutionId`.

### 4.3 Índices propostos

- `{ groupId: 1, name: 1 }` para telas de turma.
- `{ ownerUserId: 1, name: 1 }` para alunos individuais.
- `{ institutionId: 1, name: 1 }` para filtros institucionais futuros.

Índices devem ser criados somente após validar volume e janela de manutenção.
Eles não exigem reescrever documentos existentes.

## 5. Evolução de `Session`

Campos atuais essenciais permanecem: `sessionId`, `studentId`, `playerId` e
`gameId`.

Campos adicionais propostos:

```js
{
  gameId: "2d-project",             // obrigatório e compatível
  gameRef: ObjectId("...") || null, // opcional, novo

  occurredAt: "2026-04-06T09:53:47.000Z", // espelha startedAt quando confiável
  importedAt: Date,                         // preenchido na importação
  syncedAt: Date || null,                   // futuro fallback offline

  importProvenance: {
    adapterId: "ludus-monitor-legacy-export",
    adapterVersion: "1.0.0",
    profileId: ObjectId("...") || null,
    sourceFileName: "opcional-e-sanitizado",
    viewportConfidence: "estimated" // declared | estimated | unknown
  }
}
```

Regras:

- `createdAt` existente não deve ser reinterpretado nem alterado.
- `occurredAt` não substitui imediatamente `startedAt`; ambos coexistem até
  uma migração de leitura futura, se necessária.
- `importedAt` esclarece que uma sessão histórica foi recebida hoje.
- Dados de origem não confiáveis devem ser sinalizados, não corrigidos por
  inferência silenciosa.

## 6. Modelo futuro `ImportProfile` (não implementar no Marco 2.1)

```js
{
  name: "Exportador X v2",
  gameRef: ObjectId("..."),
  scopeKey: "institution:<objectId>",
  version: 1,
  active: true,
  mapping: {
    rootEventsPath: "$.reports",
    startedAtPath: "$.datehourstart",
    endedAtPath: "$.datehourend",
    eventTimestampPath: "$.date"
  },
  declaredCapabilities: { mousePath: true, correctWrong: false },
  createdBy: ObjectId("..."),
  createdAt: Date,
  updatedAt: Date
}
```

O objeto `mapping` será declarativo, limitado e validado. Não aceitará código,
JavaScript, expressões executáveis ou acessos externos.

## 7. Autorização futura

O código atual de importação depende da turma. A nova função de autorização
deve seguir esta ordem:

```text
Se admin: permitir dentro do escopo administrativo existente.
Se aluno possui groupId: conferir instituição do usuário e da turma.
Se aluno é individual: conferir ownerUserId igual ao usuário autenticado.
Caso contrário: negar com 403 e registrar inconsistência para revisão.
```

Nenhuma rota de aluno, jogo ou importação deve assumir que uma consulta sem
filtro é autorizada. Listagem e busca deverão ser restringidas por escopo em
etapa própria.

## 8. Sequência segura de implementação

### Passo 1 — Adição de esquema, sem uso na interface

1. Criar `Game.js`.
2. Acrescentar campos opcionais em `Student` e `Session`.
3. Não remover `required: true` de `Student.groupId` ainda.
4. Garantir que a aplicação inicia e que documentos históricos validam.

### Passo 2 — APIs protegidas de jogos

1. Criar rotas autenticadas de listar, criar e buscar jogos no próprio escopo.
2. Validar `gameId`, escopo e duplicidade.
3. Testar com dados demonstrativos seguros.

### Passo 3 — Novo fluxo de aluno individual

1. Relaxar `groupId` apenas depois que `ownerUserId` e validação de controller
   estiverem implementados juntos.
2. Criar aluno individual sem alterar os alunos escolares existentes.
3. Adaptar autorização de importação para ambos os contextos.

### Passo 4 — Ligação opcional da sessão ao jogo cadastrado

1. No fluxo novo, validar que `gameId` pertence a jogo acessível.
2. Salvar `gameRef` quando houver correspondência.
3. Manter sessões legadas operando somente com `gameId`.

## 9. Matriz mínima de testes

| Cenário | Resultado esperado |
| --- | --- |
| Aluno atual em turma existente | Continua criando, listando e recebendo sessões. |
| Dados do Centro de Autismo | Nenhum documento alterado, removido ou reatribuído. |
| Novo jogo pessoal | Visível apenas ao dono/admin autorizado. |
| Novo aluno individual | Criado com `ownerUserId`, sem turma. |
| Professor de outra instituição | Não acessa aluno escolar fora de seu escopo. |
| Outro usuário | Não acessa aluno individual alheio. |
| Sessão Unity legada | Continua válida sem `gameRef`. |
| Sessão externa nova | Salva `gameId`, proveniência e capacidades sem semântica falsa. |

## 10. Decisões de implementação já derivadas

- Criar `Game` antes de alterar `Student`.
- Não usar `groupId` nulo sem `ownerUserId`.
- Não fazer script de migração, seed ou atualização em massa.
- Não alterar os registros do Centro de Autismo.
- Implantar modelos, autorização e UI em etapas separadas e verificáveis.
