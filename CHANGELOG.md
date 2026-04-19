# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.5.0] — 2026-04-18 — Dashboard React inicial 🎉

### Adicionado

- `frontend/src/index.css` — design system global
    - Paleta de cores via CSS variables: fundo creme, sidebar escura, verde primário
    - Tipografia: DM Serif Display (títulos) + Nunito (corpo)
    - Classes utilitárias: `.card`, `.spinner`, `.badge`, `.texto-leve`
- `frontend/src/App.jsx` — configuração de rotas com React Router
    - Rota `/` → Home
    - Rota `/jogador/:playerId` → PerfilJogador
    - Rota `/sessao/:sessionId` → DetalhesSessao
- `frontend/src/services/api.js` — camada de serviço
    - `listarJogadores`, `historicoJogador`, `resumoJogador`, `heatmapSessao`, `buscarSessao`
    - baseURL apontando para `http://localhost:3000/api`
- `frontend/src/components/layout/Sidebar.jsx` + `Sidebar.css`
    - Sidebar fixa com logo LUDUS, navegação e rodapé
- `frontend/src/components/layout/Header.jsx` + `Header.css`
    - Header sticky com título e subtítulo por página
- `frontend/src/pages/Home.jsx` + `Home.css`
    - Lista de jogadores com avatar, nome capitalizado e badge contador
    - Estados de carregamento, erro e lista vazia
- `frontend/src/pages/PerfilJogador.jsx` + `PerfilJogador.css`
    - 6 cards de métricas: sessões, acertos, erros, taxa de acerto, tempo, inatividades
    - Categorias jogadas com chips
    - Gráfico de evolução temporal com Recharts
    - Histórico de sessões clicável
- `frontend/src/pages/DetalhesSessao.jsx` + `DetalhesSessao.css`
    - Heatmap de interações renderizado em Canvas (caminho do mouse + cliques)
    - Timeline completa de eventos com ícones e payloads
    - Informações gerais da sessão

### Observação

Design provisório para fins de desenvolvimento e teste.
Será refatorado com material da designer alinhado à identidade visual da plataforma LUDUS.

### Testado

- Home listando jogadores reais do banco
- Perfil com métricas consolidadas e taxa de acerto real
- Heatmap renderizando caminho do mouse e cliques de sessão real
- Timeline mostrando todos os eventos semânticos com timestamps

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- `playersController`: criarJogador, listarJogadores, buscarJogador, historicoJogador
- `dashboardController`: resumoJogador com métricas consolidadas, heatmapSessao
- Rotas `/api/players` e `/api/dashboard` conectadas
- Fluxo end-to-end validado: Unity → SDK → JSON → Node.js → MongoDB Atlas

---

## [0.3.0] — 2026-04-17

### Adicionado

- `sessionsController`: criarSessao, listarSessoes, buscarSessao
- Rotas `/api/sessions` conectadas

### Corrigido

- Connection string MongoDB trocada para formato direto (fix DNS)

---

## [0.2.0] — 2026-04-17

### Adicionado

- Models Mongoose: Session, Player, Institution

---

## [0.1.0] — 2026-04-15

### Adicionado

- Setup inicial: Express + MongoDB Atlas + nodemon
- Health check, CORS, middlewares

---

## Próximas versões planejadas

- `[0.6.0]` — Autenticação + hierarquia escola/turma/aluno
- `[0.7.0]` — Refatorar tela Unity com seleção de aluno
- `[0.8.0]` — Funcionalidades pedagógicas: alertas, observações, PDF
- `[0.9.0]` — Dashboard Admin + responsividade
- `[1.0.0]` — Sistema completo publicado e testado nas escolas
