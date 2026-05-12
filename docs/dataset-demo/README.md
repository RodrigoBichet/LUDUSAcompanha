# Dataset demonstrativo

Este diretorio documenta o dataset sintetico criado para demonstracao tecnica do LUDUS Acompanha.

O dataset nao representa estudantes reais, professores reais, escolas reais ou instituicoes parceiras. Todos os nomes, contatos e sessoes sao ficticios e devem ser usados apenas para desenvolvimento, prints anonimizados e reproducao do fluxo demonstrativo.

---

## Como gerar o dataset

No terminal:

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm run seed:demo
```

O comando recria apenas os dados do dataset fixo, com alunos `Clara Demo`, `Nilo Demo` e `Lia Demo`. Dados reais ou cadastros normais nao devem ser removidos pelo script.

### Dataset aleatorio

Para testar a plataforma com mais volume e variacao, tambem existe um gerador aleatorio controlado por parametros:

```powershell
cd C:\UNITY\ProjetosGithub\LUDUSAcompanha\backend
npm run seed:demo:random -- --alunos=12 --sessoes=40 --turmas=2 --seed=2026
```

Parametros disponiveis:

| Parametro | Padrao | Limite | Descricao |
| --------- | ------ | ------ | --------- |
| `--alunos` | `12` | 3 a 60 | Quantidade de alunos ficticios. O minimo e 3 para sempre gerar um aluno de bom desempenho, um intermediario e um que necessita acompanhamento |
| `--sessoes` | `alunos * 4` | alunos a 240 | Quantidade de sessoes sinteticas. O minimo de 1 sessao por aluno |
| `--turmas` | `2` | 1 a 8 | Quantidade de turmas demonstrativas |
| `--seed` | data/hora atual | livre | Valor para reproduzir o mesmo conjunto gerado |

O comando aleatorio recria apenas dados com prefixo `Demo Random`, sessoes com prefixo `demo-random-` e screenshots sinteticos correspondentes. Ele nao depende de bibliotecas externas de geracao de dados.

Mesmo que seja informado `--alunos=1`, o script ajusta automaticamente para `3` alunos. Isso e intencional: a demonstracao precisa cobrir os tres cenarios pedagogicos usados nos prints e no artigo:

- um aluno com bom desempenho;
- um aluno com desempenho intermediario;
- um aluno que necessita acompanhamento pedagogico.

Da mesma forma, se `--sessoes` for menor que a quantidade final de alunos, o script aumenta o total de sessoes para que todos tenham ao menos uma sessao demonstrativa.

---

## Usuario demonstrativo

| Campo  | Valor                              |
| ------ | ---------------------------------- |
| Perfil | Professor                          |
| Nome   | Professora Demo                    |
| Email  | `professora.demo@ludus.local`      |
| Senha  | `Demo@2026`                        |

Esse usuario fica vinculado apenas a instituicao demonstrativa, permitindo testar a visao de professor sem expor instituicoes reais.

O dataset aleatorio cria outro usuario, separado do conjunto fixo:

| Campo  | Valor                                  |
| ------ | -------------------------------------- |
| Perfil | Professor                              |
| Nome   | Professor Demo Random                  |
| Email  | `professor.random.demo@ludus.local`    |
| Senha  | `Demo@2026`                            |

---

## Estrutura criada

```txt
Demo - Instituicao Demonstrativa
+-- Demo - Turma Demonstrativa A
    +-- Clara Demo
    +-- Nilo Demo
    +-- Lia Demo
```

---

## Perfis sinteticos

| Aluno      | Grau de suporte | Outras condicoes | Finalidade demonstrativa |
| ---------- | --------------- | ---------------- | ------------------------ |
| Clara Demo | Nivel 1 | Acompanhamento pedagogico leve | Caso de bom desempenho, com uma sessao com screenshots e outra sem screenshots |
| Nilo Demo  | Nivel 2 | Requer mais tempo de mediacao durante as tarefas | Caso com maior taxa de erro e mais periodos de inatividade |
| Lia Demo   | Nao informado | Exploracao frequente da interface | Caso intermediario, util para mostrar exploracao, cliques e arraste |

Os dados de suporte e condicoes acima tambem sao ficticios e existem apenas para demonstrar como o cadastro pode ser preenchido.

---

## Sessoes sinteticas

| Session ID                      | Aluno      | Categoria | Evidencia principal                                 |
| ------------------------------- | ---------- | --------- | --------------------------------------------------- |
| `demo-clara-higiene-001`   | Clara Demo | Higiene   | Mapa por fase com screenshots e bom desempenho      |
| `demo-clara-alimentos-002` | Clara Demo | Alimentos | Sessao sem screenshots, mantendo mapa geral         |
| `demo-nilo-higiene-001`    | Nilo Demo  | Higiene   | Maior erro, inatividade e mapa com screenshots      |
| `demo-nilo-cotidiano-002`  | Nilo Demo  | Cotidiano | Sessao sem screenshots com padrao de dificuldade    |
| `demo-lia-acoes-001`       | Lia Demo   | Acoes     | Caso intermediario com cliques, movimento e arraste |

---

## Fluxo recomendado para prints anonimizados

1. Entrar no dashboard com `professora.demo@ludus.local`.
2. Selecionar o jogo **Para Que Serve?**.
3. Abrir a instituicao `Demo - Instituicao Demonstrativa`.
4. Abrir a turma `Demo - Turma Demonstrativa A`.
5. Abrir o perfil de `Nilo Demo` para mostrar alertas pedagogicos.
6. Abrir a sessao `demo-nilo-higiene-001` para mostrar mapa com screenshots.
7. Abrir `Clara Demo` para mostrar bom desempenho e relatorio PDF.

---

## Cuidados de anonimato

- Nao misturar prints do dataset sintetico com dados reais.
- Nao usar screenshots que exibam nomes de autores, orientadores, instituicoes reais ou emails pessoais.
- Conferir se o PDF gerado contem apenas nomes ficticios.
- Remover metadados do PDF do artigo antes da submissao.
- As imagens sinteticas geradas pelo seed sao apenas uma previa visual para contextualizar o mapa de interacoes; elas nao representam telas reais do jogo.
