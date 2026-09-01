# Guia definitivo: importar sessões LUDUS e conferir no Dashboard

Este roteiro é comum ao JSON de uma sessão gerado pelo **LUDUS Unity SDK** ou
pelo **LUDUS Observa** e ao lote multi-jogo exportado pelo capturador. Ele
começa depois que o arquivo já foi baixado.

Faça a validação somente em ambiente local ou demonstrativo ligado a um banco
temporário. Use participante, instituição, turma, jogo e atividade fictícios.
Nunca importe testes no Atlas produtivo nem use perfis reais ou protegidos.

## Resultado esperado

O JSON será validado antes de qualquer gravação, vinculado ao participante
fictício correto e exibido no perfil, no detalhe de cada sessão e no mapa de
interações conforme as capacidades realmente declaradas pela fonte. Em um
lote, os jogos e as sessões permanecem separados.

## 1. Preparar um participante fictício

Para o teste manual do lote, use o ambiente efêmero incluído no projeto. Ele
ignora o `.env`, inicia um MongoDB em memória e apaga tudo ao fechar o processo.

No primeiro CMD:

```cmd
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm run dev:lote:temp
```

No segundo CMD, force o frontend a usar somente a API local:

```cmd
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\frontend
set VITE_API_URL=http://localhost:3000/api
set VITE_BACKEND_ORIGIN=http://localhost:3000
npm run dev
```

Entre com as credenciais fictícias mostradas no primeiro CMD. O ambiente já
contém a instituição **Escola temporária de teste**, a turma **Turma temporária
de teste** e o participante **Aluno Fictício Teste**.

Esse nome coincide com o lote fictício de dois jogos usado no Marco 3:

`ludus-observa-lote_2026-08-31T23-25-41-373Z_dd1762c2ec35.json`

Ao terminar, pressione `Ctrl+C` nos dois terminais. O backend exibirá a
confirmação de encerramento e removerá o banco temporário.

Não use perfis reais ou protegidos, dados de instituições parceiras ou qualquer
pessoa real.

## 2. Abrir o perfil do participante

Você pode entrar por **Alunos** no menu principal ou por um jogo. No perfil, o
filtro **Todos os jogos** permite conferir sessões de fontes e jogos diferentes
sem duplicar a identidade do participante.

## 3. Selecionar e validar o JSON

1. No cartão **Importar telemetria**, clique em **Importar JSON**.
2. Selecione ou arraste um ou mais arquivos `.json`.
3. Clique em **Validar arquivo** ou **Validar N arquivos**.
4. Leia a prévia:
   - em uma sessão, confira jogo, modalidade, fonte, duração, capacidades e
     contagens;
   - em um lote, confira participante informado, quantidade de jogos, sessões,
     duplicidades e a relação dos jogos detectados.
5. Se houver erro, não edite o JSON para contornar a validação. Volte à fonte
   que o gerou e corrija a causa.

A validação ainda não grava a sessão.

## 4. Conferir o participante informado no lote

O lote do LUDUS Observa traz o nome de exibição informado no início do
acompanhamento. O vínculo canônico continua sendo o perfil aberto no Dashboard,
identificado por `studentId`.

Se os nomes forem diferentes, confira cuidadosamente o arquivo e o perfil. Use
**Usar este perfil mesmo assim** somente quando souber que ambos representam a
mesma pessoa fictícia. A importação permanece bloqueada sem essa confirmação.

Nesta versão, o lote não cria aluno automaticamente. Essa resolução será
implementada junto ao contexto de turma e coleta, para não associar uma criança
ao perfil escolar errado apenas pela semelhança de nomes.

## 5. Resolver o vínculo quando uma sessão pertence a outro jogo

Se aparecer **Identificamos outro jogo neste arquivo**, escolha normalmente:

**Vincular este aluno e importar agora**

Essa opção cria o vínculo do mesmo participante com o jogo detectado e importa
a sessão sem criar outra identidade.

Use **Criar outro perfil neste jogo** apenas quando você realmente quiser uma
identidade separada e souber por que isso é necessário.

No lote, os jogos detectados são criados ou reutilizados automaticamente no
catálogo da professora quando a importação é confirmada.

## 6. Confirmar a importação

1. Clique em **Importar sessão**, **Importar lote** ou na ação equivalente para
   vários arquivos.
2. Aguarde a confirmação.
3. No perfil, abra **Todos os jogos** e confirme que cada sessão mostra o nome
   do jogo correspondente.
4. Use os filtros individuais para conferir as sessões de cada jogo.
5. Verifique o marcador **JSON importado**.

Em um lote, confira também se o resumo final informa quantas sessões foram
importadas, quantas já existiam e se ocorreu alguma falha individual. Repetir o
mesmo lote não deve duplicar sessões.

## 7. Conferir o detalhe da sessão

Abra a sessão pela seta da lista e confira:

- participante, plataforma, início e duração;
- modalidade de captura e dados disponíveis;
- contagens coerentes com a prévia;
- mapa de interações dentro do viewport registrado.

### Se a fonte for o LUDUS Unity SDK

Espere `captureMode: "sdk"`. Eventos com significado de jogo só devem aparecer
se o próprio jogo os tiver fornecido. A ausência desses eventos não deve ser
preenchida por inferência do Dashboard.

### Se a fonte for o LUDUS Observa

Espere `captureMode: "observational"`. O mapa pode mostrar cliques, trajetória
e ponteiro pressionado em área neutra, sem screenshot. Não devem aparecer
acertos, erros, fases, diagnóstico, avaliação conclusiva ou alertas semânticos
inventados.

## 8. Encerrar o teste com segurança

1. Registre quais arquivos foram validados e o resultado observado.
2. Remova somente os dados fictícios do banco temporário, quando isso fizer
   parte do procedimento do ambiente.
3. Não execute limpeza genérica, seed ou exclusão em base produtiva.

## Checklist de aceite

- [ ] O ambiente usa banco temporário ou demonstrativo.
- [ ] Todos os nomes e identificadores são fictícios.
- [ ] O JSON passou pela prévia antes da importação.
- [ ] Em lote, participante, jogos, sessões e duplicidades foram conferidos.
- [ ] Qualquer divergência de nome foi resolvida conscientemente.
- [ ] Outro jogo foi vinculado ao mesmo participante quando apropriado.
- [ ] As sessões do lote permaneceram separadas por jogo.
- [ ] Reimportar o mesmo lote não criou sessões duplicadas.
- [ ] A sessão aparece em **Todos os jogos** e no filtro correto.
- [ ] Modalidade, fonte e capacidades correspondem ao arquivo.
- [ ] O mapa respeita o viewport e os tipos de interação disponíveis.
- [ ] Nenhuma interpretação pedagógica indevida foi criada.
- [ ] Nenhum dado real ou protegido foi alterado.
