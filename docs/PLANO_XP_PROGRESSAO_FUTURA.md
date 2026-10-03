# Plano arquitetural — progressão e XP (funcionalidade futura)

## Status

Proposta de arquitetura para uma etapa futura. Este documento não ativa XP,
níveis, recompensas ou feedback automático no SDK, na extensão, no backend ou
no dashboard atuais.

## Objetivo

Permitir que estudantes acumulem XP a partir da participação em jogos e que o
dashboard apresente uma progressão lúdica, sem transformar XP em medida de
aprendizagem, diagnóstico ou classificação do estudante.

O XP deverá ser tratado como recurso de engajamento e acompanhamento. As
evidências pedagógicas continuam dependendo da leitura e da mediação docente.

## Decisão arquitetural principal

O SDK Unity e o LUDUS Observa não calculam nem concedem XP. Eles registram
fatos verificáveis da atividade. O backend é a única camada autorizada a
aplicar uma política versionada e gerar lançamentos de XP.

```text
Jogo com SDK / LUDUS Observa
  -> fatos da sessão
  -> validação e persistência da sessão
  -> política de XP versionada no backend
  -> livro-razão imutável e idempotente
  -> projeção de progresso por estudante e jogo
  -> dashboard, quando o recurso for habilitado
```

Essa separação impede que cada jogo invente saldos incompatíveis, facilita a
auditoria e permite alterar regras futuras sem modificar sessões históricas.

## Responsabilidade por componente

### SDK Unity

- Continua enviando sessões e eventos semânticos declarados pelo próprio jogo.
- Pode informar fatos como início e conclusão de atividade, tentativa, acerto
  ou erro somente quando a lógica do jogo realmente conhece esses eventos.
- Não envia saldo, nível ou total de XP.
- Não infere desempenho pedagógico.

### LUDUS Observa

- Continua restrito a fatos observacionais: duração, interação, foco,
  inatividade e encerramento da captura.
- Não transforma quantidade de cliques, tempo de tela ou movimento do mouse em
  desempenho ou aprendizagem.
- Pode futuramente gerar XP apenas por participação observada, se uma política
  explícita e aprovada permitir isso.

### Backend

- Valida a origem e as capacidades da sessão antes de considerar um fato.
- Aplica uma política de XP identificada por versão.
- Impede lançamento duplicado para a mesma sessão, regra e versão.
- Mantém um livro-razão auditável; ajustes são novos lançamentos, nunca edição
  silenciosa do histórico.
- Produz o saldo e o nível como projeções derivadas do livro-razão.

### Dashboard

- Permanece oculto enquanto a política, os textos e a validação pedagógica não
  forem aprovados.
- Quando habilitado, explica por que cada XP foi concedido.
- Separa progressão lúdica de indicadores pedagógicos.
- Nunca apresenta XP como nota, diagnóstico ou medida conclusiva de
  aprendizagem.

## Modelos futuros propostos

### `XpPolicy`

Política versionada e ativada de forma controlada.

Campos mínimos sugeridos:

- `policyKey` e `version`;
- `status` (`draft`, `active` ou `retired`);
- escopo opcional por instituição e jogo;
- regras com fato aceito, pontos, limite e capacidades exigidas;
- datas de vigência e autoria administrativa;
- descrição pedagógica em linguagem clara.

### `XpLedgerEntry`

Livro-razão imutável de concessões e ajustes.

Campos mínimos sugeridos:

- `institutionId`, `studentId` e `gameId`;
- `sessionId` e referência opcional ao evento de origem;
- `policyKey` e `policyVersion`;
- `reasonCode`, descrição exibível e `points`;
- `captureMode`, `source` e capacidades consideradas;
- `idempotencyKey` única;
- `createdAt` e autoria, quando houver ajuste manual.

### `StudentGameProgress`

Projeção reconstruível para leitura rápida.

Campos mínimos sugeridos:

- `institutionId`, `studentId` e `gameId`;
- `totalXp`, `level` e data da última atividade;
- versão da regra de nível utilizada;
- referência do último lançamento processado.

Essa projeção não é a fonte de verdade. Se necessário, ela pode ser refeita a
partir de `XpLedgerEntry`.

## Idempotência e segurança

- A chave idempotente deve combinar ao menos sessão, política, versão e motivo.
- Payloads do SDK e da extensão são entrada não confiável.
- Pontos e multiplicadores não são aceitos diretamente do cliente.
- Regras devem possuir limites por sessão, período e tipo de fato.
- Reprocessar uma sessão não pode duplicar XP.
- Uma sessão removida ou invalidada deve gerar estorno auditável, não exclusão
  silenciosa do lançamento.
- Nenhum segredo ou credencial de integração deve existir no build do jogo.

## Compatibilidade com o contrato atual

O contrato de sessão `1.0.0` não será alterado nesta etapa. Sessões existentes
continuam válidas e não recebem XP retroativo automaticamente.

Quando a implementação for aprovada, deve-se decidir entre:

1. interpretar eventos semânticos já documentados, respeitando
   `capabilities`; ou
2. criar uma evolução versionada do contrato com uma capacidade específica de
   progressão.

Essa decisão exige novos exemplos, schema, testes de compatibilidade e revisão
conjunta do SDK, extensão, backend e dashboard.

## Primeira política candidata para validação

Uma prova de conceito segura deve começar somente com participação:

- sessão válida e encerrada: pequena quantidade fixa de XP;
- limite diário por estudante e jogo;
- nenhum bônus calculado a partir de cliques, tempo excessivo ou dados que a
  origem não consegue interpretar;
- bônus por conclusão ou acerto apenas para jogos com eventos semânticos
  explícitos e `correctWrong`/capacidade equivalente habilitada.

Os valores devem ser definidos com o orientador e avaliados antes de qualquer
uso com estudantes.

## Ordem futura de implementação

1. Validar objetivo pedagógico, textos e primeira política com a orientação.
2. Especificar fatos elegíveis e evolução necessária do contrato.
3. Criar modelos, índices de idempotência e testes do backend.
4. Processar somente sessões demonstrativas sintéticas.
5. Criar API de leitura do histórico e da projeção.
6. Criar interface do dashboard atrás de uma flag desativada por padrão.
7. Integrar SDK e extensão somente onde houver fatos novos necessários.
8. Realizar avaliação de privacidade, abuso e compreensão dos usuários.
9. Habilitar gradualmente por instituição ou ambiente de demonstração.

## Critérios de aceite antes de habilitar

- uma sessão nunca concede XP duas vezes;
- todo lançamento informa regra e motivo;
- o saldo pode ser reconstruído pelo livro-razão;
- a extensão não atribui desempenho que não consegue observar;
- jogos sem eventos semânticos não recebem bônus semântico;
- sessões e dados históricos não são migrados destrutivamente;
- XP aparece separado dos indicadores pedagógicos;
- textos não sugerem diagnóstico, nota ou comprovação de aprendizagem;
- a funcionalidade pode permanecer completamente desativada por configuração.
