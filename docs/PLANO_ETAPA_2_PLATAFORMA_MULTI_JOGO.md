# Plano técnico — Etapa 2: plataforma multi-jogo LUDUS

> Status: proposta de arquitetura e sequência de implementação. Não altera o
> modelo atual, não migra dados e não substitui o plano de telemetria já
> aprovado em `PLANO_MULTI_JOGO_TELEMETRIA.md`.

## 1. Objetivo

Evoluir o LUDUS Acompanha para que um professor possa acompanhar diferentes
jogos educacionais sem depender da estrutura específica do jogo **Para Que
Serve?** ou de um exportador externo particular.

O sistema continuará sendo uma ferramenta de apoio à observação e à mediação
pedagógica. Telemetria observacional não permite concluir automaticamente
acertos, erros, objetivos internos ou aprendizagem.

## 2. Resultado já comprovado

O MVP atual validou o fluxo completo de uma sessão observacional externa:

```text
JSON bruto do monitor externo
  -> adaptador de formato conhecido
  -> sessão canônica LUDUS observacional
  -> prévia autenticada
  -> confirmação explícita
  -> MongoDB
  -> perfil do aluno e detalhes da sessão
```

O adaptador do exportador histórico do monitor reconhece `app`, datas e
`reports[]`; preserva os eventos brutos, extrai trajetória de mouse e conta
cliques observados. Ele não cria acertos, erros, fases ou categorias.

Essa prova de conceito é deliberadamente específica. Ela demonstra o padrão
de integração, mas não significa que todo JSON arbitrário já possa ser
interpretado corretamente.

## 3. Princípio central: normalização, não adivinhação

Não é seguro aceitar qualquer JSON e deduzir seu significado automaticamente.
Por exemplo, um campo chamado `score` pode representar pontuação, moedas,
tentativas, progresso ou desempenho; uma lista de ações pode conter cliques,
logs técnicos ou eventos pedagógicos.

O LUDUS deve ser genérico em seu núcleo e explícito em cada integração:

```text
JSON recebido
  -> identificação de formato ou perfil de importação
  -> adaptador/mapeamento explícito
  -> contrato canônico LUDUS + capabilities
  -> validação e prévia
  -> persistência da sessão e proveniência
  -> dashboard orientado pelas capacidades reais
```

O arquivo original não deve ser descartado silenciosamente. A solução deve
preservar proveniência, nome do adaptador, versão e os eventos que não foram
interpretados semanticamente.

## 4. Fluxos de entrada previstos

| Fluxo | Quando usar | Tratamento |
| --- | --- | --- |
| Sessão canônica LUDUS | Jogo já integrado ao contrato | Validar e importar diretamente. |
| SDK Unity legado | Jogo **Para Que Serve?** atual | Normalizar pelo perfil de compatibilidade existente. |
| Adaptador registrado | Formato conhecido, como o monitor externo histórico | Detectar, transformar e validar. |
| Mapeamento assistido | JSON novo sem adaptador | Usuário configura campos e salva um perfil reutilizável. |
| Formato não mapeável | Não há campos mínimos confiáveis | Recusar com explicação clara, sem inventar dados. |

## 5. Registro de jogos e contexto opcional

O fluxo atual é centrado em instituição, turma e aluno. A Etapa 2 deve permitir
um caminho mais direto, sem remover o contexto escolar já existente:

```text
Entrar no LUDUS
  -> registrar ou conectar um jogo
  -> cadastrar ou selecionar aluno
  -> importar/receber sessões
  -> opcionalmente associar instituição e turma
```

### 5.1 Entidades propostas

| Entidade | Responsabilidade | Observação |
| --- | --- | --- |
| `Game` | Cadastro do jogo: `gameId`, nome, versão, origem, ícone e adaptador permitido. | Novo cadastro explícito; o `gameId` da sessão continua estável. |
| `Student` | Pessoa acompanhada. | Contexto de instituição/turma deve se tornar opcional para novos cadastros. |
| `Institution` | Contexto institucional opcional. | Dados existentes permanecem como estão. |
| `Group` | Turma opcional associada a instituição. | Não deve bloquear uso individual. |
| `ImportProfile` | Perfil reutilizável de mapeamento de um formato externo. | Deve pertencer ao usuário/instituição autorizada e ser versionado. |
| `Session` | Evidência de uma interação. | Mantém `studentId`, `gameId`, capacidades e proveniência. |

Antes de implementar, é necessário decidir se `Game` será um catálogo global
administrado ou um cadastro por instituição/usuário. A recomendação inicial é
um cadastro por organização ou usuário, com `gameId` único no escopo da origem
e nome exibível independente.

### 5.2 Compatibilidade e preservação

- Não migrar, apagar ou sobrescrever documentos existentes.
- Não remover exigências de vínculo das sessões históricas.
- Criar novos campos como opcionais e preencher somente em novos fluxos.
- Preservar integralmente os dados reais, especialmente os do Centro de
  Autismo.
- Qualquer teste com escrita deve usar aluno demonstrativo autorizado.

## 6. Registro de adaptadores

O backend deve substituir condicionais isoladas por um registro explícito de
adaptadores:

```text
AdapterRegistry
  - ludus-canonical-1.0
  - unity-para-que-serve-legacy
  - ludus-monitor-legacy-export
  - perfil-criado-pelo-usuario-x
```

Cada adaptador deve declarar:

- identificador e versão;
- regra de reconhecimento do JSON;
- campos mínimos de origem;
- transformação para a sessão canônica;
- capacidades que pode afirmar com segurança;
- limitações conhecidas;
- estratégia de `sessionId` estável e idempotente;
- limites de tamanho e quantidade de eventos;
- exemplos e testes de entrada válida e inválida.

Um adaptador nunca pode marcar `correctWrong`, `phaseEvents` ou
`categoryEvents` como disponíveis sem que a origem os forneça de maneira
documentada.

## 7. Mapeamento assistido de JSON

O mapeamento assistido atende formatos novos sem exigir alteração imediata no
código. A primeira versão deve ser guiada e conservadora, não uma tentativa de
interpretação por IA.

### 7.1 Etapas da interface

1. Enviar um arquivo JSON e visualizar sua árvore resumida.
2. Informar nome e versão do jogo ou selecionar um jogo cadastrado.
3. Escolher campos de início, fim ou duração da sessão.
4. Selecionar coleção de eventos, se existir.
5. Mapear, quando existirem, posição X/Y, timestamp, clique, movimento e
   arraste.
6. Declarar explicitamente quais capacidades são confiáveis.
7. Visualizar uma prévia normalizada, avisos e itens não mapeados.
8. Salvar opcionalmente um `ImportProfile` versionado.
9. Confirmar a importação somente após revisão.

### 7.2 Limites da primeira versão

- Não mapear automaticamente acertos ou erros a partir de nomes ambíguos.
- Não aceitar JavaScript, expressões ou transformações executáveis fornecidas
  pelo usuário; apenas uma DSL declarativa e validada.
- Não importar em lote na primeira entrega.
- Não usar screenshots sem informação clara de origem, autorização e tamanho.
- Exigir indicação visual quando timestamps, viewport ou coordenadas forem
  aproximações.

## 8. Dashboard verdadeiramente genérico

O dashboard deve escolher componentes pelo que a sessão informa, e não pelo
nome do jogo.

### 8.1 Perfil do aluno e histórico

- Exibir nome do jogo e sua versão, não somente “Sessão de jogo”.
- Permitir filtro por jogo e opção “Todos os jogos”.
- Após importar, abrir automaticamente o filtro do jogo importado ou oferecer
  atalho para a nova sessão.
- Mostrar modo de captura, origem e data de importação separadamente da data
  em que a interação ocorreu.
- Tratar “nenhuma sessão para este jogo” como estado vazio, nunca como erro de
  API.

### 8.2 Indicadores e alertas

- Ocultar acertos, erros e taxa de acerto quando `correctWrong` for `false`.
- Não derivar alertas de fase ou categoria quando essas capacidades não
  existirem.
- Revisar alertas de intervalo entre sessões para importações históricas: a
  interface deve distinguir dado antigo importado hoje de ausência recente de
  atividade no sistema.
- Usar linguagem de apoio pedagógico e evidências parciais.

### 8.3 Detalhes da sessão

- Resumir eventos repetitivos por tipo, período e quantidade.
- Manter uma visão expansível dos eventos brutos para auditoria.
- Apresentar rótulos amigáveis para eventos de adaptadores conhecidos.
- Exibir aviso quando o viewport é estimado ou quando não há imagem de fundo.
- Tornar o mapa de interação proporcional ao sistema de coordenadas declarado.
- Não chamar todos os eventos externos de `ExternalMonitorEvent` na camada de
  apresentação; o rótulo deve vir do adaptador ou do perfil de importação.

## 9. Ordem de implementação

### Marco 2.1 — Modelo e navegação

1. Desenhar wireframes do fluxo jogo → aluno → importação.
2. Definir modelo `Game` e relação opcional de aluno com instituição/turma.
3. Definir estratégia não destrutiva de compatibilidade e autorização.
4. Criar APIs de cadastro/listagem de jogos.

### Marco 2.2 — Núcleo de importação extensível

1. Extrair o adaptador atual para um `AdapterRegistry`.
2. Registrar adaptadores canônico, Unity legado e monitor externo.
3. Persistir proveniência da transformação e resumo do arquivo importado.
4. Adicionar testes de contrato por adaptador.

### Marco 2.3 — Mapeamento assistido

1. Definir o JSON declarativo de `ImportProfile`.
2. Implementar prévia de árvore e mapeamento mínimo observacional.
3. Salvar perfil versionado com autorização adequada.
4. Validar sessão normalizada antes de qualquer escrita.

### Marco 2.4 — Experiência genérica

1. Nome, versão e filtro de jogos no dashboard.
2. Resumo de eventos e visualização detalhada sob demanda.
3. Política de alertas para sessões históricas/importadas.
4. Heatmap com metadados explícitos de confiabilidade.

### Marco 2.5 — Consolidação

1. Testar com novos JSONs reais de formatos diferentes.
2. Validar persistência, idempotência e autorização.
3. Atualizar documentação de integração de terceiros.
4. Transformar decisões e resultados em evidências para dissertação e artigo.

## 10. Critérios de aceite da Etapa 2

- Um usuário consegue cadastrar um jogo e um aluno sem criar instituição ou
  turma.
- Usuários com contexto escolar podem continuar usando instituição e turma.
- Sessões históricas existentes permanecem consultáveis e sem alteração.
- O sistema aceita sessão canônica e adaptadores conhecidos de modo explícito.
- Um JSON desconhecido recebe fluxo de mapeamento ou recusa segura, nunca
  inferência pedagógica silenciosa.
- A prévia informa o que será capturado, o que não está disponível e o que é
  aproximação.
- O dashboard mostra dados de forma coerente com cada capacidade disponível.
- Importações não duplicam sessão e não sobrescrevem dados reais.

## 11. Decisões a confirmar antes de código estrutural

1. `Game` será global, por instituição ou por usuário?
2. Um aluno poderá participar de múltiplos jogos sem cadastro intermediário?
3. Instituição e turma ficam opcionais para novos alunos, mas obrigatórias
   apenas em fluxos escolares existentes?
4. Qual conjunto mínimo de campos o mapeamento assistido aceitará no primeiro
   MVP?
5. Perfis de importação poderão ser compartilhados entre professores da mesma
   instituição?
6. Como a interface deverá diferenciar sessão histórica importada, sessão em
   tempo real e sessão offline sincronizada?

## 12. Próximo passo recomendado

Antes de modificar modelos ou telas, revisar este documento e aprovar as seis
decisões acima. Em seguida, iniciar o Marco 2.1 com um wireframe e um plano de
migração não destrutiva.
