# Dataset demonstrativo

Este diretorio documenta os datasets sinteticos criados para demonstracao tecnica do LUDUS Acompanha.

O dataset nao representa estudantes reais, professores reais, escolas reais ou instituicoes parceiras. Todos os nomes, contatos e sessoes sao ficticios e devem ser usados apenas para desenvolvimento, prints anonimizados e reproducao do fluxo demonstrativo.

---

## Como gerar o dataset fixo

No terminal:

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm run seed:demo
```

O comando recria apenas os dados do dataset fixo, com alunos `Clara Demo`, `Nilo Demo` e `Lia Demo`. Dados reais ou cadastros normais nao devem ser removidos pelo script.

Se o dataset fixo ja existir, o console exibira um aviso antes de recriar os dados:

```txt
[Demo] Dataset demonstrativo existente encontrado. Ele sera recriado.
```

---

## Dataset aleatorio

Para testar a plataforma com mais volume e variacao, tambem existe um gerador aleatorio controlado por parametros:

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm run seed:demo:random -- --alunos=12 --sessoes=40 --turmas=2 --seed=2026
```

Parametros disponiveis:

| Parametro          | Padrao          | Limite       | Descricao                                                                                                                                     |
| ------------------ | --------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--alunos`         | `12`            | 3 a 60       | Quantidade de alunos ficticios. O minimo e 3 para sempre gerar um aluno de bom desempenho, um intermediario e um que necessita acompanhamento |
| `--sessoes`        | `alunos * 4`    | alunos a 240 | Quantidade de sessoes sinteticas. O minimo e 1 sessao por aluno                                                                               |
| `--turmas`         | `2`             | 1 a 8        | Quantidade de turmas demonstrativas                                                                                                           |
| `--seed`           | data/hora atual | livre        | Valor para reproduzir o mesmo conjunto gerado                                                                                                 |
| `--append`         | desativado      | -            | Adiciona novos dados sem apagar o dataset random anterior                                                                                     |
| `--no-screenshots` | desativado      | -            | Nao gera screenshots sinteticos nas sessoes novas                                                                                             |

Por padrao, o comando aleatorio recria apenas dados com prefixo `Demo Random`, sessoes com prefixo `demo-random-` e screenshots sinteticos correspondentes. Ele nao depende de bibliotecas externas de geracao de dados.

Quando usado com `--append`, o script nao apaga o dataset random anterior: ele adiciona novas turmas, alunos e sessoes na mesma instituicao demonstrativa. Nesse modo, os nomes recebem um sufixo de lote baseado na seed usada, facilitando a identificacao dos dados gerados.

Mesmo que seja informado `--alunos=1`, o script ajusta automaticamente para `3` alunos. Isso e intencional: a demonstracao precisa cobrir os tres cenarios pedagogicos usados nos prints e no artigo:

- um aluno com bom desempenho;
- um aluno com desempenho intermediario;
- um aluno que necessita acompanhamento pedagogico.

Da mesma forma, se `--sessoes` for menor que a quantidade final de alunos, o script aumenta o total de sessoes para que todos tenham ao menos uma sessao demonstrativa.

---

## Modos de uso do random

### Random reprodutivel

```powershell
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1 --seed=2026
```

Gera um dataset random reprodutivel. Usar a mesma seed gera os mesmos nomes, sessoes e comportamentos.

### Random variavel

```powershell
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1
```

Gera um dataset random variavel, usando a data/hora atual como seed. Cada execucao sem `--seed` tende a produzir nomes e comportamentos diferentes.

### Random minimo

```powershell
npm run seed:demo:random -- --alunos=1 --sessoes=1 --turmas=1
```

Testa os ajustes automaticos de minimo. O script ajusta para pelo menos 3 alunos e 3 sessoes, garantindo um exemplo de cada perfil pedagogico sintetico.

### Popular banco com append

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append
```

Adiciona um novo lote ao banco, sem apagar os dados random anteriores. O lote aparece nos nomes de turmas e alunos, por exemplo `#1778715281484`.

### Popular banco sem screenshots

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append --no-screenshots
```

Adiciona dados sem gerar imagens, util para popular o banco sem aumentar o uso de armazenamento em `backend/uploads/screenshots/`.

### Append reprodutivel

```powershell
npm run seed:demo:random -- --alunos=6 --sessoes=12 --turmas=2 --append --seed=3030
```

Adiciona um lote conhecido e reprodutivel. Cuidado: repetir o mesmo comando com `--append` e a mesma seed adiciona outro lote com dados semelhantes.

### Resetar o random

```powershell
npm run seed:demo:random -- --alunos=3 --sessoes=3 --turmas=1 --seed=2026
```

Sem `--append`, o script limpa os lotes random anteriores e recria apenas o dataset random correspondente a seed informada.

---

## Usuarios demonstrativos

### Dataset fixo

| Campo  | Valor                         |
| ------ | ----------------------------- |
| Perfil | Professor                     |
| Nome   | Professora Demo               |
| Email  | `professora.demo@ludus.local` |
| Senha  | `Demo@2026`                   |

Esse usuario fica vinculado apenas a instituicao demonstrativa, permitindo testar a visao de professor sem expor instituicoes reais.

### Dataset aleatorio

| Campo  | Valor                               |
| ------ | ----------------------------------- |
| Perfil | Professor                           |
| Nome   | Professor Demo Random               |
| Email  | `professor.random.demo@ludus.local` |
| Senha  | `Demo@2026`                         |

Quando `--append` e usado, o professor random continua vinculado a mesma instituicao demonstrativa, permitindo visualizar os lotes anteriores e os novos pelo mesmo login.

---

## Estrutura criada

### Dataset fixo

```txt
Demo - Instituicao Demonstrativa
+-- Demo - Turma Demonstrativa A
    +-- Clara Demo
    +-- Nilo Demo
    +-- Lia Demo
```

### Dataset aleatorio

```txt
Demo Random - Instituicao Gerada
+-- Demo Random - Turma 1
|   +-- Alunos Demo Random
+-- Demo Random - Turma 1 #LOTE
    +-- Alunos Demo Random #LOTE
```

---

## Perfis sinteticos

| Aluno      | Grau de suporte | Outras condicoes                                 | Finalidade demonstrativa                                                      |
| ---------- | --------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Clara Demo | Nivel 1         | Acompanhamento pedagogico leve                   | Caso de bom desempenho, com sessoes com screenshots para demonstrar o heatmap |
| Nilo Demo  | Nivel 2         | Requer mais tempo de mediacao durante as tarefas | Caso com maior taxa de erro e mais periodos de inatividade                    |
| Lia Demo   | Nao informado   | Exploracao frequente da interface                | Caso intermediario, util para mostrar exploracao, cliques e arraste           |

Os dados de suporte e condicoes acima tambem sao ficticios e existem apenas para demonstrar como o cadastro pode ser preenchido.

---

## Sessoes sinteticas fixas

| Session ID                 | Aluno      | Categoria | Evidencia principal                                 |
| -------------------------- | ---------- | --------- | --------------------------------------------------- |
| `demo-clara-higiene-001`   | Clara Demo | Higiene   | Mapa por fase com screenshots e bom desempenho      |
| `demo-clara-alimentos-002` | Clara Demo | Alimentos | Sessao recente com screenshots para demonstracao    |
| `demo-nilo-higiene-001`    | Nilo Demo  | Higiene   | Maior erro, inatividade e mapa com screenshots      |
| `demo-nilo-cotidiano-002`  | Nilo Demo  | Cotidiano | Sessao sem screenshots com padrao de dificuldade    |
| `demo-lia-acoes-001`       | Lia Demo   | Acoes     | Caso intermediario com cliques, movimento e arraste |

Nas sessoes demonstrativas, fases com erro registram uma tentativa incorreta seguida de uma tentativa correta, aproximando a linha do tempo do comportamento observado no jogo real.

---

## Fluxo recomendado para prints anonimizados

1. Entrar no dashboard com `professora.demo@ludus.local`.
2. Selecionar o jogo **Para Que Serve?**.
3. Abrir a instituicao `Demo - Instituicao Demonstrativa`.
4. Abrir a turma `Demo - Turma Demonstrativa A`.
5. Abrir o perfil de `Nilo Demo` para mostrar indicadores pedagogicos de atencao.
6. Abrir a sessao `demo-nilo-higiene-001` para mostrar mapa com screenshots.
7. Abrir `Clara Demo` para mostrar indicadores positivos, sessao recente com imagem e relatorio PDF.

---

## Cuidados de anonimato

- Nao misturar prints do dataset sintetico com dados reais.
- Nao usar screenshots que exibam nomes de autores, orientadores, instituicoes reais ou emails pessoais.
- Conferir se o PDF gerado contem apenas nomes ficticios.
- Remover metadados do PDF do artigo antes da submissao.
- As imagens sinteticas geradas pelo seed sao apenas uma previa visual para contextualizar o mapa de interacoes; elas nao representam telas reais do jogo.
