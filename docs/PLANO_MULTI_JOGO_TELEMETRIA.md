# Plano técnico — MVP multi-jogo de telemetria LUDUS

> Status: proposta aprovada para orientar o MVP. Este documento não altera o
> contrato já publicado, nem implica mudança imediata no SDK Unity, backend ou
> dashboard.

## 1. Objetivo

Evoluir o LUDUS Acompanha de uma integração específica com o jogo **Para Que
Serve?** para uma plataforma capaz de receber, validar, normalizar e apresentar
telemetria de diferentes jogos educacionais.

O objetivo é apoiar a observação e a mediação pedagógica por meio de evidências
parciais de interação. O sistema não realiza diagnóstico, classificação clínica
ou avaliação definitiva de aprendizagem.

## 2. Situação de partida

Hoje, o jogo Unity envia uma sessão completa ao final de cada categoria para
`POST /api/sessions`. O modelo persistido contém identificação, métricas,
interações brutas, eventos semânticos e screenshots opcionais.

```text
Jogo Unity/WebGL
  -> JSON da sessão
  -> API Express
  -> MongoDB
  -> dashboard React
```

Características que devem ser preservadas:

- `studentId` é o vínculo canônico com o aluno; `playerId` é exibível e
  compatível com dados históricos;
- uma categoria jogada gera uma sessão;
- eventos semânticos ficam em `gameEvents[]`;
- o SDK possui fallback offline;
- sessões antigas devem continuar legíveis.

Limitações atuais relevantes para a evolução:

- o formato de sessão espelha diretamente o SDK Unity;
- não há `schemaVersion`, `captureMode`, `source` ou `capabilities`;
- `gameEvents[].payload` é um JSON serializado em uma string;
- o dashboard pressupõe acertos, erros e fases em toda sessão;
- a documentação histórica descreve coordenadas normalizadas, enquanto o SDK
  atual registra coordenadas em pixels de tela;
- screenshots usam filesystem local do backend, que é efêmero no Render.

## 3. Escopo do MVP

O MVP multi-jogo terá duas formas de captura percebidas pelo usuário:

1. **Captura observacional**: coleta interações externas sem modificar o jogo.
2. **Integração completa por SDK**: coleta interações e eventos semânticos
   emitidos pelo próprio jogo.

Também existirá uma camada técnica comum de importação e normalização de JSON.
Ela não é um terceiro modo de captura: é o caminho pelo qual uma sessão bruta
se torna uma sessão canônica LUDUS.

```text
SDK Unity / capturador observacional / JSON de jogo externo
  -> validação do formato de origem
  -> adaptador da origem
  -> normalização para o contrato LUDUS
  -> persistência
  -> APIs e dashboard orientados por capacidades
```

Ficam fora do escopo inicial:

- inferir automaticamente acertos, erros, objetivos ou conclusão de fase a
  partir de capturas externas;
- criar imediatamente uma extensão Chrome ou aplicativo auxiliar;
- reescrever o SDK Unity atual;
- migrar ou apagar sessões existentes;
- produzir indicadores que substituam a observação docente.

## 4. Princípios do contrato

### 4.1 Sessão canônica e dados brutos

O backend deve distinguir, nas etapas futuras, dois formatos:

- **sessão bruta**: JSON como foi emitido por um SDK, capturador ou sistema
  externo;
- **sessão canônica LUDUS**: estrutura interna validada e normalizada, usada
  pelo banco e pelo dashboard.

Um arquivo externo pode não conter `studentId`. No fluxo de importação, o
usuário autorizado selecionará o aluno e o jogo antes da persistência. A sessão
canônica resultante sempre deverá conter `studentId`, `sessionId` e `gameId`.

### 4.2 Capacidades acima de suposições

Uma capacidade declarada informa se determinado tipo de dado pode existir em
uma sessão. Isso evita interpretar um campo ausente como zero.

Exemplos:

- `correctWrong: false` significa que a sessão não oferece base para taxa de
  acerto, não que o aluno teve zero acertos;
- `screenshots: true` com `screenshots: []` significa que a fonte suporta
  imagens, mas nenhuma foi registrada naquela sessão;
- `phaseEvents: false` impede a divisão artificial do heatmap por fases.

### 4.3 Compatibilidade progressiva

Sessões atuais continuarão sendo aceitas e exibidas. Quando não houver novos
metadados, a camada de compatibilidade deverá tratá-las como perfil legado do
SDK Unity do jogo **Para Que Serve?**, sem exigir migração destrutiva.

## 5. Metadados mínimos do contrato LUDUS

O formato canônico passa a incluir os seguintes metadados no nível da sessão:

```json
{
  "schemaVersion": "1.0.0",
  "captureMode": "observational",
  "source": "browser-extension",
  "sourceVersion": "0.1.0",
  "ingestionMethod": "file-import",
  "capabilities": {
    "clicks": true,
    "mousePath": true,
    "dragPath": true,
    "screenshots": false,
    "inactivity": true,
    "focusEvents": true,
    "phaseEvents": false,
    "correctWrong": false,
    "categoryEvents": false,
    "customEvents": false
  }
}
```

### 5.1 `schemaVersion`

- Usa versionamento semântico, iniciando em `1.0.0`.
- Uma alteração incompatível exige nova versão principal.
- O validador deve rejeitar versões não suportadas com mensagem clara.
- Ausência do campo identifica uma sessão legada, não uma sessão inválida.

### 5.2 `captureMode`

Valores iniciais permitidos:

| Valor | Significado |
| --- | --- |
| `observational` | Interações observáveis externamente, sem garantia de semântica interna do jogo. |
| `sdk` | Jogo instrumentado, capaz de emitir eventos semânticos definidos pela integração. |

O método pelo qual a sessão chegou ao LUDUS não deve ser confundido com o modo
de captura. Por isso, `ingestionMethod` usará inicialmente `direct-api` ou
`file-import`.

### 5.3 `source` e `sourceVersion`

`source` identifica a origem técnica, por exemplo `unity-sdk`,
`browser-extension`, `desktop-capturer` ou `external-json-adapter`.
`sourceVersion` é opcional, mas recomendada para depuração e reprodutibilidade.

### 5.4 `capabilities`

O conjunto inicial de capacidades é:

| Capacidade | Significado |
| --- | --- |
| `clicks` | Registra cliques ou toques pontuais. |
| `mousePath` | Registra trajetória do cursor ou toque. |
| `dragPath` | Registra início, percurso ou término de arrastes. |
| `screenshots` | Pode registrar imagens ou referências de imagem. |
| `inactivity` | Pode registrar períodos sem interação. |
| `focusEvents` | Pode registrar ganho/perda de foco ou visibilidade. |
| `phaseEvents` | Pode identificar início ou fim de fases. |
| `correctWrong` | Pode identificar acertos e erros emitidos pelo jogo. |
| `categoryEvents` | Pode identificar categoria, atividade ou contexto equivalente. |
| `customEvents` | Pode fornecer eventos específicos do jogo com contrato próprio. |

Novas capacidades podem ser adicionadas em versão compatível do schema. A
ausência de uma capacidade desconhecida não deve ser interpretada como `true`.

## 6. Estrutura canônica proposta

O contrato abaixo é uma referência de planejamento. Os exemplos executáveis e
o JSON Schema formal serão produzidos na etapa seguinte.

```json
{
  "schemaVersion": "1.0.0",
  "captureMode": "sdk",
  "source": "unity-sdk",
  "sourceVersion": "1.0.0",
  "ingestionMethod": "direct-api",
  "capabilities": {},

  "sessionId": "uuid-ou-identificador-estavel",
  "studentId": "object-id-do-aluno",
  "playerId": "nome-para-exibicao",
  "gameId": "identificador-do-jogo",
  "gameVersion": "versao-do-jogo",
  "platform": "WebGL",

  "startedAt": "2026-07-20T20:00:00.000Z",
  "endedAt": "2026-07-20T20:04:30.000Z",
  "durationMs": 270000,

  "viewport": {
    "widthPx": 1280,
    "heightPx": 720,
    "coordinateUnit": "normalized",
    "coordinateOrigin": "top-left"
  },

  "metrics": {},
  "clicks": [],
  "mousePath": [],
  "dragPath": [],
  "gameEvents": [],
  "screenshots": []
}
```

### 6.1 Identificação

| Campo | Regra |
| --- | --- |
| `sessionId` | Obrigatório e único após normalização; usado para idempotência. |
| `studentId` | Obrigatório na sessão canônica; deve referenciar aluno existente e autorizado. |
| `playerId` | Exibível; preenchido ou confirmado a partir do aluno vinculado. |
| `gameId` | Obrigatório; identificador estável e sem depender do nome visível do jogo. |
| `gameVersion` | Recomendado; identifica o build ou versão da origem. |
| `platform` | Recomendado; por exemplo `WebGL`, `Windows`, `Android` ou `browser`. |

### 6.2 Tempo

- `startedAt` e `endedAt`, quando disponíveis, usam ISO 8601 em UTC.
- `durationMs` e timestamps de eventos usam milissegundos relativos ao início
  da sessão.
- Timestamps relativos não podem ser negativos.
- Eventos devem ser ordenados ou ordenáveis cronologicamente.
- Se uma origem não tiver horário absoluto confiável, a sessão pode ser
  importada com o horário de ingestão claramente registrado como proveniência,
  sem inventar o horário da jogatina.

### 6.3 Coordenadas e viewport

Para tornar heatmaps comparáveis entre jogos, resoluções e dispositivos, toda
sessão nova deverá informar o sistema de coordenadas:

| Campo | Valores iniciais | Regra |
| --- | --- | --- |
| `coordinateUnit` | `normalized`, `pixel` | O formato canônico prefere `normalized` entre 0 e 1. |
| `coordinateOrigin` | `top-left`, `bottom-left` | Define a origem do eixo Y. |
| `widthPx` / `heightPx` | números positivos | Necessários para desenhar ou converter coordenadas de pixel. |

O adaptador legado deve reconhecer que o Unity atual usa pixels com origem no
canto inferior esquerdo. Dados antigos sem dimensões preservam seus valores
originais e devem ser exibidos com a melhor aproximação disponível, sem alegar
normalização que não ocorreu.

### 6.4 Métricas

Métricas agregadas são conveniência de leitura, não substituto dos dados de
origem. Onde possível, o normalizador deverá calcular ou conferir métricas a
partir de eventos e interações.

Os campos atuais podem permanecer por compatibilidade:

```json
{
  "totalClicks": 0,
  "totalCorrect": 0,
  "totalWrong": 0,
  "firstActionMs": -1,
  "avgTimeBetweenActionsMs": 0,
  "inactivityCount": 0,
  "totalInactivityMs": 0
}
```

`totalCorrect` e `totalWrong` só podem alimentar indicadores quando
`capabilities.correctWrong` for `true`. Valores ausentes não devem ser
preenchidos silenciosamente com zero para fins de apresentação pedagógica.

### 6.5 Interações brutas

As coleções mantêm compatibilidade nominal com o formato atual:

| Coleção | Campos mínimos | Condição |
| --- | --- | --- |
| `clicks[]` | `x`, `y`, `timestamp`; `element` opcional | `capabilities.clicks` |
| `mousePath[]` | `x`, `y`, `t` | `capabilities.mousePath` |
| `dragPath[]` | `x`, `y`, `t`; `element` e `state` opcionais | `capabilities.dragPath` |
| `screenshots[]` | timestamp, referência de imagem e contexto disponível | `capabilities.screenshots` |

O nome de elemento pode ser `unknown` quando a origem não tem acesso à
semântica da interface. Ele não deve ser inventado por inferência visual.

### 6.6 Eventos semânticos

Para o contrato canônico, eventos terão:

```json
{
  "eventType": "PhaseStarted",
  "timestamp": 1250,
  "payload": {
    "phaseId": "fase-1",
    "label": "Atividade inicial"
  }
}
```

A recomendação é que `payload` seja um objeto JSON no formato canônico. O
adaptador legado aceitará temporariamente a string JSON produzida pelo SDK
atual, fará o parse seguro quando possível e preservará o conteúdo original
quando não puder interpretá-lo.

Tipos semânticos comuns:

- `CategorySelected`;
- `PhaseStarted`;
- `DragAttempt`;
- `CorrectMatch`;
- `WrongMatch`;
- `PhaseCompleted`;
- `InactivityDetected`;
- `FocusLost` e `FocusGained`;
- `SessionEnded`.

Jogos externos poderão definir eventos próprios. Eles exigirão namespace ou
documentação de adaptador antes de gerar indicadores pedagógicos específicos.

## 7. Regras por modo de captura

### 7.1 Modo observacional

Pode capturar, conforme o ambiente:

- mouse, toque, cliques e arrastes;
- duração, início/fim manual e inatividade;
- foco, visibilidade e dimensões de viewport/canvas;
- screenshots ou frames autorizados.

Não pode prometer identificar corretamente, sem integração com o jogo:

- acertos e erros;
- item esperado ou selecionado;
- objetivo pedagógico;
- início, término ou sucesso de fase;
- conclusão real da atividade.

Mensagem padrão para a interface:

> Esta sessão contém dados observacionais de interação. Ela não possui eventos
> semânticos suficientes para inferir automaticamente acertos, erros ou
> objetivos internos do jogo.

### 7.2 Modo SDK

Um jogo integrado pode fornecer, além das interações brutas:

- fases, categorias ou atividades;
- tentativas, acertos e erros emitidos pela própria lógica do jogo;
- itens, opções e contexto da tarefa;
- tempo por fase;
- screenshots opcionais;
- eventos específicos documentados pelo integrador.

O SDK deve continuar plugável. Ele não deve levar regras pedagógicas ou lógica
específica de um jogo para seu núcleo comum.

## 8. Validação, normalização e segurança

A implementação posterior deverá tratar todo JSON recebido como entrada não
confiável. A sequência recomendada é:

1. validar tamanho, tipo MIME e sintaxe JSON;
2. identificar `schemaVersion` ou perfil legado;
3. validar estrutura e tipos do formato de origem;
4. validar limites de arrays, strings, imagens e timestamps;
5. vincular a sessão a aluno e jogo autorizados;
6. aplicar adaptador e normalização;
7. conferir idempotência por `sessionId`;
8. persistir a sessão canônica e registrar a proveniência;
9. devolver erros claros sem expor segredos ou detalhes internos.

Regras relevantes:

- o importador do dashboard deve exigir autenticação e respeitar a instituição
  autorizada do usuário;
- o envio direto por SDK precisará de estratégia própria de autenticação ou
  credencial de integração, sem afrouxar as regras existentes;
- `sessionId`, nomes de arquivos e referências de imagem devem ser
  sanitizados;
- base64 de screenshot só pode existir no ingresso e sob limites explícitos;
- o limite global atual de JSON não basta: devem existir limites por coleção,
  evento e imagem;
- o armazenamento persistente de imagens é uma decisão posterior e não deve
  ser mascarado pelo filesystem efêmero do Render.

## 9. Compatibilidade legada

No MVP, sessões já salvas não serão modificadas em lote. A leitura ou
normalização deverá aplicar o seguinte perfil quando os novos metadados
estiverem ausentes:

| Metadado ausente | Tratamento legado recomendado |
| --- | --- |
| `schemaVersion` | Identificar como `legacy-unversioned`. |
| `captureMode` | Considerar `sdk` por origem conhecida do Unity atual. |
| `source` | Considerar `unity-sdk-para-que-serve`. |
| `capabilities` | Inferir com cautela a partir dos campos e eventos presentes. |
| `viewport` | Preservar coordenadas originais; não alegar conversão não verificável. |
| `payload` textual | Aceitar e fazer parse seguro apenas quando necessário. |

O comportamento legado serve para preservar visualização e relatórios atuais;
não deve ser usado para deduzir dados que não existiam na sessão.

## 10. Dashboard orientado por capacidades

O dashboard futuro deverá consultar capacidades antes de apresentar indicadores.

| Recurso visual | Capacidade necessária | Comportamento quando indisponível |
| --- | --- | --- |
| Taxa de acerto e alertas relacionados | `correctWrong` | Ocultar métrica e explicar indisponibilidade. |
| Agrupamento por fase | `phaseEvents` | Exibir visão geral cronológica, sem criar fases fictícias. |
| Categoria/atividade | `categoryEvents` | Usar rótulo neutro de sessão de jogo. |
| Heatmap de trajetória | `mousePath` | Ocultar a camada de movimento. |
| Cliques | `clicks` | Ocultar a camada de cliques. |
| Arrastes | `dragPath` | Ocultar a camada de arraste. |
| Imagem de fundo | `screenshots` | Usar fundo neutro, sem indicar que uma imagem está ausente por falha. |
| Pausas | `inactivity` | Não calcular alerta de inatividade. |

O número de fases não deve ser fixo. A interface deve gerar abas e cores a
partir das fases disponíveis ou não exibir abas quando não houver eventos de
fase confiáveis.

## 11. Privacidade, ética e uso acadêmico

- Priorizar dados mínimos necessários ao acompanhamento pedagógico.
- Solicitar e documentar autorização apropriada para screenshots ou captura de
  tela, especialmente em ambientes de terceiros.
- Evitar registrar conteúdo desnecessário, credenciais, dados sensíveis ou
  imagens que possam identificar estudantes em publicações.
- Manter datasets demonstrativos sintéticos e separados de dados reais.
- Descrever em artigos a diferença entre telemetria observacional e eventos
  semânticos instrumentados.
- Apresentar resultados como evidências parciais que apoiam a mediação
  docente, nunca como diagnóstico ou classificação clínica.

Esta arquitetura fortalece a contribuição acadêmica ao tornar explícitas a
interoperabilidade, a procedência dos dados e as limitações de cada forma de
captura.

## 12. Etapas de implementação após este documento

1. Produzir exemplos de sessão observacional, SDK e jogo externo fictício,
   além do JSON Schema formal.
2. Implementar validação, adaptadores e normalização no backend.
3. Criar tela autenticada de importação com pré-visualização e vínculo a aluno
   e jogo.
4. Adaptar APIs e dashboard ao modelo orientado por capacidades.
5. Generalizar o SDK Unity, preservando o jogo atual e o fallback offline.
6. Implementar capturador observacional externo somente após validar o fluxo
   de importação e apresentação.

## 13. Critérios de aceite para as próximas etapas

- Uma sessão atual do Unity continua sendo recebida e exibida.
- Uma sessão observacional não mostra taxa de acerto, erros ou alertas
  derivados desses dados.
- Uma sessão SDK rica mantém indicadores, sequência e heatmap por fase.
- Capacidade disponível com lista vazia é diferente de capacidade inexistente.
- Um JSON externo é validado, pré-visualizado, vinculado ao aluno e salvo sem
  sobrescrever registros existentes.
- Versões de schema desconhecidas, IDs inválidos, duplicatas e cargas
  excessivas recebem erro explícito e seguro.
- Diferentes resoluções e origens de coordenadas não distorcem o heatmap.
- O fallback offline do Unity permanece funcional após a futura evolução do
  SDK.

## 14. Decisões que devem ser confirmadas antes do código

1. Adotar `schemaVersion` em formato semântico, iniciando em `1.0.0`.
2. Manter somente `observational` e `sdk` como `captureMode` inicial.
3. Usar `ingestionMethod` separado para distinguir API direta e importação de
   arquivo.
4. Usar `capabilities` como fonte de verdade para apresentação no dashboard.
5. Preferir coordenadas normalizadas com origem explícita no contrato novo,
   preservando a leitura dos pixels legados.
6. Migrar gradualmente `payload` textual para objeto JSON no formato canônico,
   com adaptador compatível para o Unity atual.
7. Não executar migração destrutiva de sessões históricas no MVP.

