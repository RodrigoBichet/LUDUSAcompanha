# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.2.0] — 2026-04-27 — Indicador de desempenho na Home

### Adicionado

- `frontend/src/pages/Home.jsx` — indicador visual de desempenho nos cards
    - Componente `CardAluno` com busca individual de resumo via `resumoJogador`
    - 🟢 Bom desempenho — taxa ≥ 70%
    - 🟡 Desempenho regular — taxa entre 50% e 70%
    - 🔴 Atenção necessária — taxa < 50%
    - Critério exibido explicitamente: "(taxa de acerto)"

---

## [1.1.0] — 2026-04-26 — Geração de PDF formal

### Adicionado

- `frontend/src/components/shared/RelatorioPDF.jsx`
    - Template formal com linguagem acessível para pais/responsáveis
    - Seções: dados do aluno, resumo de desempenho, categorias, alertas, histórico de sessões e anotações
    - Tabela de sessões com categoria, acertos, erros, taxa, duração, avaliação em estrelas e pausas
    - Alertas traduzidos para linguagem não técnica com explicações detalhadas
    - Nome do professor que gerou o relatório no cabeçalho
    - Aviso formal de que o documento não constitui diagnóstico
- `frontend/src/pages/PerfilAluno.jsx`
    - Botão "📄 Gerar Relatório PDF"
    - Geração via `html2pdf.js` com nome do arquivo incluindo nome do aluno e data
    - Template invisível na tela, renderizado apenas no PDF

---

## [1.0.0] — 2026-04-25

### Adicionado — Alertas pedagógicos + refatoração

- Alertas automáticos no backend: taxa baixa, inatividade, sem jogar, categoria problemática, evolução positiva
- Alertas exibidos no perfil do aluno com cores por severidade
- Fix: renomear aluno atualiza playerId em todas as sessões
- Fix: criarAluno salva todos os campos corretamente
- Home refatorada para buscar alunos cadastrados
- Rota GET /api/sessions/player/:playerId
- Categorias traduzidas no perfil do aluno
- Gráfico de evolução adicionado ao PerfilAluno
- Remoção da collection players legada

---

## [0.9.0] — 2026-04-21

### Adicionado — CRUD de turmas e alunos

- Turmas, DetalheTurma, PerfilAluno
- Student model com campos clínicos e histórico de anotações

---

## [0.8.0] — 2026-04-21

### Adicionado — Login no dashboard

- AuthContext, RotaProtegida, Login.jsx
- Sidebar com usuário logado e botão sair

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas públicas /api/unity para o Unity

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

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

## Próximas versões planejadas

- `[1.3.0]` — Área Admin: cadastro de professores e escolas pelo dashboard
- `[1.4.0]` — Responsividade + design final da designer
- `[1.5.0]` — Sistema publicado e testado nas escolas parceiras
- `[2.0.0]` — ML: K-Means + Árvore de Decisão
