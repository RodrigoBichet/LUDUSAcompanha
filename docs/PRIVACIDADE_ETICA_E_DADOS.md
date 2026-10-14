# Privacidade, ética e governança de dados no LUDUS Acompanha

## 1. Finalidade deste documento

Este documento registra as decisões técnicas e os limites de uso dos dados no
LUDUS Acompanha. Ele orienta desenvolvimento, testes, aplicação pedagógica,
avaliação com participantes e divulgação acadêmica.

O texto não substitui avaliação jurídica, autorização institucional, termo de
consentimento ou assentimento, nem análise por comitê de ética quando esses
procedimentos forem aplicáveis.

## 2. Princípio do sistema

O LUDUS Acompanha é uma ferramenta de **apoio pedagógico**. Os registros devem
ser interpretados junto à observação do professor e ao contexto da atividade.
O sistema não diagnostica, não classifica clinicamente, não atribui nota e não
mede aprendizagem de forma conclusiva.

## 3. Dados tratados

### 3.1 Contas e organização

- nome e email de usuários;
- papel da conta: administrador, professor ou desenvolvedor;
- instituições, turmas e vínculos de colaboração;
- permissões revogáveis por instituição.

As senhas são armazenadas somente como hash. Tokens, senhas, chaves e strings
de conexão não devem ser registrados em documentação, exemplos ou repositórios.

### 3.2 Participantes

- nome informado ou confirmado pelo professor;
- identificador técnico canônico (`studentId`);
- turma e instituição, quando houver vínculo escolar;
- data de nascimento opcional, somente quando necessária;
- anotações pedagógicas do professor.

A interface atual não solicita nível de suporte, outras condições clínicas,
nome de responsável ou contato do responsável. Campos antigos continuam no
schema apenas para compatibilidade com registros existentes e não devem ser
usados em novos cadastros.

### 3.3 Telemetria das atividades

Conforme as capacidades declaradas por cada fonte, uma sessão pode conter:

- início, fim e duração;
- cliques, trajetória do ponteiro e gestos de arraste;
- dimensões da área acompanhada;
- eventos de foco e pausas;
- fases, tentativas, acertos e erros informados pelo próprio jogo;
- eventos semânticos documentados pelo integrador;
- capturas visuais opcionais;
- metadados técnicos de jogo, versão, plataforma, fonte e schema.

Ausência de uma capacidade significa que aquele indicador não pode ser
inferido. O dashboard deve ocultar ou qualificar informações indisponíveis.

### 3.4 Coletas temporárias

O professor cria uma coleta vinculada à turma. O participante informa nome e
código temporário. O código legível não é persistido; a credencial emitida é
limitada à coleta e ao participante e não concede acesso ao dashboard.

## 4. Minimização e comportamento esperado

- coletar somente o necessário para a finalidade pedagógica ou de avaliação;
- usar dados fictícios no desenvolvimento e nos testes públicos;
- evitar texto livre com diagnóstico, contato ou informação familiar;
- manter capturas desativadas quando a imagem não for essencial;
- não coletar o conteúdo digitado em campos de texto; registrar apenas eventos
  técnicos documentados, como conclusão e quantidade de caracteres;
- não incluir o nome do participante no nome de arquivos exportados;
- não inserir JWT de usuário, senha ou token permanente no jogo Unity;
- não inventar acerto, erro, fase ou objetivo quando a fonte não os informa.

## 5. Acesso e compartilhamento

- páginas de aluno, sessão, indicadores e capturas exigem autenticação;
- o acesso escolar é limitado à instituição própria ou compartilhada;
- convites de colaboração possuem permissões separadas para estrutura, coletas
  e resultados e podem ser alterados ou revogados;
- capturas são entregues por rota autenticada após a verificação de acesso ao
  aluno; o diretório de arquivos não é público;
- colaboradores devem usar contas próprias. Senhas não devem ser compartilhadas.

## 6. Capturas visuais

Capturas podem revelar elementos da interface, nomes exibidos pelo jogo ou
outros dados do ambiente. Antes de habilitá-las:

1. definir por que a imagem é necessária;
2. confirmar a autorização institucional e dos participantes aplicável;
3. evitar cenas com credenciais, conversas ou dados pessoais desnecessários;
4. limitar cenas e momentos capturados;
5. validar quem poderá consultar e por quanto tempo;
6. anonimizar qualquer material destinado a artigo, apresentação ou repositório.

No deploy atual, o filesystem do Render é efêmero. A autenticação protege a
leitura, mas a persistência de longo prazo exige storage privado apropriado.

## 7. Retenção, exclusão e portabilidade

O sistema já permite remoções autorizadas de alunos e sessões importadas e
tenta apagar as capturas associadas. Perfis marcados como protegidos não podem
ser removidos pelos fluxos comuns.

Antes de uso continuado com dados reais, o projeto ainda precisa definir e
documentar:

- prazo de retenção por tipo de dado;
- responsável por autorizar exclusão ou exportação;
- rotina de arquivamento e descarte;
- procedimento para solicitações de acesso, correção e eliminação;
- política de backup e restauração;
- storage privado e persistente para capturas.

Essas decisões devem ser tomadas com a instituição participante e a orientação
acadêmica antes de serem apresentadas como política definitiva.

## 8. Avaliação acadêmica e publicação

- separar avaliação do SDK, usabilidade e resultados pedagógicos;
- registrar protocolo, versão do software, ambiente, tarefas e critérios;
- usar identificadores ou pseudônimos nos instrumentos de análise;
- publicar resultados agregados sempre que possível;
- revisar manualmente prints, PDFs, JSONs e logs antes de divulgar;
- relatar limitações, perdas de dados, falhas de conexão e amostra real;
- não transformar indicadores exploratórios em evidência causal ou clínica.

## 9. Incidentes e falhas

Em caso de acesso indevido, exposição de código, arquivo publicado ou suspeita
de vazamento:

1. revogar código, colaboração ou credencial afetada;
2. preservar logs técnicos mínimos para investigação;
3. identificar tipos de dados e participantes envolvidos;
4. comunicar o responsável institucional e a orientação acadêmica;
5. corrigir a causa antes de retomar a coleta;
6. registrar a ocorrência e as medidas adotadas.

## 10. Checklist antes de uma aplicação real

- [ ] Finalidade e protocolo definidos.
- [ ] Participantes e responsáveis orientados conforme o procedimento aprovado.
- [ ] Contas individuais e permissões mínimas configuradas.
- [ ] Turma e alunos conferidos sem dados clínicos desnecessários.
- [ ] Capturas desativadas ou justificadas e autorizadas.
- [ ] Jogo, SDK, API e dashboard validados com dados fictícios.
- [ ] Fallback, perda de rede e encerramento testados.
- [ ] Prazo de retenção e responsável pelos dados definidos.
- [ ] Plano de anonimização para artigo e apresentação definido.

## 11. Referências institucionais

- Brasil. Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais:
  <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>
- Conselho Nacional de Saúde. Resolução nº 510/2016 — normas aplicáveis a
  pesquisas em Ciências Humanas e Sociais:
  <https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2016/resolucao-no-510.pdf/view>
- Autoridade Nacional de Proteção de Dados. Tratamento de dados pessoais de
  crianças e adolescentes:
  <https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes>
- Autoridade Nacional de Proteção de Dados. Guia sobre tratamento de dados para
  fins acadêmicos e estudos:
  <https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-tratamento-de-dados-pessoais-para-fins-academicos-e-para-a-realizacao-de-estudos-e-pesquisas>

## 12. Estado deste documento

Documento técnico de trabalho da versão candidata. Revisar com orientadores e
instituições parceiras antes do deploy de avaliação e sempre que o contrato de
telemetria, o armazenamento ou as permissões forem alterados.
