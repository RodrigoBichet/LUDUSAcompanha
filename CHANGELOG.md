# Changelog — LUDUS Acompanha

Todas as mudancas relevantes do projeto sao registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Em desenvolvimento] — Plataforma multi-jogo e fluxo escolar

### Documentação, privacidade e qualidade

- a documentação recebe o tutorial em vídeo da Etapa 2, explica a seleção de
  cenas pelo Build Profiles e permite revisar essa seleção a qualquer momento;
  os READMEs do dashboard e do SDK passam a refletir o mesmo fluxo;
- capturas visuais passam a ser aceitas e persistidas também nos checkpoints
  da coleta, sem duplicar imagens na conclusão da sessão; o painel de detalhes
  do mapa mantém dimensões estáveis e o hover agrupa a trajetória por recorte
  para preservar o destaque sem redesenhos assíncronos sucessivos;
- o fluxo de coletas do laboratório passa a criar automaticamente o aluno
  fictício quando o nome ainda não existe, exigir pelo menos duas partes no
  nome e oferecer atalhos diretos para o perfil ou para o último progresso
  protegido; escolas reais e homônimos continuam sob revisão consciente;
- checkpoints recentes e interrompidos passam a ser diferenciados como
  **Em andamento** e **Ficou em andamento**, sem apresentar uma sessão parcial
  como se tivesse sido concluída;
- a análise de sessões automáticas recupera a busca por cena no percurso da
  jogada e usa uma apresentação neutra, sem sugerir que cada recorte seja um
  botão;
- os atalhos do tutorial passam a usar uma transição curta e previsível até o
  início exato de cada grupo, compensando o cabeçalho fixo; a instalação pelo
  Package Manager recebe uma sequência visual de três passos com imagens reais,
  e a etapa de interações passa a mostrar os objetos expandidos na Hierarchy;
  os fluxos de conexão por nome e código e de revisão do recebimento ganham
  sequências visuais completas, e a integração no jogo real recebe um espaço
  próprio para um segundo vídeo demonstrativo, agora identificado separadamente
  do laboratório guiado; todos os prints dessas sequências
  podem ser ampliados em uma visualização acessível por mouse ou teclado;
- o laboratório guiado passa a incluir o primeiro tutorial completo em vídeo,
  otimizado para a web, com controles nativos e velocidades entre 0,5× e 2×;
- a documentação passa a incluir também o vídeo prático do jogo Para Que
  Serve?, otimizado para a web, demonstrando o recorte de uma única cena, o
  ciclo da sessão e uma atividade de arraste por tag;
- a documentação passa a priorizar o roteiro essencial, recolhendo privacidade,
  opções WebGL, campos avançados, cenários semânticos e checklists técnicos;
  também recebe atalhos por etapa, valores copiáveis, download alternativo do
  SDK e espaços responsivos preparados para o vídeo e os prints do tutorial;
- o tutorial do desenvolvedor passa a adotar o envio automático e o teste no
  Play como fluxo principal, deixando WebGL e JSON como validações opcionais;
  a documentação do professor também explicita a revisão do participante e a
  inclusão das sessões recebidas no histórico;
- os cliques voltam a responder ao hover nos mapas filtrados por atividade ou
  captura, e as ações de adicionar sessões ao histórico passam a seguir a
  paleta verde e a orientar a consulta posterior em Meus alunos;
- a revisão final de interface simplifica a hierarquia da homepage, remove
  pré-títulos e divisórias decorativas, aproxima o aviso pedagógico da mensagem
  principal, integra a apresentação do MaisLUDUS ao rodapé e alinha documentação,
  autenticação e privacidade à paleta verde; no ambiente autenticado, os
  cabeçalhos ficam mais diretos, a barra lateral pode ser recolhida sem perder
  os atalhos por ícone e cards, formulários, botões, avatares e estados passam a
  seguir a mesma paleta sóbria, tipografia e estrutura plana do site público;
- a rota inicial passa a funcionar como site público para visitantes e mantém
  a Home operacional para contas autenticadas; a apresentação explica o
  projeto, as diferenças entre SDK Unity, LUDUS Observa e dashboard, o fluxo
  entre jogo e acompanhamento, as jornadas de professor e desenvolvedor, a
  equipe ligada ao MaisLUDUS e os limites de uso pedagógico sem inventar
  resultados de pesquisa;
- a homepage destaca a marca LUDUS Acompanha antes da apresentação, conduz o
  visitante às ferramentas antes do cadastro e detalha a integração entre SDK,
  extensão observacional, coleta e dashboard em um fluxo visual conectado;
- a homepage pública permanece acessível após o login dentro da mesma barra
  lateral do dashboard; âncoras usam rolagem suave e o botão Voltar do navegador
  restaura a posição anterior, inclusive após visitar o cadastro;
- o projeto ganha um aviso público geral em `/privacidade`, cobrindo cadastro,
  SDK, LUDUS Observa e dashboard, com referências à LGPD e à Resolução CNS
  nº 510/2016; novos cadastros exigem leitura e aceite explícito, cuja versão e
  data são registradas sem alterar contas antigas;
- a documentação do SDK Unity torna-se consultável sem login e passa a ser
  identificada explicitamente como a fonte disponível nesta etapa; o LUDUS
  Observa aparece como documentação futura e indisponível, sem sugerir um guia
  que ainda não foi publicado;
- Documentação e Privacidade recebem navegação pública com estado ativo e links
  entre si; ao voltar do cadastro de professor ou desenvolvedor, o navegador
  restaura a seção de perfis em vez de retornar ao início da homepage;
- login, cadastro, confirmação de e-mail e recuperação de senha passam a usar a
  mesma identidade visual e o mesmo acesso à homepage e à documentação; login
  e cadastro recebem contato do projeto em modal com cópia do e-mail e layout
  compacto em zoom normal; perfil e saída usam um cartão reduzido no rodapé da
  lateral, desenvolvedores entram primeiro na documentação e o favicon adota
  uma versão simples da identidade visual do LUDUS Acompanha;
- a trilha do desenvolvedor passa a começar por um tutorial Unity isolado e
  explica, em linguagem de primeiro contato, o fluxo do SDK, a localização do
  asset `ConfiguracaoLudus`, seus campos e a diferença entre menus superiores e
  componentes adicionados pelo Inspector; o roteiro visual percorre laboratório
  fictício, Build Profile isolado, interações, resultado semântico, importação,
  coleta automática e conferência final no Dashboard, incluindo a nova tela de
  conclusão que orienta o encerramento da sessão e a geração do JSON;
- a conferência do tutorial WebGL ganha uma etapa própria no dashboard e passa
  a explicar a primeira compilação, a repetição completa no navegador e a URL
  base da API; no perfil do aluno, atividades registradas recebem uma chamada
  explícita para a análise, enquanto a tela da sessão oferece mapa ampliado,
  pesquisa na sequência e carregamento progressivo de eventos;
- o dashboard passa a oferecer uma área de documentação comum, com trilhas
  específicas para professor e desenvolvedor; cartões estáticos apresentam o
  conteúdo de cada perfil sem funcionar como seleção, enquanto um seletor
  compacto compartilhado aparece antes do guia e exibe somente o percurso
  escolhido sem deslocar a posição de leitura durante a troca; a explicação do
  SDK permanece exclusiva do guia de desenvolvimento;
- homepage e documentação recebem ícones vetoriais coerentes para distinguir
  SDK Unity, extensão, API e dashboard sem depender de imagens externas; o
  bloco final da homepage volta à paleta branca e verde usada no restante do
  site;
- o fluxograma público passa a explicar o percurso completo desde a criação da
  conta até o acompanhamento da atividade, diferenciando as responsabilidades
  de professor e desenvolvedor, o uso do laboratório fictício, a escolha entre
  SDK e LUDUS Observa, a conexão por código e a validação do recebimento; etapas
  mais densas oferecem detalhes expansíveis independentes sem sobrecarregar a
  leitura inicial, e as oito etapas seguem da esquerda para a direita nas duas
  linhas do fluxo;
- a área de jogos passa a usar o rótulo **Meus jogos** para os dois perfis e
  deixa de oferecer cadastro manual; o jogo é reconhecido quando a primeira
  sessão chega por uma coleta, enquanto professores e desenvolvedores mantêm
  as ações autorizadas para revisar ou corrigir jogos existentes;
- o resumo dos perfis passa a aparecer antes do fluxograma em cartões compactos;
  ele é integrado à mesma seção das ferramentas para reduzir a quebra visual;
  a criação de conta fica concentrada no bloco posterior ao fluxo e às
  orientações de uso responsável, que passam a encerrar o próprio bloco de
  funcionamento em uma subseção compacta, sem repetir a hierarquia dos títulos
  principais; junto do acesso à documentação, a comparação entre LUDUS Observa
  e SDK explicita o equilíbrio entre simplicidade, detalhamento e personalização
  da captura;
- o tutorial do desenvolvedor passa a acompanhar a ordem real do Inspector e a
  explicar as decisões dos assistentes de interação, incluindo objeto
  clicável/arrastável, seleção de peça filha e nomes exibidos no Dashboard;
- a barra lateral recebe uma marca textual mais compacta, scrollbar coerente
  com a identidade visual e estados desabilitados para as áreas ainda vazias do
  laboratório; após a criação dos dados fictícios, os atalhos são atualizados
  imediatamente sem exigir outra navegação;
- a largura e a tipografia da barra lateral são reduzidas para aproveitar melhor
  a tela em zoom normal, sem diminuir formulários e textos do conteúdo principal;
- o roteiro do tutorial detalha a preparação da coleta, as alternativas de
  envio, cenas, resultados e capturas, além de orientar a troca para Web e a
  restauração das cenas originais no Build Profile;
- a documentação esclarece os caminhos de fallback em Windows, macOS e WebGL e
  detalha todos os campos do componente Área de observação LUDUS;
- o tutorial contextualiza a área de observação a partir do objeto-raiz da
  atividade e oferece guias expansíveis para resultados de botão, arraste por
  tag, contato físico, metas de progresso e regras personalizadas;
- a configuração do resultado de botão ganha exemplos de resposta informada e
  esperada, além do caminho completo até o asset do tutorial;
- a documentação acompanha o novo laboratório paginado do SDK e ensina a
  configurar alternativas correta/incorreta, arraste avaliado por tag, contato
  físico 2D, meta por valor e eventos de categoria/fase; o exemplo usa uma tag
  exclusiva do tutorial para não conflitar com `Player` do jogo consumidor;
- o roteiro documenta a navegação guiada do laboratório, com avanço bloqueado
  até a tarefa atual, revisão pelo botão Anterior e tentativas de arraste ou
  contato devolvidas à origem para impedir peças sobrepostas;
- o guia acompanha a experiência didática do miniquiz em duas etapas e do
  ciclo semântico progressivo, relacionando os rótulos visuais aos GameObjects
  que continuam sendo configurados no Inspector;
- um guia de privacidade e governança orienta minimização, acesso, capturas,
  retenção e uso acadêmico sem atribuir finalidade diagnóstica ao sistema;
- um checklist de candidata a lançamento reúne os critérios de qualidade,
  integração WebGL, ensaio com 30 computadores, deploy, rollback e evidências;
- um plano de avaliação com desenvolvedores organiza perguntas de pesquisa,
  tarefas, métricas, ética, anonimização e análise para discussão metodológica
  antes da aplicação e da redação destinada à RENOTE;
- exemplos administrativos deixam de conter credenciais pessoais ou senhas
  fixas, e a coleção do Postman acompanha as rotas atuais da API;
- capturas visuais deixam de ser arquivos públicos e passam a exigir sessão
  autenticada com autorização sobre o aluno;
- o frontend reduz a coleta ativa de dados sensíveis e carrega suas páginas
  sob demanda, mantendo o gerador de PDF fora do pacote inicial.

### Execuções, checkpoints e exportação

- coletas temporárias passam a receber sessões e checkpoints do Unity SDK com
  a mesma credencial limitada de nome+código usada pelo LUDUS Observa;
- participantes reconhecidos por nome único na turma têm a sessão do jogo
  vinculada diretamente ao histórico, enquanto nomes pendentes permanecem em
  uma caixa própria e revisável, sem alterar os recibos imutáveis da extensão;
- a conclusão de uma sessão pareada do SDK também reconhece o jogo no catálogo
  pessoal da conta responsável pela coleta e o associa ao aluno de forma
  idempotente, sem exigir cadastro manual prévio;
- checkpoints pendentes do SDK podem ser atualizados até a conclusão, mas uma
  sessão concluída torna-se imutável e reenvios conflitantes são recusados;
- contrato de sessão passa a aceitar `schemaVersion: 1.1.0` com `runId`,
  `attemptNumber` e `status`, mantendo compatibilidade com `1.0.0` e legados;
- endpoint idempotente recebe checkpoints de sessões em andamento e exige uma
  chave efêmera cujo hash é o único valor persistido;
- a sessão concluída substitui seu checkpoint sem criar duplicidade;
- checkpoints parciais ficam fora de totais, taxas e alertas pedagógicos e são
  identificados como não concluídos na lista do aluno;
- o importador reconhece `ludus-session-bundle` e apresenta suas sessões no
  fluxo existente de prévia e confirmação;
- professores podem baixar uma sessão histórica ou toda a execução pelo
  Dashboard, com verificação de acesso ao aluno.

### Preparação de produção

- inicialização do backend valida MongoDB, JWT e porta antes de abrir o servidor;
- produção exige frontend público em HTTPS, segredo JWT forte e links locais de
  autenticação desativados;
- conexão com o banco passa a propagar falhas ao ponto de entrada, permitindo
  encerramento controlado e testes sem chamadas internas a `process.exit`;
- exemplo de ambiente diferencia explicitamente desenvolvimento local e
  configuração segura de produção;
- testes isolados validam configurações aceitas e recusadas sem acessar
  o MongoDB Atlas.
- serviço de email usa timeout, mensagens controladas e validação da
  configuração do Resend sem incluir a chave no conteúdo enviado;
- produção exige chave do Resend e remetente válido antes de iniciar, enquanto
  o desenvolvimento preserva os links locais de teste;
- CORS deixa de aceitar qualquer site e passa a usar frontend, origens WebGL e
  extensões explicitamente configurados;
- em desenvolvimento, o CORS aceita WebGL em portas locais aleatórias e o
  cabeçalho efêmero de checkpoint; a produção continua restrita às origens
  declaradas;
- ambiente temporário em memória informa o aluno fictício e os parâmetros de
  URL necessários para validar o envio automático sem acessar o Atlas;
- respostas removem a identificação do Express e recebem cabeçalhos básicos de
  proteção, preservando o carregamento externo das imagens dos mapas.
- a primeira versão Web fica fechada sem captura visual pela extensão;
  screenshots do SDK permanecem com a limitação documentada do filesystem
  efêmero até a adoção de storage persistente.

### Interface e linguagem

- a interface passa a usar Roboto de forma consistente em títulos, textos,
  formulários e relatórios;
- emojis usados como comandos e indicadores foram substituídos por ícones
  vetoriais consistentes, com significado visual e textual preservado;
- textos do acompanhamento usam “atividade” e orientações mais diretas para
  diferenciar ações do professor, dados coletados e recursos futuros.
- navegação compartilhada adapta-se a telas menores e recebe atalho para o
  conteúdo, foco visível e respeito à preferência por movimento reduzido.
- a administração pode criar a instituição informada por uma professora e
  aprovar seu vínculo em uma única ação, com proteção contra duplicidade.
- a tela de coletas diferencia ausência de instituição e ausência de turma,
  oferecendo acesso direto ao cadastro da primeira turma; contas com uma única
  instituição entram automaticamente no contexto correto.

### Acompanhamento pós-coleta

- atividades registradas passam a destacar o nome amigável do jogo e um
  contexto secundário, facilitando a navegação no perfil do aluno;
- resumo apresenta horários de início e término por jogo e, ao filtrar um
  jogo, compara até oito atividades recentes por duração e cliques;
- detalhes observacionais apresentam métricas descritivas de trajetória,
  gestos de arraste, linha do tempo e mapa com arrastes roxos tracejados;
- tentativas semânticas de arraste exibem listas de alternativas e a resposta
  esperada quando esses dados visuais forem enviados pelo SDK, preservando a
  leitura de sessões antigas;
- capturas visuais são ordenadas cronologicamente e vinculadas ao recorte pelo
  identificador de contexto, evitando fases sem trajetórias por causa da ordem
  de retenção das imagens no JSON;
- a sequência da sessão reutiliza as abas do mapa, separa os eventos por fase e
  omite da leitura principal a abertura e o fechamento técnico dos recortes;
- mapas e sequências passam a preservar a hierarquia entre categoria, fase
  real do jogo e atividades internas, sem apresentar cada Canvas capturado
  como se fosse uma nova fase; os marcos de início e conclusão permanecem no
  nível da fase, enquanto tentativas, acertos e erros ficam nas atividades;
- edição do aluno permite escolher instituição e turma acessíveis, mantendo os
  vínculos sincronizados e preservando o acesso ao remover o vínculo escolar;
- recurso ainda não implementado de captura visual é apresentado como
  indisponível, sem sugerir uma ação que o sistema ainda não executa;
- testes com banco temporário cobrem vínculo, troca, isolamento entre
  professoras e desvínculo escolar sem acessar dados reais.

### Descoberta assistida de jogos

- a professora pode criar uma coleta automática sem cadastrar jogos ou informar
  sites antecipadamente;
- o pareamento informa somente que a coleta permite descoberta assistida e não
  solicita acesso a portais antes de um adulto localizar o primeiro jogo.

### Cadastro de jogos

- o cadastro inicial de um jogo agora permite informar nome, descrição, página
  pública e os endereços incorporados usados pela captura, sem exigir salvar e
  editar o registro em uma segunda etapa;
- os textos do formulário explicam os endereços de maneira amigável para a
  preparação de jogos hospedados em portais como o Unity Play.
- o link público é opcional no cadastro inicial; ao informar uma página do
  Unity Play, a origem interna do WebGL é preparada automaticamente.
- jogos ativos e arquivados agora podem ser excluídos definitivamente do
  catálogo, com arquivamento recomendado como alternativa e preservação das
  sessões e dos dados dos alunos.

### Autenticação

- cadastro público registra o nome e a cidade informados para a instituição
  como uma solicitação pendente, sem criar ou vincular instituições automaticamente;
- administradores visualizam a solicitação, escolhem uma instituição já validada
  e encerram a pendência ao salvar o vínculo;
- professoras com solicitação pendente recebem uma orientação própria na página
  inicial; atalhos escolares permanecem ocultos até a aprovação administrativa;
- fila administrativa destaca, conta, ordena primeiro e permite filtrar os
  vínculos institucionais que ainda aguardam análise;
- o filtro de vínculos pendentes volta automaticamente à lista completa quando
  a última solicitação exibida é resolvida;
- professora pode verificar a aprovação do vínculo na própria página inicial e
  liberar o dashboard sem sair da conta ou recarregar manualmente;
- backend restringe contas com solicitação institucional pendente ao próprio
  perfil até a aprovação, mantendo compatibilidade com contas históricas;
- criação administrativa de usuários usa uma rota autenticada própria, com
  validação de papel, instituição, email único e senha mínima de oito caracteres;
- cadastro público de professoras com confirmação de email antes do primeiro login;
- recuperação de senha por token aleatório, armazenado somente como hash, com
  validade de 30 minutos e uso único;
- redefinição de senha invalida sessões anteriores do dashboard;
- respostas neutras na recuperação e no reenvio, sem revelar contas cadastradas;
- telas públicas de cadastro, confirmação, reenvio, recuperação e nova senha;
- login após redefinição emite a versão atual da sessão; aviso de tamanho mínimo
  e acesso à recuperação ficam junto ao campo de senha;
- envio por Resend configurável, sem credenciais versionadas, e links locais
  visíveis apenas quando explicitamente habilitados fora de produção;
- limitação de tentativas em memória para login, cadastro, confirmação e
  recuperação, com resposta `429` e indicação de tempo para nova tentativa;

### Adicionado

- confirmação coletiva para adicionar aos respectivos históricos todas as
  sessões pendentes de alunos já identificados com segurança, preservando
  revisão individual, falhas parciais e idempotência;
- vínculo automático do participante a um único aluno com nome exato na turma,
  mantendo alunos inexistentes, homônimos e nomes apenas parecidos sob revisão
  explícita da professora;

- redefinição administrativa pontual com senha temporária aleatória, validação
  do papel `admin` e preservação integral dos dados pedagógicos;
- conta administrativa fictícia no ambiente efêmero de teste do lote, permitindo
  validar os fluxos exclusivos de admin sem acessar dados reais;
- formulário administrativo de instituições isolado dos estilos da tela de
  turmas, com campos e ações alinhados e adaptação para telas menores;

### Segurança

- professora pode substituir o código temporário perdido ou exposto em uma
  coleta ainda ativa; o código anterior deixa de aceitar novos computadores,
  sem interromper os alunos que já estavam pareados;

- cadastro público sempre cria uma conta de professora sem permitir elevação
  para `admin` ou vínculo institucional informado pelo cliente;
- criação de instituições restrita ao administrador no backend e removida da
  tela comum das professoras;
- administrador impedido de excluir a própria conta autenticada;
- conta administrativa atual identificada na listagem sem oferecer a ação de remoção;
- testes automatizados para cadastro, instituição e autoexclusão administrativa;

- modal reutilizável do dashboard nas cinco exclusões que ainda dependiam da
  confirmação nativa: aluno em duas telas, turma, instituição e usuário;
- erros de formulários e exclusões agora aparecem na página ou no modal, sem
  chamadas a `alert`, `confirm` ou `prompt` no frontend.

- modal próprio para remover anotações do professor, mostrando o conteúdo antes
  da confirmação e mantendo foco, cancelamento, erro recuperável e proteção
  contra requisições repetidas.

- modal próprio e compartilhado para arquivar ou reativar jogos nas duas telas
  do catálogo, preservando histórico, foco, cancelamento e prevenção de envio
  duplicado. As confirmações de exclusão restantes continuam pendentes.

- modal próprio para confirmar a adição de sessões ao histórico, com aluno e
  quantidade, cancelamento por Escape antes do envio, foco controlado e
  bloqueio de confirmação repetida. As demais confirmações não mudaram.

- aviso de resultado da importação com espaçamento e estilos distintos para
  sucesso e pendências, dentro do card do participante.

- revisão de participante com vínculo a aluno da turma ou criação confirmada;
- aprovação autenticada dos recibos selecionados para o histórico do aluno,
  com jogos separados, rastreio por recibo, retomada após falha e bloqueio de
  sobrescrita de importações anteriores;
- contadores de pendências e sessões adicionadas na caixa de coletas.

- caixa persistente de submissões observacionais pendentes, recebidas somente
  com credencial limitada da coleta e sem criação precoce de aluno ou sessão;
- endpoint idempotente de envio em lote, com validação estrita, recibo por
  sessão e rejeição de reutilização conflitante do mesmo `sessionId`;
- Caixa de Coletas autenticada para visualizar participantes e sessões
  pendentes agrupados, com isolamento por professora e sem expor o payload
  observacional bruto;

- Feedback de cópia do código da turma volta ao estado normal após 2,5
  segundos ou quando a professora troca de guia.

- página pública e responsiva com a política de privacidade do LUDUS Observa,
  disponível sem autenticação em `/privacidade/ludus-observa` e validada no
  ambiente publicado do Netlify;
- guia definitivo de importação end to end para JSONs do SDK Unity e do LUDUS
  Observa, com validação, vínculo multi-jogo e conferência da sessão;
- cadastro, edição, arquivamento e reativação de jogos no catálogo pessoal;
- importação autenticada de JSON com prévia, validação, normalização e prevenção de duplicidade por aluno;
- importação autenticada de lotes multi-jogo do LUDUS Observa, com validação
  integral antes da gravação, prévia do participante, jogos e sessões,
  confirmação explícita para nomes divergentes e persistência independente de
  cada sessão;
- schema JSON estrito e versionado para o envelope de lote observacional;
- ambiente manual efêmero com MongoDB em memória e dados exclusivamente
  fictícios para validar o lote sem ler o `.env` nem acessar o Atlas;
- criação e listagem autenticadas de coletas escolares observacionais por
  turma, com validade limitada e origens Web opcionais;
- código temporário de pareamento exibido somente na criação e persistido no
  banco apenas como HMAC, sem reutilizar senha ou JWT da professora;
- tela **Coletas** para gerar o código, copiar, acompanhar validade e revogar a
  coleta com confirmação explícita;
- código de sala reduzido para seis caracteres sem símbolos ambíguos e modo de
  apresentação com instruções ampliadas para a turma;
- pareamento público por nome e código, com participante temporário pendente,
  credencial observacional limitada à validade da coleta, por no máximo 8
  horas, e sem criação precoce de aluno;
- limitação de falhas de pareamento por IP assinado e código, sem conservar o
  endereço IP legível na memória do processo;
- adaptador para telemetria observacional externa e metadados de capacidades;
- alunos individuais por jogo e associação automática de alunos escolares ao jogo identificado no JSON;
- visão geral de alunos com os jogos e totais de sessões realmente registrados;
- filtro de jogos no perfil do aluno e importação direta de JSON de outro jogo
  para o mesmo perfil, sem duplicar a identidade do estudante;
- identificação do jogo em cada sessão quando o perfil reúne todos os jogos;
- criação de instituições por professor, com escopo de acesso às próprias instituições, turmas e alunos;
- trava persistente para perfis reais protegidos contra exclusão e backups JSON externos antes de limpezas de demonstração.

### Alterado

- a navegação principal passou a oferecer **Jogos**, **Instituições** e
  **Alunos** como pontos de entrada complementares;
- jogos abrem diretamente seus alunos, sem listar instituições na tela de catálogo;
- exclusão permanente de aluno remove também sessões e imagens vinculadas; turmas e instituições com alunos permanecem protegidas;
- a URL legada `/jogos` redireciona para o catálogo atual.
- a política pública de privacidade passou a descrever o acompanhamento local
  multi-jogo e o armazenamento local de sessões concluídas até a exportação ou
  o descarte consciente pela pessoa usuária.

### Compatibilidade

- sessões legadas e alunos escolares existentes permanecem legíveis;
- o SDK Unity não foi alterado nesta etapa.

### Validado

- lote fictício com duas sessões de dois jogos importado pelo perfil do aluno
  no Dashboard local;
- cada sessão permaneceu vinculada ao respectivo jogo em **Todos os jogos** e
  nos filtros individuais;
- reimportação do mesmo lote reconhecida sem criar sessões duplicadas;
- ambiente manual efêmero encerrado com descarte do MongoDB em memória;
- backend com 11/11 testes aprovados, além de lint e build do frontend.
- administração da coleta validada manualmente: criação, cópia do código,
  persistência da coleta sem reexibir o segredo após recarga e revogação;
- formato curto `XXX-XXX` coberto pelos testes automatizados; modo de
  apresentação validado manualmente em 100% de zoom, sem rolagem, com código
  em uma linha e instruções legíveis;
- revogação da coleta validada com remoção imediata do código e das ações de
  cópia e apresentação, sem depender de recarregar a página;
- backend ampliado para 14/14 testes aprovados; lint e build do frontend
  permaneceram aprovados.
- backend ampliado para 16/16 testes: pareamento idempotente por nome,
  revogação, expiração, limitação de tentativas e isolamento da credencial em
  relação às rotas comuns do Dashboard.

---

## [1.10.1] — 2026-07-20 — Preparacao e publicacao inicial do ambiente online

### Adicionado

- `frontend/.env.example` com as variaveis publicas do Vite.
- `frontend/public/_redirects` para fallback de rotas SPA no Netlify.
- ambiente publicado no Render para API e no Netlify para dashboard.

### Alterado

- `frontend/src/services/api.js` passa a usar `VITE_API_URL`, mantendo fallback para o backend local.
- `frontend/src/pages/DetalhesSessao.jsx` passa a usar `VITE_BACKEND_ORIGIN` para carregar screenshots do backend publicado, mantendo fallback local.
- README e SETUP passam a documentar URLs, configuracao de deploy, validacoes e limitacoes atuais.

### Validado

- API publicada respondeu ao health check e conectou ao MongoDB Atlas.
- dashboard publicado abriu no Netlify, incluindo carregamento direto da rota `/login`.
- login de administrador e criacao de dados foram confirmados no ambiente publicado.

### Limitacoes conhecidas

- instancias Free do Render podem hibernar apos inatividade;
- screenshots ainda usam filesystem efemero do Render;
- CORS permanece aberto temporariamente;
- o jogo Unity ainda precisa de uma etapa propria para apontar ao backend publicado e gerar novo build WebGL.

---

## [1.10.0] — 2026-05-13 — Fluxo demonstrativo e leitura das sessoes

### Adicionado

- `seedDemo.js` — sessoes demonstrativas com erro seguido de acerto final na mesma fase
- `seedDemo.js` — screenshot ativado na sessao recente da Clara Demo para demonstrar o mapa com imagem
- `seedDemoRandom.js` — sessoes aleatorias tambem registram tentativa errada, erro, tentativa correta e acerto
- `DetalhesSessao.jsx` — compatibilidade com payloads `target` e `expected` dos dados demonstrativos
- `DetalhesSessao.jsx` — sequencia da sessao navegavel por fase
- `DetalhesSessao.css` — abas visuais para selecionar fases na sequencia da sessao
- `PerfilAluno.jsx` — card de captura com icone e destaque visual
- `PerfilAluno.css` — estilos do card destacado para salvar imagem da proxima sessao

### Alterado

- `DetalhesSessao.jsx` — cabeçalho da sessao deixa de exibir o ID tecnico e passa a mostrar aluno, data e duracao
- `DetalhesSessao.jsx` — linha do tempo foi substituida por uma leitura por fases, reduzindo excesso de scroll
- `DetalhesSessao.jsx` — campos tecnicos duplicados, como `target`, deixam de aparecer nos chips da sequencia
- `PerfilAluno.jsx` — texto da captura passa a indicar claramente que a imagem sera salva na proxima sessao

### Comportamento

- A demonstracao fica mais realista para professores e avaliadores, pois fases com erro mostram a tentativa incorreta e o acerto posterior.
- A sessao recente da Clara Demo ja apresenta imagens no mapa de interacoes, facilitando a demonstracao inicial.
- A tela de detalhes da sessao fica mais legivel, com navegacao por fase em vez de lista longa de eventos.
- O recurso de imagem no mapa de calor fica mais visivel no perfil do aluno.

---

## [1.9.0] — 2026-05-11 — Mapa de interacoes com arraste

### Adicionado

- `Session.js` — campo `dragPath[]` para armazenar pontos de inicio, movimento e fim do arraste
- `dashboardController.js` — retorno de `dragPath` no endpoint de heatmap da sessao
- `DetalhesSessao.jsx` — desenho de trajetos de arraste no mapa de interacoes
- `DetalhesSessao.jsx` — cores por fase no mapa geral para diferenciar as interacoes
- `DetalhesSessao.jsx` — linhas continuas para movimento e linhas tracejadas para arraste
- `DetalhesSessao.jsx` — marcadores menores para cliques, com destaque branco/vermelho
- `DetalhesSessao.jsx` — hover interativo em trajetos e cliques do mapa
- `DetalhesSessao.jsx` — clique no mapa geral para abrir diretamente a fase correspondente
- `DetalhesSessao.css` — legenda visual e indicadores coloridos nas abas de fase

### Alterado

- `DetalhesSessao.jsx` — mapa geral passa a combinar movimento, arraste e cliques por fase
- `DetalhesSessao.jsx` — sessoes sem imagem usam escala fixa de referencia para evitar zoom artificial
- `DetalhesSessao.jsx` — visualizacao por fase agora destaca o trajeto correspondente com maior intensidade no hover
- `DetalhesSessao.jsx` — legenda do mapa foi atualizada para explicar cores, linhas e cliques

### Comportamento

- O professor consegue diferenciar visualmente movimento livre, cliques e momentos em que o aluno segurou/arrastou um item.
- Cada fase possui uma cor propria no mapa geral.
- O arraste aparece tracejado para nao ser confundido com o caminho normal do mouse.
- Ao clicar em um trajeto ou clique no mapa geral, o dashboard abre a fase relacionada.
- Sessoes antigas sem `dragPath` continuam funcionando normalmente, exibindo apenas movimento, cliques e imagens quando existirem.

---

## [1.8.0] — 2026-05-07 — Home com selecao de jogo e fluxo por instituicao

### Adicionado

- `Home.jsx` — selecao de jogo na visao geral do dashboard
- `Home.jsx` — card para **Para Que Serve?** como jogo ativo
- `Home.jsx` — card para **Historietas Divertidas** como integracao futura bloqueada
- `Home.jsx` — listagem de instituicoes apos selecao do jogo acompanhado
- `Home.css` — estilos para selecao de jogo e cards de instituicao
- `Turmas.jsx` — leitura de `institutionId` e `gameId` via query string
- `Turmas.jsx` — filtro visual de turmas por instituicao ao acessar pela Home
- `DetalheTurma.jsx` — preservacao de `gameId` ao abrir o perfil do aluno
- `PerfilAluno.jsx` — preservacao de `gameId` ao abrir detalhes de sessao
- `DetalheTurma.jsx` — indicador visual do jogo acompanhado na tela da turma
- `api.js` — suporte opcional a `gameId` nas chamadas de resumo, historico e alertas

### Alterado

- `Home.jsx` — deixou de listar diretamente todos os alunos e passou a seguir o fluxo jogo -> instituicao -> turma -> aluno
- `Home.jsx` — passa a persistir o jogo selecionado na URL com `?gameId=...`
- `Turmas.jsx` — botao de voltar preserva `gameId` ao retornar para a Home
- `Turmas.jsx` — criacao de turma a partir de uma instituicao ja vem vinculada a essa instituicao
- `Turmas.jsx` — botao de cancelar foi movido para dentro do formulario de turma
- `DetalheTurma.jsx` — botao de cancelar foi movido para dentro do formulario de aluno
- `DetalheTurma.jsx` — formulario de aluno agora limpa os campos ao cancelar ou concluir cadastro
- `dashboardController.js` — resumo e alertas aceitam filtro opcional por `gameId`
- `sessionsController.js` — historico de sessoes por jogador aceita filtro opcional por `gameId`

### Comportamento

- O dashboard agora preserva o contexto do jogo acompanhado nas principais rotas:
    - `/?gameId=para-que-serve`
    - `/turmas?institutionId=...&gameId=para-que-serve`
    - `/turmas/:id?gameId=para-que-serve`
    - `/aluno/:id?gameId=para-que-serve`
    - `/sessao/:sessionId?gameId=para-que-serve`
- Quando `gameId` e informado, resumo, historico e alertas do aluno sao filtrados por jogo.
- Quando `gameId` nao e informado, as chamadas continuam funcionando no modo geral.
- A estrutura prepara a plataforma para receber novos jogos futuramente, sem implementar ainda cadastro completo de jogos.

---

## [1.7.0] — 2026-05-06 — Controle de origem e heatmap por fase

### Adicionado

- `Student.js` — campo `capturaSolicitadaOrigem` para registrar se a captura foi ativada pelo dashboard ou pela Unity
- `unityController.js` — rota publica para a Unity ligar/desligar captura de imagens da proxima sessao
- `DetalhesSessao.jsx` — abas **Geral** e por fase no mapa de interacoes
- `DetalhesSessao.jsx` — desenho do caminho do mouse e cliques sobre imagens capturadas por fase
- `RelatorioPDF.jsx` — secao "Mapas de Interacao" com resumo de sessoes com imagens e sessoes com mapa geral
- `PerfilAluno.jsx` — modal visual para avisos de captura, substituindo alerta nativo do navegador

### Alterado

- `studentsController.js` — solicitacoes feitas pelo dashboard agora respeitam a origem da captura
- `unityController.js` — solicitacoes feitas pela Unity agora respeitam a origem da captura
- `sessionsController.js` — reset automatico limpa `capturaSolicitada` e `capturaSolicitadaOrigem` apos receber sessao com imagens
- `PerfilAluno.jsx` — bloqueia alteracao no dashboard quando a captura foi ativada pelo jogo
- `DetalhesSessao.css` e `PerfilAluno.css` — estilos para abas de heatmap, badge de imagens e modal de captura

### Comportamento

- A captura vale para a proxima sessao/categoria.
- Dashboard e Unity nao sobrescrevem solicitacoes feitas pela outra origem.
- Sessoes sem imagens continuam exibindo o mapa geral de interacoes.

---

## [1.6.0] — 2026-05-06 — Solicitacao de imagens para mapa de calor

### Adicionado

- `Student.js` — campo `capturaSolicitada` para controlar captura sob demanda por aluno
- `Session.js` — sub-schema `FaseScreenshotSchema` e campo `screenshots[]` para armazenar caminhos das imagens por fase
- `studentsController.js` — metodo `solicitarCaptura()` para ativar ou cancelar captura de imagens
- `students.js` — rota `PATCH /api/students/:id/solicitar-captura`
- `sessionsController.js` — processamento de screenshots em base64, salvando arquivos em `backend/uploads/screenshots/`
- `app.js` — exposicao estatica de `/uploads` e limite maior para JSON com imagens
- `unityController.js` — retorno de `capturaSolicitada` na listagem publica de alunos consumida pela Unity
- `PerfilAluno.jsx` — bloco "Imagens no mapa de calor" para professor ativar/desativar a proxima captura
- `PerfilAluno.css` — estilos do bloco e botao de solicitacao de imagens
- `api.js` — funcao `solicitarCaptura()`
- `.gitignore` — ignora `backend/uploads/`, evitando versionar imagens geradas em runtime

### Comportamento

- A captura e sob demanda: apos o backend receber uma sessao com screenshots, `capturaSolicitada` volta automaticamente para `false`.

---

## [1.5.0] — 2026-05-02 — Fix bug de sessao + historico com categoria

### Corrigido

- `LudusMonitor.cs` — adiciona campo `_currentPlayerId` para persistir jogador entre sessoes
- `LudusMonitor.cs` — adiciona metodo `DefinirJogador()` — registra jogador sem iniciar sessao
- `LudusMonitor.cs` — simplifica `ReiniciarSessao()` — remove `EndSession()` automatico que gerava sessao extra vazia
- `LudusGameEvents.cs` — adiciona `DefinirJogador()` — API publica para tela de identificacao
- `LudusGameEvents.cs` — adiciona `NovaSessaoCategoria()` — reinicia sessao e registra categoria
- `Menu.cs` — substitui chamada de `CategorySelected()` por `NovaSessaoCategoria()` ao selecionar categoria
- Tela de identificacao — substitui `StartSession()` por `DefinirJogador()`, separando identificacao do inicio de sessao

### Adicionado

- `PerfilAluno.jsx` — funcao `extrairCategoria()` — le `gameEvents` para obter o nome da categoria de cada sessao
- `PerfilAluno.jsx` — card do historico de sessoes exibe categoria em destaque e data em tamanho secundario
- `PerfilAluno.css` — classes `.sessao-categoria` e `.sessao-data-menor`
- `DetalhesSessao.jsx` — Header dinamico exibe nome da categoria da sessao no titulo da pagina

---

## [1.4.0] — 2026-04-29 — Refactor: Escolas renomeadas para Instituicoes

### Alterado

- `backend/src/models/School.js` -> `Institution.js` — model renomeado
- `backend/src/controllers/schoolsController.js` -> `institutionsController.js`
- `backend/src/routes/schools.js` -> `institutions.js`
- `/api/schools` -> `/api/institutions` em `app.js`
- `User.js` e `Group.js` — `schoolId` -> `institutionId`, ref `"School"` -> `"Institution"`
- `groupsController.js` — filtro e populate atualizados para `institutionId`
- `authController.js` — `schoolId` -> `institutionId` em registro, login, perfil e atualizarPerfil
- `usersController.js` — `schoolId` -> `institutionId` em listar e atualizar
- `unityController.js` — `School` -> `Institution`, `schoolId` -> `institutionId`
- `unity.js` (routes) — parametro `:schoolId` -> `:institutionId`
- `frontend/src/services/api.js` — funcoes `listarEscolas`, `criarEscola`, etc. -> `listarInstituicoes`, `criarInstituicao`, etc.; URL `/schools` -> `/institutions`
- `frontend/src/pages/GerenciarEscolas.jsx` -> `GerenciarInstituicoes.jsx` — todos os labels e variaveis atualizados
- `frontend/src/pages/GerenciarUsuarios.jsx` — `listarEscolas` -> `listarInstituicoes`, `schoolId` -> `institutionId`
- `frontend/src/pages/Turmas.jsx` — `listarEscolas` -> `listarInstituicoes`, `schoolId` -> `institutionId`
- `frontend/src/components/layout/Sidebar.jsx` — "Escolas" -> "Instituicoes", rota `/admin/escolas` -> `/admin/instituicoes`
- `frontend/src/App.jsx` — import e rota atualizados

---

## [1.3.0] — 2026-04-28 — Area Admin completa + tela de perfil do usuario

### Adicionado

- `frontend/src/components/shared/RotaAdmin.jsx` — protecao de rotas exclusivas para admin
- `frontend/src/pages/GerenciarEscolas.jsx` — CRUD completo de escolas (listar, criar, editar, remover)
- `frontend/src/pages/GerenciarUsuarios.jsx` — CRUD completo de usuarios (listar, criar, editar, remover)
- `frontend/src/pages/Perfil.jsx` — tela de perfil acessivel por qualquer usuario logado
- `backend/src/controllers/usersController.js` — listar, atualizar e deletar usuarios
- `backend/src/routes/users.js` — rotas protegidas por autenticacao + admin
- `PUT /api/users/:id` — admin edita qualquer usuario
- `PUT /api/auth/perfil` — usuario edita o proprio perfil com mensagem dinamica
- Menu admin na sidebar visivel apenas para `role === 'admin'`
- Card de usuario na sidebar vira link clicavel para `/perfil`
- Classes globais adicionadas ao `index.css`

### Alterado

- `frontend/src/contexts/AuthContext.jsx` — `setUsuario` exposto no Provider
- `frontend/src/components/layout/Sidebar.jsx` — menu admin condicional + card de usuario como NavLink
- `frontend/src/services/api.js` — funcoes `listarUsuarios`, `deletarUsuario`, `atualizarUsuario`, `atualizarPerfil`
- `frontend/src/App.jsx` — rotas `/admin/escolas`, `/admin/usuarios`, `/perfil`
- `backend/src/controllers/authController.js` — adicionado `atualizarPerfil` com mensagem dinamica
- `backend/src/routes/auth.js` — adicionado `PUT /api/auth/perfil`
- `backend/src/app.js` — registrado `/api/users`

---

## [1.2.0] — 2026-04-27 — Indicador de desempenho na Home

### Adicionado

- `frontend/src/pages/Home.jsx` — indicador visual de desempenho nos cards
    - Componente `CardAluno` com busca individual de resumo via `resumoJogador`
    - Bom desempenho — taxa >= 70%
    - Desempenho regular — taxa entre 50% e 70%
    - Atencao necessaria — taxa < 50%
    - Criterio exibido explicitamente: "(taxa de acerto)"

---

## [1.1.0] — 2026-04-26 — Geracao de PDF formal

### Adicionado

- `frontend/src/components/shared/RelatorioPDF.jsx`
    - Template formal com linguagem acessivel para pais/responsaveis
    - Secoes: dados do aluno, resumo de desempenho, categorias, alertas, historico de sessoes e anotacoes
    - Tabela de sessoes com categoria, acertos, erros, taxa, duracao, avaliacao em estrelas e pausas
    - Alertas traduzidos para linguagem nao tecnica com explicacoes detalhadas
    - Nome do professor que gerou o relatorio no cabecalho
    - Aviso formal de que o documento nao constitui diagnostico
- `frontend/src/pages/PerfilAluno.jsx`
    - Botao "Gerar Relatorio PDF"
    - Geracao via `html2pdf.js` com nome do arquivo incluindo nome do aluno e data
    - Template invisivel na tela, renderizado apenas no PDF

---

## [1.0.0] — 2026-04-25

### Adicionado — Alertas pedagogicos + refatoracao

- Alertas automaticos no backend: taxa baixa, inatividade, sem jogar, categoria problematica, evolucao positiva
- Alertas exibidos no perfil do aluno com cores por severidade
- Fix: renomear aluno atualiza playerId em todas as sessoes
- Fix: criarAluno salva todos os campos corretamente
- Home refatorada para buscar alunos cadastrados
- Rota GET /api/sessions/player/:playerId
- Categorias traduzidas no perfil do aluno
- Grafico de evolucao adicionado ao PerfilAluno
- Remocao da collection players legada

---

## [0.9.0] — 2026-04-21

### Adicionado — CRUD de turmas e alunos

- Turmas, DetalheTurma, PerfilAluno
- Student model com campos clinicos e historico de anotacoes

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuario logado e botao sair

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas publicas /api/unity para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticacao + Hierarquia

- Models: User, School, Group, Student
- Auth JWT, middleware, script criarAdmin

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout, Home, DetalhesSessao, heatmap e timeline

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de sessions e dashboard

---

## [0.3.0] — 2026-04-17

### Adicionado

- Controller e rotas de sessions

---

## [0.2.0] — 2026-04-17

### Adicionado

- Models: Session, Institution

---

## [0.1.0] — 2026-04-15

### Adicionado

- Setup inicial: Express + MongoDB Atlas + nodemon

---

## Proximas versoes planejadas

- `[1.11.0]` — Tutorial WebGL e ajustes de compatibilidade do jogo
- `[2.0.0]` — Preparacao para primeiros testadores programadores
- `[2.1.0]` — Responsividade + design final da designer
- `[2.2.0]` — Sistema publicado e testado nas instituicoes parceiras
- `[3.0.0]` — ML: K-Means + Arvore de Decisao
