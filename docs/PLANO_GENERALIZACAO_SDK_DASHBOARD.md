# Plano de generalização do SDK e do Dashboard LUDUS

## Propósito

Evoluir o LUDUS Acompanha de uma integração inicialmente construída para o jogo
**Para Que Serve?** para uma plataforma que acompanhe diferentes jogos Unity
sem inferir regras pedagógicas que não foram fornecidas pelo jogo.

O Dashboard é uma ferramenta de apoio à mediação docente. Ele apresenta
evidências de interação e não realiza diagnóstico, classificação clínica ou
conclusões definitivas sobre aprendizagem.

## Estado confirmado

O contrato canônico `schemaVersion: 1.0.0` já possui `capabilities` para
descrever o que uma sessão realmente oferece.

| Capacidade | SDK genérico atual | Backend | Dashboard |
| --- | --- | --- | --- |
| `clicks` | coleta automática | valida e persiste | total e mapa |
| `mousePath` | coleta automática | valida e persiste | trajetória no mapa |
| `dragPath` | prevista, ainda sem coletor | valida e persiste | mapa já suporta desenho |
| `screenshots` | prevista, ainda sem coletor genérico | persiste referências | exibidas, ainda associadas a fases |
| `inactivity` | prevista, desativada | aceita métricas/eventos | possui indicadores legados |
| `focusEvents` | prevista, desativada | aceita eventos | sem visualização específica |
| `phaseEvents` | informados pelo jogo | valida | visualização por fases |
| `correctWrong` | informados pelo jogo | valida | indicadores somente quando habilitada |
| `categoryEvents` | informados pelo jogo | valida | leitura legada de categorias |
| `customEvents` | contextos de cena/Canvas já usam | valida | sequência cronológica |

## Princípios de evolução

1. Nunca transformar ausência de uma capacidade em ausência de desempenho.
2. Nunca inferir acerto, erro, objetivo ou fase a partir de cliques e trajetórias.
3. Preservar sessões existentes do Para Que Serve? e sua leitura histórica.
4. Mostrar no Dashboard apenas indicadores suportados pela sessão.
5. Tratar pausas entre ações como evidência temporal, não como desatenção.
6. Manter screenshots desligadas por padrão e dependentes de decisão explícita.
7. Validar cada capacidade no Editor e em WebGL usando dados fictícios.

## Etapa A — Dashboard orientado a capacidades

### Objetivo

Remover textos e decisões visuais que presumem fase, categoria, acerto ou erro
em toda sessão.

### Resultado esperado

- Perfil do aluno separa sessões observacionais de sessões com eventos
  semânticos informados pelo jogo.
- Detalhes de sessão mostram uma sequência cronológica genérica quando não há
  fases.
- Imagens são chamadas de **capturas da sessão**; a associação a fase aparece
  apenas quando `phaseEvents` e metadados de fase estiverem presentes.
- Indicadores de acerto/erro e alertas relacionados aparecem somente quando
  `correctWrong` estiver habilitada.

### Compatibilidade

Sessões antigas sem `capabilities` continuam usando a inferência já existente
no backend a partir dos eventos legados.

## Etapa B — Arraste genérico

### Objetivo

Registrar início, pontos e fim de arraste sem atribuir significado pedagógico.

### Dados

- `dragPath[]` com coordenadas e tempo;
- eventos técnicos opcionais `DragStarted` e `DragEnded`;
- `capabilities.dragPath: true` somente quando o coletor estiver ativo.

### Visualização

O mapa exibirá a trajetória de arraste como uma camada diferente da trajetória
do ponteiro e dos cliques.

## Etapa C — Ritmo de interação

### Objetivo

Produzir métricas descritivas sem usar o termo ou a interpretação de
"desatenção".

### Dados

Usar ações relevantes (clique, início/fim de arraste e evento informado pelo
jogo) para calcular primeira ação, duração e intervalos entre interações.

`inactivity` e `focusEvents` permanecem reservadas e desativadas até existir
uma necessidade de pesquisa e um protocolo de interpretação apropriado.

## Etapa D — Eventos informados pelo jogo

### Objetivo

Oferecer uma API pequena para o desenvolvedor comunicar eventos do seu jogo.

Exemplos possíveis: início de atividade, término de atividade, tentativa,
acerto, erro ou evento próprio. Esses nomes e significados são definidos pelo
jogo; o SDK apenas registra e declara a capacidade correspondente.

## Etapa E — Capturas visuais da sessão

### Objetivo

Substituir o modelo específico de "screenshot de fase" por capturas opcionais
de sessão, vinculáveis a um contexto ou instante de tempo.

Essa etapa exige revisão separada de privacidade, consentimento, limites de
tamanho, armazenamento persistente e compatibilidade WebGL. Não será ativada
automaticamente.

## Estratégia de validação

Para cada etapa funcional:

1. testes automatizados no SDK e no backend com dados fictícios;
2. build WebGL e inspeção do JSON;
3. importação manual no Dashboard para aluno fictício;
4. confirmação de que sessões antigas do Para Que Serve? continuam legíveis;
5. somente depois, teste de aceitação no Historietas Divertidas.

## Ordem de implementação aprovada

1. Etapa A: Dashboard orientado a capacidades;
2. Etapa B: arraste genérico;
3. Etapa C: ritmo de interação;
4. Etapa D: eventos informados pelo jogo;
5. Etapa E: capturas visuais;
6. teste final no Historietas Divertidas;
7. capturador observacional externo;
8. renovação visual do frontend.
