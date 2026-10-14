# Plano de avaliação com desenvolvedores — rascunho para a RENOTE

**Estado:** rascunho metodológico para discussão com os orientadores. Este
documento não substitui avaliação ética, termo de consentimento, instrumento
validado nem plano estatístico aprovado.

## 1. Objetivo

Avaliar se desenvolvedores Unity conseguem compreender, integrar e validar o
LUDUS SDK em um jogo educacional, identificando barreiras de instalação,
configuração, documentação e interpretação dos resultados no dashboard.

O foco é a experiência de integração e o suporte ao trabalho pedagógico. O
estudo não deve afirmar que o sistema diagnostica estudantes, mede aprendizagem
de forma conclusiva ou comprova eficácia pedagógica apenas pela avaliação dos
desenvolvedores.

## 2. Perguntas de pesquisa candidatas

- **QP1:** desenvolvedores conseguem concluir o fluxo essencial de integração
  do SDK com apoio da documentação?
- **QP2:** quais etapas concentram mais tempo, erros e pedidos de ajuda?
- **QP3:** como os participantes percebem a clareza da documentação, a
  facilidade de uso e a adequação do SDK ao fluxo de trabalho Unity?
- **QP4:** quais mudanças os participantes consideram prioritárias antes do uso
  em projetos educacionais reais?

Escolher uma pergunta principal e, no máximo, duas secundárias antes da coleta
evita transformar todo feedback disponível em resultado de pesquisa.

## 3. Desenho sugerido

Estudo de usabilidade moderado, baseado em tarefas, com abordagem mista:

- observação de conclusão, tempo, erros, desvios e ajuda solicitada;
- questionário breve após as tarefas;
- entrevista semiestruturada curta;
- logs técnicos sem dados pessoais de crianças;
- análise qualitativa temática das dificuldades e sugestões.

A ISO 9241-11 organiza usabilidade em efetividade, eficiência e satisfação no
contexto de uso. Neste estudo:

- **efetividade:** tarefa concluída corretamente;
- **eficiência:** tempo, tentativas, desvios e ajuda;
- **satisfação:** escala escolhida e comentários do participante.

## 4. Participantes e contexto

Registrar sem identificar publicamente:

- experiência geral de desenvolvimento em faixas;
- experiência com Unity em faixas;
- experiência prévia com pacotes/SDKs;
- experiência com jogos educacionais;
- sistema operacional e versão do Unity;
- familiaridade prévia com o LUDUS Acompanha.

Buscar variedade de experiência, mas analisar os resultados como estudo do
grupo observado. Uma amostra pequena pode revelar problemas importantes de
integração, porém não autoriza generalizações estatísticas para toda a
população de desenvolvedores.

## 5. Ambiente de teste

Preparar uma versão congelada e identificada:

- commit/tag do SDK;
- commit do dashboard/backend;
- URL ou ambiente local usado;
- projeto Unity inicial padronizado;
- versão do Unity e alvo WebGL;
- conta de laboratório e dados exclusivamente fictícios;
- roteiro do moderador;
- gravação de tela apenas quando autorizada.

Antes do primeiro participante, executar um piloto completo e corrigir somente
problemas que impeçam o estudo. Alterações durante a coleta devem ser registradas
como versões diferentes.

## 6. Cenário apresentado

> Você recebeu um jogo educacional em Unity e deseja permitir que uma professora
> acompanhe interações de uma atividade no LUDUS Acompanha. Integre o SDK,
> conecte um participante fictício por nome e código, gere uma sessão de teste e
> confirme que ela chegou ao dashboard.

Não explicar a sequência de cliques antes do teste quando o objetivo for medir
a capacidade da documentação de orientar o participante.

## 7. Tarefas propostas

| ID | Tarefa | Critério observável de sucesso |
| --- | ------ | ------------------------------ |
| T1 | Localizar o guia correto | Participante identifica a trilha de desenvolvedor e o fluxo essencial |
| T2 | Instalar o SDK | Pacote aparece no projeto sem erro de compilação |
| T3 | Criar/configurar a base | Objeto base único e URL/configuração corretas |
| T4 | Instrumentar uma atividade | Escopo e pelo menos um evento semântico são registrados |
| T5 | Adicionar o acesso nome+código | Componente está no Canvas, visível e responsivo |
| T6 | Preparar coleta fictícia | Código temporário válido é criado no laboratório |
| T7 | Parear e jogar | Estado conectado aparece e uma rodada termina |
| T8 | Confirmar recebimento | Sessão correta aparece para o participante fictício |
| T9 | Interpretar limites | Participante diferencia telemetria bruta, eventos do jogo e indicador pedagógico |
| T10 | Recuperar falha | Participante identifica fallback/checkpoint ou o procedimento documentado |

Uma segunda condição opcional pode avaliar o fluxo de colaboração real com
instituição fictícia, separadamente do laboratório. Não misturar as duas
condições sem registrar qual delas cada participante executou.

## 8. Registro por tarefa

Para cada tarefa, registrar:

- resultado: concluída sem ajuda, com ajuda, parcialmente ou não concluída;
- tempo de início e fim;
- erros recuperáveis e erros bloqueantes;
- número e tipo de intervenções do moderador;
- seção da documentação consultada;
- comentário espontâneo relevante;
- problema técnico reproduzível, com versão e ambiente.

O moderador deve usar intervenções padronizadas. Exemplo de níveis:

1. silêncio/tempo para exploração;
2. incentivo neutro: “consulte a documentação se desejar”;
3. indicação da seção relevante;
4. instrução direta para desbloquear o restante do estudo.

## 9. Questionário pós-tarefa

### Medida padronizada opcional

Se o tempo permitir, aplicar a **System Usability Scale (SUS)** após todas as
tarefas, preservando itens, ordem, escala e cálculo do instrumento escolhido.
Não editar frases isoladamente e ainda chamar o resultado de SUS. Usar uma
tradução publicada/validada para o público do estudo e citar a fonte adotada.

Se o questionário precisar ser muito curto, a **UMUX-LITE** é uma alternativa
de dois itens, mas a escolha deve ser feita antes da coleta e não apenas depois
de observar os resultados. Não combinar escores de instrumentos diferentes.

### Itens específicos do projeto

Aplicar separadamente, em escala de 1 (discordo totalmente) a 5 (concordo
totalmente), sem somá-los ao escore SUS/UMUX-LITE:

1. A documentação deixou claro o fluxo mínimo de integração.
2. Consegui distinguir laboratório de teste e ambiente escolar real.
3. As mensagens de erro ajudaram a localizar o problema.
4. Senti confiança para repetir a integração em outro jogo Unity.
5. Ficou claro quais dados o SDK coleta e quais interpretações ele não realiza.

Perguntas abertas:

- Em qual etapa você teve mais dificuldade? Por quê?
- O que você removeria, simplificaria ou automatizaria?
- Que informação faltou no momento em que você precisou dela?
- O que aumentaria sua confiança para usar o SDK em um projeto real?
- Houve algo que pareceu prometer mais do que os dados permitem concluir?

## 10. Métricas e análise

### Quantitativas descritivas

- taxa de conclusão por tarefa;
- taxa de conclusão sem ajuda;
- mediana e intervalo do tempo por tarefa;
- quantidade de erros bloqueantes e recuperáveis;
- distribuição das respostas de satisfação;
- escore do instrumento padronizado, se aplicado corretamente.

Com amostra pequena, apresentar valores individuais ou distribuição, mediana e
amplitude. Evitar causalidade, “comprovação de facilidade” ou comparação
estatística sem tamanho e desenho adequados.

### Qualitativas

1. transcrever apenas trechos necessários e remover identificadores;
2. codificar dificuldades, facilitadores, expectativas e sugestões;
3. agrupar temas recorrentes;
4. manter casos divergentes, e não somente comentários positivos;
5. relacionar cada mudança de produto a evidências observadas.

Separar no relato:

- problema observado;
- interpretação dos pesquisadores;
- sugestão do participante;
- decisão de projeto tomada depois.

## 11. Critérios de aceite do produto

Definir os limiares antes da coleta principal. Candidatos para discussão:

- todas as tarefas críticas concluídas por todos, mesmo que algumas exijam ajuda;
- instalação, pareamento e envio concluídos sem erro bloqueante pela maioria;
- nenhum participante interpreta o sistema como ferramenta diagnóstica após ler o guia;
- falhas críticas de segurança, perda de sessão ou acesso indevido: tolerância zero;
- problemas recorrentes de documentação geram correção antes do piloto escolar.

Esses itens são critérios de engenharia, não hipóteses estatísticas. Os valores
finais devem ser acordados com os orientadores antes de analisar os dados.

## 12. Ética, privacidade e anonimização

- confirmar com os orientadores e a instituição a necessidade de submissão ao
  Comitê de Ética antes de recrutar ou registrar participantes;
- obter consentimento para participação, gravação e uso de falas;
- permitir desistência sem prejuízo;
- usar contas, turmas, alunos e sessões fictícias;
- não coletar código-fonte proprietário do participante sem necessidade;
- separar contato/recrutamento dos dados de análise;
- substituir nomes por códigos como `DEV01`;
- definir retenção e acesso aos arquivos antes da coleta;
- não publicar prints com emails, tokens, códigos ativos ou nomes reais.

A RENOTE orienta mencionar aprovação por Comitê de Ética em pesquisas com
interação humana. Essa decisão deve ser tomada antes da execução, não apenas na
redação do artigo.

## 13. Evidências a preservar

- versão exata dos artefatos;
- roteiro e formulário realmente aplicados;
- tabela de tarefas anonimizada;
- registro de intervenções;
- problemas e correções por versão;
- respostas brutas pseudonimizadas em acesso restrito;
- critérios de inclusão/exclusão;
- desistências e dados ausentes;
- limitações e resultados negativos.

Não versionar no Git do produto termos assinados, contatos ou respostas brutas.

## 14. Estrutura possível para o artigo

1. problema e lacuna de integração/monitoramento;
2. arquitetura e fronteira de apoio pedagógico;
3. método: participantes, tarefas, instrumentos e análise;
4. resultados de efetividade, eficiência e satisfação;
5. dificuldades qualitativas e mudanças derivadas;
6. discussão, ameaças à validade e limitações;
7. conclusão sem extrapolar a amostra.

Para revisão cega, retirar identificação dos autores e referências que revelem
autoria quando as diretrizes da chamada exigirem. Conferir sempre a chamada e
o template vigentes no momento da submissão.

## 15. Pendências antes de transformar este rascunho em formulário

- [ ] assistir e registrar as orientações indicadas pelos orientadores;
- [ ] escolher perguntas de pesquisa finais;
- [ ] definir perfil e quantidade viável de participantes;
- [ ] decidir entre SUS, UMUX-LITE ou somente medidas por tarefa;
- [ ] selecionar tradução validada do instrumento;
- [ ] aprovar roteiro, consentimento e tratamento ético;
- [ ] pilotar com uma pessoa fora da amostra principal;
- [ ] congelar versões e critérios de aceite;
- [ ] criar o formulário sem campos pessoais desnecessários.

## Referências de partida

- [RENOTE — foco, avaliação, submissão e diretrizes éticas](https://seer.ufrgs.br/renote/about)
- [ISO 9241-11:2018 — definições e conceitos de usabilidade](https://www.iso.org/standard/63500.html)
- [Brooke (1996) — System Usability Scale](https://hci-studies.org/methods-and-measures/downloads/SUS_Brooke1996.pdf)
- [Lewis, Utesch e Maher (2013) — UMUX-LITE](https://doi.org/10.1145/2470654.2481287)
- [Privacidade, ética e governança do LUDUS](PRIVACIDADE_ETICA_E_DADOS.md)
- [Checklist da candidata a lançamento](CHECKLIST_RELEASE_CANDIDATA.md)
