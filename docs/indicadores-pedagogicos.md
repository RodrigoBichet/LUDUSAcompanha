# Indicadores pedagogicos do LUDUS Acompanha

Este documento descreve como os dados coletados pelo LUDUS Acompanha podem ser transformados em indicadores pedagogicos interpretaveis por professores e tutores.

O objetivo e apoiar a observacao pedagogica durante o uso de jogos educacionais. Os indicadores abaixo nao devem ser interpretados de forma isolada e nao constituem diagnostico clinico, classificacao do estudante ou medida definitiva de aprendizagem.

---

## Principios de interpretacao

- Os dados de interacao sao evidencias parciais do uso do jogo.
- A interpretacao deve considerar o contexto da atividade, a mediacao do professor e as caracteristicas da crianca.
- Um indicador pode sugerir atencao, mas nao explica sozinho a causa de um comportamento.
- Alertas e relatorios devem usar linguagem condicional, como "pode indicar", "sugere atencao" e "apoia a observacao docente".
- Resultados emergentes com dados sinteticos demonstram viabilidade tecnica, nao validacao empirica com estudantes.

---

## Modelo de indicadores

| Dado coletado          | Metrica calculada                                      | Interpretacao pedagogica possivel                                                               | Cuidado de interpretacao                                                                      | Onde aparece                                       |
| ---------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Acertos por sessao     | Total de acertos                                       | Pode indicar familiaridade com os itens ou facilidade na categoria jogada                       | Deve ser analisado junto ao numero de tentativas, nivel da fase e contexto de mediacao        | Perfil do aluno, historico, relatorio PDF          |
| Erros por sessao       | Total de erros                                         | Pode sugerir necessidade de revisao de uma categoria ou item especifico                         | Erros podem ocorrer por exploracao, tentativa e erro, distracao ou dificuldade momentanea     | Perfil do aluno, historico, alertas, relatorio PDF |
| Acertos e erros        | Taxa de acerto                                         | Pode apoiar a leitura geral de desempenho em sessoes ou categorias                              | Nao mede aprendizagem de forma definitiva e nao deve ser usada isoladamente                   | Perfil do aluno, dashboard, relatorio PDF          |
| Tempo de sessao        | Duracao total                                          | Pode sugerir fluidez, demora, interrupcao ou maior necessidade de apoio                         | Duracao depende do ritmo individual, da interface e do contexto da atividade                  | Historico de sessoes, relatorio PDF                |
| Primeiro evento        | Tempo ate a primeira acao                              | Pode indicar hesitacao inicial, espera por orientacao ou tempo de compreensao da tarefa         | Deve ser comparado com observacao do professor no momento da atividade                        | Dados da sessao, possivel analise futura           |
| Intervalo entre acoes  | Tempo medio entre acoes                                | Pode sugerir ritmo de interacao, pausas ou exploracao cuidadosa                                 | Intervalos maiores nao indicam necessariamente dificuldade                                    | Dados da sessao, possivel analise futura           |
| Inatividade            | Numero de periodos de inatividade                      | Pode indicar pausa, hesitacao, distracao, espera por ajuda ou necessidade de apoio              | A causa da inatividade precisa ser observada pelo professor                                   | Alertas, perfil do aluno, relatorio PDF            |
| Cliques                | Quantidade e posicao dos cliques                       | Pode apoiar a leitura de tentativa, exploracao ou insistencia em areas especificas da interface | Cliques isolados nao explicam intencao da crianca                                             | Mapa de interacoes, detalhes da sessao             |
| Caminho do mouse       | Trajetoria do cursor                                   | Pode apoiar a observacao do percurso interativo e da exploracao visual/motora                   | A trajetoria depende do layout da fase e do dispositivo usado                                 | Mapa de interacoes geral e por fase                |
| Arraste de itens       | Inicio, caminho e fim do arraste                       | Pode indicar como a crianca segura, move e tenta posicionar itens durante a tarefa              | Deve ser interpretado com os eventos de acerto/erro e com a interface da fase                 | Mapa de interacoes com linha tracejada             |
| Eventos do jogo        | Fase iniciada, tentativa, acerto, erro e fim de sessao | Permite reconstruir a sequencia de interacoes de uma sessao                                     | Eventos descrevem o uso do jogo, nao causas pedagogicas definitivas                           | Sequencia da sessao por fase                       |
| Categoria jogada       | Frequencia por categoria                               | Pode mostrar quais categorias foram mais praticadas ou repetidas                                | Frequencia maior pode ocorrer por escolha do professor, preferencia ou necessidade pedagogica | Perfil do aluno, historico                         |
| Screenshots por fase   | Imagem de fundo do mapa de interacoes                  | Ajuda a contextualizar trajetorias, cliques e arrastes dentro da tela real do jogo              | Deve preservar anonimato e evitar exposicao indevida em publicacoes                           | Detalhes da sessao                                 |
| Anotacoes do professor | Registro textual de observacoes                        | Complementa os dados automaticos com contexto pedagogico                                        | Anotacoes devem seguir criterios eticos e evitar conclusoes clinicas indevidas                | Perfil do aluno, relatorio PDF                     |

---

## Alertas pedagogicos atuais

| Alerta                          | Base de calculo                             | Leitura pedagogica sugerida                                          | Linguagem recomendada                            |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| Taxa de acerto baixa            | Taxa de acerto nas sessoes recentes         | Pode sugerir necessidade de acompanhamento ou revisao das atividades | "Sugere atencao nas proximas mediacoes"          |
| Taxa de acerto regular          | Taxa de acerto intermediaria                | Pode indicar desempenho em desenvolvimento                           | "Pode se beneficiar de novas praticas"           |
| Inatividade frequente           | Media de periodos de inatividade por sessao | Pode indicar pausas, hesitacao ou necessidade de apoio               | "Observe em que momentos as pausas ocorrem"      |
| Sem jogar ha varios dias        | Tempo desde a ultima sessao                 | Pode indicar interrupcao no acompanhamento                           | "Considere retomar as sessoes quando adequado"   |
| Maior taxa de erro em categoria | Erros concentrados em uma categoria         | Pode sugerir atencao a itens ou conceitos daquela categoria          | "Categoria que merece observacao docente"        |
| Evolucao positiva               | Aumento de acertos em sessoes recentes      | Pode indicar resposta positiva ao uso do jogo                        | "Padrao positivo observado nas sessoes recentes" |

---

## Uso em artigos e materiais academicos

Esta tabela pode ser apresentada como parte da contribuicao metodologica do LUDUS Acompanha em artigos, relatorios e materiais academicos. Ela evidencia que a ferramenta nao apenas coleta dados brutos, mas organiza esses dados em indicadores de apoio a mediacao pedagogica.

Formula recomendada:

> O LUDUS Acompanha transforma eventos de interacao em indicadores pedagogicos interpretaveis, que apoiam a observacao docente sobre desempenho, ritmo, exploracao e possiveis necessidades de mediacao, sem substituir avaliacao profissional ou emitir diagnosticos.
