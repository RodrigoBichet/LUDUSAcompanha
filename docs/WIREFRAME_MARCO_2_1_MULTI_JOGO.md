# Wireframe funcional — Marco 2.1: jogo, aluno e importação

> Status: proposta para validação antes de alterar modelos, rotas ou telas.
> Os fluxos institucionais existentes continuam disponíveis e inalterados.

## 1. Decisões adotadas para o primeiro MVP

- Um jogo é cadastrado no escopo do usuário ou da instituição autorizada.
- Um aluno pode ter sessões de vários jogos; não há vínculo intermediário
  obrigatório no primeiro MVP.
- Instituição e turma são contexto opcional para novos alunos.
- Um perfil de importação pode ser compartilhado dentro da mesma instituição.
- Datas de ocorrência, importação e sincronização serão distintas quando cada
  uma estiver disponível.

## 2. Navegação principal proposta

```text
Visão Geral
  ├── Jogos
  │     ├── Meus jogos
  │     ├── Novo jogo
  │     └── Detalhe do jogo
  │           ├── Alunos com sessões
  │           ├── Importar sessão
  │           └── Perfis de importação
  ├── Alunos
  │     ├── Novo aluno
  │     └── Perfil do aluno
  │           ├── filtro: todos os jogos / jogo específico
  │           ├── histórico e detalhes
  │           └── importar telemetria
  └── Contexto escolar (opcional)
        ├── Instituições
        └── Turmas
```

As entradas atuais “Minhas Turmas”, “Instituições” e “Usuários” permanecem.
“Jogos” e “Alunos” devem ser adicionados sem substituir a navegação escolar.

## 3. Fluxo A — primeiro acesso individual

```text
[Visão Geral]
  "Comece cadastrando um jogo ou um aluno"

       +--------------------+       +--------------------+
       | Cadastrar jogo     |       | Cadastrar aluno    |
       +--------------------+       +--------------------+
                 |                            |
                 v                            v
       [Novo jogo]                     [Novo aluno]
                 \                            /
                  \                          /
                   v                        v
                   [Importar telemetria ou conectar SDK]
```

### Tela: Novo jogo

```text
Nome exibível do jogo       [ _________________________ ]
Identificador técnico       [ _________________________ ]  (ex.: 2d-project)
Versão padrão               [ _________________________ ]  (opcional)
Origem                      [ SDK LUDUS / JSON externo ]
Descrição                   [ _________________________ ]  (opcional)

                              [Cancelar] [Salvar jogo]
```

Regras visíveis:

- `gameId` não pode mudar depois de possuir sessão sem um procedimento
  explícito de migração futura.
- Nome pode ser amigável e editável.
- O jogo não promete capacidades; elas são declaradas por sessão/adaptador.

### Tela: Novo aluno

```text
Nome para exibição           [ _________________________ ]
Data de nascimento           [ _________________________ ]  (opcional)
Contexto escolar             [ Sem vínculo escolar v   ]

Se vincular contexto:
  Instituição                [ _________________________ ]
  Turma                      [ _________________________ ]

                              [Cancelar] [Salvar aluno]
```

O contexto escolar é opcional no novo fluxo. Quando selecionado, as regras de
autorização existentes por instituição continuam valendo.

## 4. Fluxo B — importação a partir de um jogo

```text
[Detalhe do jogo: 2D Project]
  [Importar telemetria]
          |
          v
[Selecionar aluno]
          |
          v
[Selecionar JSON]
          |
          v
[Reconhecimento]
  ├── formato conhecido -> prévia normalizada
  ├── LUDUS canônico    -> prévia validada
  └── desconhecido      -> mapeamento assistido
          |
          v
[Confirmar importação]
          |
          v
[Detalhe da nova sessão]
```

### Prévia de importação

```text
Jogo:             2D Project (2d-project)
Aluno:            Aluno Deploy
Formato:          Monitor LUDUS legado v1.0
Modo de captura:  Observacional

Disponível:       trajetória de mouse, eventos brutos
Indisponível:     acertos/erros, fases, categorias, screenshots
Avisos:           viewport estimado a partir dos pontos observados

Ocorrência:       06/04/2026 09:53
Importação:       agora
Duplicidade:      não encontrada

                    [Voltar] [Confirmar importação]
```

## 5. Fluxo C — JSON desconhecido

```text
[Arquivo JSON]
  "Não reconhecemos este formato. Você pode criar um perfil de importação
   observacional sem informar acertos, erros ou fases."

[1. Identificação]
  Jogo             [selecionar/cadastrar]
  Nome do perfil   [ __________________ ]

[2. Tempo]
  Início           [ caminho JSON / vazio ]
  Fim/duração      [ caminho JSON / vazio ]

[3. Interações]
  Lista de eventos [ caminho JSON / vazio ]
  Movimento X/Y    [ caminhos JSON        ]
  Timestamp        [ caminho JSON / vazio ]
  Clique           [ regra declarativa     ]

[4. Revisão]
  Capacidades inferidas somente pelos campos mapeados
  Eventos não mapeados preservados como dados brutos

                    [Salvar perfil] [Pré-visualizar]
```

O primeiro MVP não oferece regras programáveis, scripts ou expressões livres.
Os caminhos devem ser declarativos, validados e limitados.

## 6. Perfil do aluno multi-jogo

```text
Aluno Deploy
Contexto escolar: sem vínculo / Instituição X — Turma Y

Jogos: [Todos (8)] [2D Project (2)] [Para Que Serve? (6)]

Resumo do filtro selecionado
  Sessões: 2
  Modo: telemetria observacional
  Dados disponíveis: movimento, eventos brutos

Histórico
  [2D Project] 06/04/2026 09:53 · observacional · 4 s  [abrir]
  [2D Project] 06/04/2026 09:53 · observacional · 1 s  [abrir]

                      [Importar telemetria]
```

O resumo deve indicar quando uma métrica não existe. “0 acertos” não pode ser
usado para representar dados indisponíveis.

## 7. Detalhe genérico da sessão

```text
2D Project · sessão observacional
Ocorrida em: 06/04/2026 09:53
Importada em: 20/07/2026 22:48

Dados disponíveis
  [trajetória de mouse] [eventos brutos]

Mapa de interações
  "Viewport estimado; não há imagem de fundo da atividade."

Resumo da linha do tempo
  Movimento do mouse     190 eventos
  Clique observado         5 eventos
  Início do monitor        1 evento
  [ver eventos brutos]
```

Eventos repetitivos devem ser agrupados inicialmente. A lista completa é uma
visão de auditoria expansível, não o conteúdo principal da tela.

## 8. Estados e mensagens importantes

| Situação | Mensagem/ação |
| --- | --- |
| Nenhuma sessão para o jogo filtrado | Estado vazio normal, sem erro de API. |
| Sessão importada | Abrir filtro do jogo importado e destacar a nova sessão. |
| Arquivo duplicado | Informar que já existe sessão com o mesmo identificador. |
| JSON desconhecido | Oferecer mapeamento assistido ou explicar a recusa. |
| Dados observacionais | Explicar a ausência de semântica interna do jogo. |
| Sessão histórica | Mostrar ocorrência e importação como datas distintas. |
| Viewport estimado | Sinalizar que a escala do mapa é aproximada. |

## 9. Critérios para iniciar código do Marco 2.1

- Validar estes fluxos com o usuário.
- Definir os campos mínimos do novo modelo `Game`.
- Confirmar se “Alunos” será um item de menu independente ou será acessado
  inicialmente dentro de “Jogos”.
- Confirmar rótulos finais: “Jogos”, “Meus jogos” e “Contexto escolar”.
- Criar uma estratégia não destrutiva para tornar `groupId` opcional em novos
  alunos, sem alterar dados existentes.
