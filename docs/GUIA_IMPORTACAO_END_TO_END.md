# Guia definitivo: importar uma sessão LUDUS e conferir no Dashboard

Este roteiro é comum aos JSONs gerados pelo **LUDUS Unity SDK** e pelo **LUDUS
Observa**. Ele começa depois que o arquivo já foi baixado.

Faça a validação somente em ambiente local ou demonstrativo ligado a um banco
temporário. Use participante, instituição, turma, jogo e atividade fictícios.
Nunca importe testes no Atlas produtivo nem use perfis reais ou protegidos.

## Resultado esperado

O JSON será validado antes de qualquer gravação, vinculado ao participante
fictício correto e exibido no perfil, no detalhe da sessão e no mapa de
interações conforme as capacidades realmente declaradas pela fonte.

## 1. Preparar um participante fictício

1. Inicie o backend e o frontend no ambiente seguro já configurado para testes.
2. Entre no Dashboard com uma conta demonstrativa.
3. Crie ou selecione uma instituição, turma e participante exclusivamente
   fictícios.
4. Confirme que o ambiente não aponta para o banco produtivo.

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
4. Leia a prévia: jogo, modalidade, fonte, duração, capacidades e contagens.
5. Se houver erro, não edite o JSON para contornar a validação. Volte à fonte
   que o gerou e corrija a causa.

A validação ainda não grava a sessão.

## 4. Resolver o vínculo quando o JSON pertence a outro jogo

Se aparecer **Identificamos outro jogo neste arquivo**, escolha normalmente:

**Vincular este aluno e importar agora**

Essa opção cria o vínculo do mesmo participante com o jogo detectado e importa
a sessão sem criar outra identidade.

Use **Criar outro perfil neste jogo** apenas quando você realmente quiser uma
identidade separada e souber por que isso é necessário.

## 5. Confirmar a importação

1. Clique em **Importar sessão** ou **Importar N sessões**.
2. Aguarde a confirmação.
3. No perfil, abra **Todos os jogos** e confirme que cada sessão mostra o nome
   do jogo correspondente.
4. Use os filtros individuais para conferir as sessões de cada jogo.
5. Verifique o marcador **JSON importado**.

## 6. Conferir o detalhe da sessão

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

## 7. Encerrar o teste com segurança

1. Registre quais arquivos foram validados e o resultado observado.
2. Remova somente os dados fictícios do banco temporário, quando isso fizer
   parte do procedimento do ambiente.
3. Não execute limpeza genérica, seed ou exclusão em base produtiva.

## Checklist de aceite

- [ ] O ambiente usa banco temporário ou demonstrativo.
- [ ] Todos os nomes e identificadores são fictícios.
- [ ] O JSON passou pela prévia antes da importação.
- [ ] Outro jogo foi vinculado ao mesmo participante quando apropriado.
- [ ] A sessão aparece em **Todos os jogos** e no filtro correto.
- [ ] Modalidade, fonte e capacidades correspondem ao arquivo.
- [ ] O mapa respeita o viewport e os tipos de interação disponíveis.
- [ ] Nenhuma interpretação pedagógica indevida foi criada.
- [ ] Nenhum dado real ou protegido foi alterado.
