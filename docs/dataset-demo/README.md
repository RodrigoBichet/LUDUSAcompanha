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

O comando recria apenas os dados com prefixo `Demo` e sessoes com prefixo `demo-`. Dados reais ou cadastros normais nao devem ser removidos pelo script.

---

## Usuario demonstrativo

| Campo  | Valor                              |
| ------ | ---------------------------------- |
| Perfil | Professor                          |
| Nome   | Professora Demo                    |
| Email  | `professora.demo@ludus.local`      |
| Senha  | `Demo@2026`                        |

Esse usuario fica vinculado apenas a instituicao demonstrativa, permitindo testar a visao de professor sem expor instituicoes reais.

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
