# Checklist da candidata a lançamento — LUDUS Acompanha

Este checklist reúne os critérios mínimos para declarar uma versão candidata
apta a testes com desenvolvedores e, depois, a uma aplicação escolar
acompanhada. Ele não autoriza deploy nem uso com dados reais por si só.

Marque cada item com uma evidência curta: data, ambiente, responsável e
resultado. Quando houver falha, registre o problema e repita somente o trecho
afetado após a correção.

## 1. Congelamento e rastreabilidade

- [ ] As alterações do dashboard/backend e do SDK foram revisadas separadamente.
- [ ] Não há arquivos de build, `Library/`, `Temp/`, `.env`, tokens ou senhas no Git.
- [ ] `README.md`, `CHANGELOG.md` e os guias descrevem o comportamento atual.
- [ ] A versão do pacote Unity, a tag pretendida e a URL de instalação coincidem.
- [ ] O commit candidato foi identificado, sem misturar mudanças experimentais.
- [ ] Existe uma cópia segura do banco antes de qualquer migração ou limpeza.

## 2. Qualidade automatizada

No backend:

```powershell
cd backend
npm test
npm run validate:telemetry
```

No frontend:

```powershell
cd frontend
npm run lint
npm run build
```

- [ ] Todos os testes do backend passaram em banco temporário.
- [ ] Os exemplos de telemetria passaram na validação de schema.
- [ ] Lint e build de produção do frontend passaram.
- [ ] Avisos de tamanho de bundle foram avaliados; páginas comuns não carregam o PDF antecipadamente.
- [ ] `git diff --check` não apontou erro de whitespace.

## 3. Contrato entre SDK, API e dashboard

- [ ] Uma sessão contém `sessionId`, `studentId` quando aplicável, `playerId`, `gameId`, horários e métricas coerentes.
- [ ] Eventos semânticos aparecem em `gameEvents[]` sem substituir a telemetria bruta.
- [ ] Checkpoints não entram nos totais pedagógicos antes da conclusão.
- [ ] Reenvio idêntico é idempotente e reenvio conflitante é recusado.
- [ ] O envio ao encerrar a categoria chega ao participante correto.
- [ ] Falha de rede gera fallback local e permite recuperação posterior.
- [ ] JSON legado e versões de schema ainda suportadas permanecem legíveis.
- [ ] Screenshot é acessível somente por rota autenticada e usuário autorizado.

## 4. Fluxos por perfil

### Professor

- [ ] Cadastro, confirmação de email, login e redefinição de senha funcionam.
- [ ] Instituição, turma e aluno podem ser criados, editados e excluídos conforme as proteções existentes.
- [ ] Uma coleta pode ser criada, apresentada, revogada e revisada.
- [ ] Participante pendente pode ser vinculado ou criado conscientemente.
- [ ] Sessão, sequência, mapa, indicadores e PDF abrem sem linguagem diagnóstica.
- [ ] Um colaborador pode ser convidado com permissões mínimas e depois revogado.

### Desenvolvedor/colaborador

- [ ] O laboratório usa somente instituição, turma e aluno fictícios.
- [ ] CRUD de jogos funciona no escopo autorizado.
- [ ] Acesso real aparece separado do laboratório.
- [ ] Turmas, alunos, coletas e resultados respeitam cada permissão concedida.
- [ ] Revogação remove o acesso sem apagar os dados da instituição.

### Administrador

- [ ] Solicitações de instituição podem ser revisadas sem ampliar privilégios indevidamente.
- [ ] Gestão de contas não expõe senhas, tokens ou dados pedagógicos desnecessários.
- [ ] Rotas administrativas recusam professor e desenvolvedor sem autorização.

## 5. Unity Editor e WebGL

- [ ] O objeto base do SDK existe uma única vez e persiste apenas quando necessário.
- [ ] O painel de nome+código é criado na raiz, movido para o Canvas escolhido e mantém tamanho responsivo.
- [ ] O ícone mostra estado desconectado e conectado de forma compreensível.
- [ ] Nome e código são confirmados antes de iniciar a atividade.
- [ ] Foi realizada uma rodada com pelo menos um erro e um acerto.
- [ ] Cliques, movimentos, arrastes, eventos de fase e `SessionEnded` foram conferidos.
- [ ] O mesmo roteiro passou no Editor e em um build WebGL de produção.
- [ ] Console do navegador e Console do Unity não apresentaram exceções.

## 6. Ensaio de laboratório com 30 computadores

Executar primeiro com dados fictícios e em rede equivalente à da escola.

- [ ] O código da coleta foi exibido sem ser enviado por canais pessoais.
- [ ] Trinta participantes fictícios distintos conseguiram parear.
- [ ] Os acessos foram distribuídos em uma janela curta, simulando o início da aula.
- [ ] O primeiro carregamento após eventual hibernação do backend foi medido.
- [ ] Foram registrados tempo de pareamento, tempo de envio e quantidade de falhas/reenvios.
- [ ] Uma parte dos computadores teve a rede interrompida para validar checkpoint e fallback.
- [ ] A caixa da coleta não duplicou sessões após reconexão.
- [ ] O dashboard continuou utilizável enquanto os envios chegavam.
- [ ] PCs de menor capacidade foram observados quanto a FPS, memória, carregamento e travamentos.

Não há um requisito fixo de hardware definido nesta versão. O aceite deve usar
os computadores reais ou uma configuração representativa e registrar os
resultados, em vez de presumir desempenho por causa da máquina de build.

## 7. Privacidade e uso pedagógico

- [ ] A aplicação foi autorizada pela instituição e segue o procedimento ético/acadêmico aplicável.
- [ ] Somente dados necessários foram cadastrados; campos clínicos legados não foram preenchidos.
- [ ] Responsáveis e participantes receberam informação adequada ao contexto e à faixa etária.
- [ ] A política de captura visual foi decidida antes da atividade.
- [ ] O contato público de privacidade aponta para canal institucional monitorado.
- [ ] Permissões de colaboradores seguem o menor acesso necessário.
- [ ] Retenção, exportação e exclusão dos dados têm responsável e prazo definidos.
- [ ] Indicadores são apresentados como evidências parciais para mediação docente.

Consulte também [Privacidade, ética e governança de dados](PRIVACIDADE_ETICA_E_DADOS.md).

## 8. Configuração de produção

- [ ] `MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY` e demais segredos existem somente no provedor.
- [ ] `FRONTEND_URL`, `CORS_ORIGINS` e origens WebGL contêm apenas domínios necessários.
- [ ] `VITE_API_URL` aponta para a API correta.
- [ ] `VITE_PRIVACY_CONTACT_EMAIL` contém um contato institucional válido.
- [ ] Health check responde, login funciona e rotas React abrem após recarregar.
- [ ] Screenshot autenticada funciona e acesso cruzado entre contas é recusado.
- [ ] Foi documentada a limitação do filesystem efêmero para capturas visuais.
- [ ] Logs de produção não exibem tokens, códigos de coleta, payloads completos ou dados pessoais.

## 9. Rollback e resposta a falhas

- [ ] O commit/tag anterior está identificado e pode ser republicado.
- [ ] O responsável sabe pausar novas coletas sem excluir dados existentes.
- [ ] Há procedimento para revogar código de coleta e acesso de colaborador.
- [ ] O backup foi testado ou sua restauração foi documentada.
- [ ] Incidentes de privacidade têm canal, registro e responsável definidos.

## 10. Evidências úteis para avaliação e artigo

- [ ] Versão exata do SDK, dashboard e navegador foi registrada.
- [ ] Ambiente e especificações aproximadas das máquinas foram registrados.
- [ ] Tarefas, tempo, erros, pedidos de ajuda e conclusão foram anotados.
- [ ] Logs usados na análise estão anonimizados ou pseudonimizados.
- [ ] Prints não mostram nomes reais, códigos ativos, emails ou tokens.
- [ ] Limitações e resultados negativos foram preservados no relato.

## Critério de decisão

A candidata pode avançar quando todos os itens críticos das seções 1 a 5, 7,
8 e 9 estiverem comprovados. A seção 6 é obrigatória antes de afirmar que a
solução foi validada para uso simultâneo em laboratório. Pendências aceitas
devem estar escritas, ter responsável e não comprometer segurança, privacidade,
integridade dos dados ou o fluxo pedagógico.
