# Changelog — LUDUS Acompanha

Todas as mudanças relevantes do projeto são registradas aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.8.0] — 2026-04-21 — Login no dashboard 🎉

### Adicionado

- `frontend/src/contexts/AuthContext.jsx` — contexto global de autenticação
    - Gerencia token JWT no localStorage
    - `login(email, password)` — autentica e salva token
    - `logout()` — limpa token e redireciona
    - Verifica token salvo ao iniciar e carrega usuário automaticamente
    - Configura header `Authorization` no axios globalmente
- `frontend/src/components/shared/RotaProtegida.jsx`
    - Redireciona para `/login` se não autenticado
    - Exibe spinner enquanto verifica token
- `frontend/src/pages/Login.jsx` + `Login.css`
    - Campos de email e senha
    - Feedback de erro quando credenciais incorretas
    - Estado de loading durante autenticação
    - Design consistente com o restante do dashboard
- `frontend/src/components/layout/Sidebar.jsx` atualizado
    - Exibe avatar, nome e papel do usuário logado
    - Ícone diferente para admin (⚙️) e professor (👨‍🏫)
    - Botão sair com animação de hover
- `frontend/src/App.jsx` atualizado
    - `AuthProvider` envolvendo toda a aplicação
    - Rota `/login` pública
    - Todas as demais rotas protegidas por `RotaProtegida`

### Testado

- Login com admin funcionando corretamente
- Rotas protegidas redirecionando para /login quando não autenticado
- Nome e papel do admin aparecendo na sidebar
- Logout limpando token e redirecionando para /login

---

## [0.7.0] — 2026-04-19

### Adicionado — CRUD completo + rotas Unity

- PUT e DELETE em schools, groups e students
- Rotas públicas `/api/unity` para o Unity buscar dados sem autenticação

---

## [0.6.0] — 2026-04-19

### Adicionado — Autenticação + Hierarquia

- Models: User, School, Group, Student
- Auth JWT, middleware, script criarAdmin
- Collection Postman exportada

---

## [0.5.0] — 2026-04-18

### Adicionado — Dashboard React inicial

- Layout, Home, PerfilJogador, DetalhesSessao
- Heatmap em Canvas e timeline de eventos

---

## [0.4.0] — 2026-04-18

### Adicionado — Backend completo

- Controllers e rotas de players e dashboard
- Fluxo end-to-end validado

---

## [0.3.0] — 2026-04-17

### Adicionado

- Controller e rotas de sessions

---

## [0.2.0] — 2026-04-17

### Adicionado

- Models: Session, Player, Institution

---

## [0.1.0] — 2026-04-15

### Adicionado

- Setup inicial: Express + MongoDB Atlas + nodemon

---

## Próximas versões planejadas

- `[0.9.0]` — CRUD no dashboard: turmas e alunos
- `[1.0.0]` — Funcionalidades pedagógicas: alertas e observações
- `[1.1.0]` — Área Admin: cadastro de professores e escolas
- `[1.2.0]` — Sistema publicado e testado nas escolas
