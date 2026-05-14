# Checklist de demonstracao - LUDUS Acompanha

Este documento descreve um roteiro pratico para reproduzir o fluxo demonstrativo do LUDUS Acompanha usando dados sinteticos e anonimos.

O objetivo e apoiar testes tecnicos, validacao com orientador, preparacao de prints e reproducao do ambiente por outros desenvolvedores.

---

## 1. Preparar o ambiente

### Backend

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm install
npm run dev
```

### Frontend

Em outro terminal:

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\frontend
npm install
npm run dev
```

Acessar:

```txt
http://localhost:5173
```

---

## 2. Gerar dataset demonstrativo fixo

No terminal do backend:

```powershell
npm run seed:demo
```

O comando recria o dataset fixo demonstrativo. Se o dataset ja existir, o console informa que ele sera recriado.

Login gerado:

```txt
Email: professora.demo@ludus.local
Senha: Demo@2026
```

Conferir:

- A professora demo consegue acessar o dashboard.
- A Home exibe a selecao de jogo.
- Ao selecionar **Para Que Serve?**, aparece apenas a instituicao demonstrativa vinculada.
- A instituicao possui a turma demonstrativa.
- A turma possui os alunos ficticios `Clara Demo`, `Nilo Demo` e `Lia Demo`.

---

## 3. Gerar dataset demonstrativo aleatorio

### Dataset random reprodutivel

```powershell
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1 --seed=2026
```

Login gerado:

```txt
Email: professor.random.demo@ludus.local
Senha: Demo@2026
```

Conferir:

- O script cria pelo menos 3 alunos.
- Os alunos representam tres perfis sinteticos:
    - indicadores positivos;
    - desenvolvimento intermediario;
    - necessidade de maior observacao docente.
- A mesma seed gera o mesmo conjunto de dados.

### Dataset random variavel

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2
```

Conferir:

- Como nao ha `--seed`, o script usa a data/hora atual.
- Os nomes e sessoes tendem a variar entre execucoes.
- Sem `--append`, o dataset random anterior e recriado.

### Popular banco sem apagar dados random anteriores

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append
```

Conferir:

- Um novo lote e adicionado ao banco.
- Turmas e alunos recebem sufixo de lote.
- Dados random anteriores permanecem disponiveis.

### Popular banco sem gerar screenshots

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append --no-screenshots
```

Conferir:

- As sessoes sao criadas sem imagens sinteticas.
- O mapa de interacoes funciona em area neutra.
- O uso de armazenamento em `backend/uploads/screenshots/` nao aumenta com novas imagens.

---

## 4. Fluxo principal de demonstracao

1. Acessar `http://localhost:5173`.
2. Entrar com `professora.demo@ludus.local`.
3. Selecionar o jogo **Para Que Serve?**.
4. Abrir a instituicao demonstrativa.
5. Abrir a turma demonstrativa.
6. Abrir o perfil de `Clara Demo`.
7. Conferir:
    - dados cadastrais ficticios;
    - indicador geral do aluno;
    - resumo de monitoramento;
    - historico de sessoes;
    - card de solicitacao de imagem para o mapa de interacoes.
8. Abrir uma sessao recente de Clara Demo com imagens.
9. Conferir:
    - informacoes gerais da sessao;
    - mapa de interacoes;
    - abas por fase;
    - movimento do mouse;
    - cliques;
    - arraste;
    - cores por fase;
    - imagem capturada como fundo quando disponivel;
    - sequencia da sessao por fase.
10. Voltar ao perfil e gerar o relatorio PDF.
11. Abrir o perfil de `Nilo Demo`.
12. Conferir indicadores que sugerem maior observacao docente.
13. Confirmar que os textos usam linguagem pedagogica e nao diagnostica.

---

## 5. Fluxo com professor random

1. Rodar o seed random desejado.
2. Entrar com `professor.random.demo@ludus.local`.
3. Selecionar **Para Que Serve?**.
4. Abrir a instituicao `Demo Random - Instituicao Gerada`.
5. Navegar pelas turmas e alunos gerados.
6. Abrir alunos de diferentes perfis.
7. Conferir se os indicadores mudam conforme:
    - acertos;
    - erros;
    - inatividade;
    - sessoes recentes;
    - categoria jogada;
    - presenca ou ausencia de screenshots.

---

## 6. Fluxo de captura de imagem real pelo jogo

Este fluxo exige o jogo Unity rodando e conectado ao backend local.

1. Entrar no dashboard como professor.
2. Abrir o perfil de um aluno.
3. Ativar a captura de imagem para a proxima sessao.
4. No jogo, selecionar o mesmo aluno.
5. Jogar uma categoria ate finalizar a sessao.
6. Voltar ao dashboard.
7. Abrir a sessao gerada.
8. Conferir:
    - imagens por fase;
    - mapa de interacoes sobre a imagem;
    - movimento, cliques e arraste;
    - desativacao automatica da captura apos a sessao.

---

## 7. Fluxo de exclusao em cascata

Usar apenas dados de teste.

### Excluir aluno

1. Criar ou selecionar um aluno de teste.
2. Registrar ou gerar sessoes para esse aluno.
3. Excluir o aluno.
4. Conferir:
    - o aluno nao aparece mais na turma;
    - as sessoes do aluno foram removidas;
    - os arquivos de screenshots vinculados foram removidos quando existirem.

### Excluir turma

1. Criar ou selecionar uma turma de teste.
2. Criar alunos e sessoes nessa turma.
3. Excluir a turma.
4. Conferir:
    - a turma nao aparece mais;
    - os alunos da turma foram removidos;
    - as sessoes desses alunos foram removidas;
    - screenshots vinculados foram removidos quando existirem.

### Excluir instituicao

1. Criar ou selecionar uma instituicao de teste.
2. Criar turmas, alunos e sessoes vinculadas.
3. Excluir a instituicao.
4. Conferir:
    - a instituicao nao aparece mais;
    - turmas vinculadas foram removidas;
    - alunos vinculados foram removidos;
    - sessoes e screenshots vinculados foram removidos quando existirem.

---

## 8. Criterios de pronto

O fluxo demonstrativo esta pronto quando:

- Backend inicia sem erro.
- Frontend inicia sem erro.
- `npm run seed:demo` executa corretamente.
- `npm run seed:demo:random` executa corretamente nos modos principais.
- Login da professora demo funciona.
- Login do professor random funciona.
- Professor visualiza apenas sua instituicao vinculada.
- Admin visualiza todas as instituicoes.
- Home filtra o fluxo pelo jogo selecionado.
- Perfil do aluno mostra indicadores coerentes.
- Sessoes aparecem vinculadas por `studentId`.
- Detalhes da sessao mostram mapa e sequencia por fase.
- Heatmap funciona com screenshots.
- Heatmap funciona sem screenshots.
- Relatorio PDF e gerado corretamente.
- Linguagem dos indicadores e relatorios permanece pedagogica e nao diagnostica.
- Exclusoes em cascata removem dados dependentes.
- Dados demonstrativos sao sinteticos e anonimos.

---

## 9. Prints recomendados

Para artigo, apresentacao ou documentacao, priorizar prints anonimizados dos seguintes pontos:

- Home com selecao de jogo.
- Lista de instituicoes demonstrativas.
- Perfil de aluno com indicadores pedagogicos.
- Historico de sessoes.
- Mapa de interacoes com imagem de fundo.
- Mapa de interacoes sem imagem de fundo.
- Sequencia da sessao por fase.
- Relatorio PDF gerado.
- Console do seed demonstrativo executado com sucesso.

Evitar prints com:

- dados reais;
- nomes reais de instituicoes;
- contatos reais;
- IDs tecnicos desnecessarios;
- anotacoes sensiveis feitas por professores.

---

## 10. Observacao metodologica

Os datasets demonstrativos servem para testar a ferramenta, preparar demonstracoes e gerar evidencias visuais anonimizadas. Eles nao representam validacao empirica com estudantes reais.

A interpretacao dos indicadores deve sempre considerar o contexto pedagogico, a mediacao do professor e as condicoes reais da atividade.
