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

## Próxima etapa de interface — pendência registrada

Substituir gradualmente `window.alert`, `window.confirm` e `window.prompt` do
dashboard por modais com a identidade visual do site, começando pela aprovação
das sessões. Solicitação de Rodrigo em 02/09/2026; não implementada nesta etapa.

Preservar confirmação explícita, foco inicial seguro, navegação por teclado,
Escape/cancelamento, retorno de foco e bloqueio de confirmação duplicada.
Cancelar nunca deve disparar a operação. Manter mensagens de falha acessíveis.
Pedidos nativos de permissão do navegador não entram nessa substituição.
