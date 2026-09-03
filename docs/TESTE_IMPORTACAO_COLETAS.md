# Teste local — da caixa de coletas ao histórico

## Preparação

Use apenas estudantes fictícios e o backend `npm run dev:lote:temp`.
Esse processo usa MongoDB em memória: reiniciá-lo apaga os dados de teste,
incluindo códigos, alunos e recebimentos anteriores. Não use o Atlas real.

Após atualizar o código do backend, reinicie esse processo. Mantenha o frontend
com `npm run dev`. A extensão não precisa ser reconstruída por esta etapa.

## Passo a passo

1. Entre com a professora de teste e crie uma coleta para a turma temporária.
2. Na extensão, use um nome fictício e o novo código. Se houver acompanhamento
   antigo, preserve seu JSON antes de limpar; um código do processo anterior
   não será válido no novo banco temporário.
3. Faça duas capturas curtas com nomes de atividade diferentes e encerre cada
   uma. Confira a confirmação de envio na extensão.
4. Em **Coletas → Ver recebimentos**, confira as duas sessões pendentes.
5. Em **Revisar aluno**, escolha um aluno da turma ou crie o aluno fictício.
6. Clique em **Adicionar sessões ao histórico** e confira o nome na confirmação.
7. A caixa deve mostrar zero pendentes e duas sessões no histórico.
8. Em **Alunos**, abra o perfil: as duas sessões devem aparecer, cada uma no seu
   jogo. Abra os detalhes e confira duração e interações.
9. Reabra os recebimentos e recarregue a página: os totais não devem duplicar.
10. Envie uma terceira sessão. Reabra os recebimentos: somente ela deve ficar
    pendente; adicione-a e confirme o total de três no histórico.

## Limites e recuperação

- Aprova até 100 recibos por ação, somente para o aluno confirmado.
- Falhas parciais preservam os recebimentos. Repita a ação para os pendentes.
- Se o mesmo identificador já veio por importação manual, a caixa sinaliza
  conflito: não sobrescreve nem presume que o conteúdo seja equivalente.
- O código pode ter expirado ou sido revogado: isso impede novos envios, mas
  não impede a professora autorizada de revisar o que já recebeu.
- A aprovação usa as regras de normalização da importação existente e mantém
  `ingestionMethod: file-import` no contrato atual. `observationReceiptId` é
  rastreio interno, não campo enviado pela extensão nem mudança no SDK.
- Não há transação única de todo o lote. A criação do jogo/vínculo pode ocorrer
  antes da sessão; nova tentativa retoma o processo sem sobrescrever dados.
- Dados observacionais não permitem inferir acertos, erros ou aprendizagem.

## Verificação automatizada nesta etapa

Testes com banco em memória cobrem autorização, aluno não confirmado, recibo
indevido, jogos distintos, repetição, falha após gravar Session e conflito com
importação manual. Lint e build do frontend também foram executados.
A aprovação visual no navegador permanece parte do teste manual acima.

Rodrigo confirmou em 02/09/2026 o funcionamento manual da importação e da
exibição no histórico. Após essa validação, o aviso de resultado recebeu
espaçamento e estilos de sucesso/atenção; esse acabamento visual ainda precisa
ser conferido no navegador.

## Modais do dashboard — implantação gradual

Substituir gradualmente `window.alert`, `window.confirm` e `window.prompt` do
dashboard por modais com a identidade visual do site. Solicitação de Rodrigo
em 02/09/2026. O primeiro fluxo implementado é a aprovação das sessões; as
ações de arquivar/reativar jogos nas telas **Jogos** e **Gerenciar jogos**
também usam um modal próprio compartilhado. A remoção de anotações no perfil
do aluno é o terceiro fluxo migrado. As demais confirmações de exclusão
de aluno, turma, instituição e usuário usam agora um modal reutilizável. Não
restam chamadas nativas a `alert`, `confirm` ou `prompt` no frontend.

### Teste manual dos modais de exclusão (pendente)

Use somente cadastros fictícios e descartáveis. Não confirme exclusões sobre
dados reais. Em cada tela, teste primeiro Cancelar e Escape.

1. **Aluno por jogo** e **detalhes da turma**: confirme nome e aviso sobre
   perfil, sessões e imagens. Para validar a confirmação real, use um aluno
   fictício sem qualquer dado que precise ser preservado.
2. **Turmas**: tente excluir uma turma com aluno fictício. O backend deve negar
   e a mensagem deve aparecer no modal, que permanece aberto. Teste a remoção
   real somente em uma turma fictícia vazia.
3. **Instituições**: confira o aviso sobre dados vinculados. Para evitar perda
   acidental, valide Cancelar/Escape; confirmação real apenas em uma instituição
   fictícia vazia e criada especificamente para o teste.
4. **Usuários**: valide Cancelar/Escape com um usuário fictício. Confirmação
   real apenas em conta descartável, nunca na conta atualmente usada.
5. Em todos os casos, confira bloqueio durante a requisição, erro recuperável e
   retorno do foco ao botão original ou a outro controle disponível.

Preservar confirmação explícita, foco inicial seguro, navegação por teclado,
Escape/cancelamento, retorno de foco e bloqueio de confirmação duplicada.
Cancelar nunca deve disparar a operação. Manter mensagens de falha acessíveis.
Pedidos nativos de permissão do navegador não entram nessa substituição.

### Teste manual do primeiro modal (pendente)

1. Com aluno confirmado e sessões pendentes, clique em **Adicionar sessões ao
   histórico**. Deve abrir um modal do site, com nome e quantidade corretos.
2. O foco começa em **Cancelar**. Use Tab e Shift+Tab: o foco deve permanecer
   no modal. Teste Escape e Cancelar; nenhum deles deve enviar sessões, e o
   foco deve retornar ao botão de origem.
3. Reabra e confirme. Durante o envio, os botões ficam bloqueados; cliques
   repetidos não devem gerar pedidos extras. Escape não fecha nessa fase.
4. Após sucesso, o modal fecha e os contadores atualizam. Se o botão de origem
   desaparecer, o foco vai ao título **Coletas preparadas**.
5. Simule rede offline pelas ferramentas do navegador, confirme e verifique
   a mensagem de falha dentro do modal. Restaure a rede e tente novamente.
   Não reinicie o banco temporário para esse teste, pois apagaria a coleta.
6. Confira em janela estreita e zoom de 100%: texto e botões devem permanecer
   acessíveis, com rolagem interna apenas quando necessária.

### Teste manual do modal de jogos (pendente)

1. Nas telas **Jogos** e **Gerenciar jogos**, abra a confirmação de arquivamento.
   O modal deve mostrar o nome correto e explicar que o histórico será mantido.
2. Teste Cancelar e Escape; o estado não deve mudar e o foco retorna ao botão.
3. Confirme o arquivamento. Os botões ficam bloqueados durante a requisição e o
   card deve passar a **Arquivado** sem perder alunos ou sessões.
4. Abra novamente, confirme **Reativar** e confira o retorno ao estado ativo.
5. Simule rede offline: a falha deve aparecer no modal e permitir nova tentativa.

### Teste manual do modal de anotação (pendente)

1. No perfil de um aluno fictício, crie uma anotação sem dados reais.
2. Clique na lixeira. O modal deve mostrar o conteúdo correto e avisar que a
   remoção é permanente.
3. Teste Cancelar e Escape; a anotação deve permanecer e o foco retornar à
   lixeira correspondente.
4. Confirme a remoção. Os botões devem ficar bloqueados até a anotação sumir.
   Como o botão deixa de existir, o foco deve ir ao título das anotações.
5. Com rede offline, confirme: o modal deve permanecer aberto, exibir o erro e
   permitir nova tentativa depois que a rede for restaurada.
