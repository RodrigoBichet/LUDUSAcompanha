import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import RotaProtegida from "./components/shared/RotaProtegida";
import RotaContextoAcompanhamento from "./components/shared/RotaContextoAcompanhamento";
import Sidebar from "./components/layout/Sidebar";
import LayoutPublico from "./components/layout/LayoutPublico";
import RotaAdmin from "./components/shared/RotaAdmin";
import RolagemAoNavegar from "./components/shared/RolagemAoNavegar";
import "./index.css";

const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const ConfirmarEmail = lazy(() => import("./pages/ConfirmarEmail"));
const Home = lazy(() => import("./pages/Home"));
const DetalhesSessao = lazy(() => import("./pages/DetalhesSessao"));
const Turmas = lazy(() => import("./pages/Turmas"));
const Coletas = lazy(() => import("./pages/Coletas"));
const DetalheTurma = lazy(() => import("./pages/DetalheTurma"));
const PerfilAluno = lazy(() => import("./pages/PerfilAluno"));
const AlunosJogo = lazy(() => import("./pages/AlunosJogo"));
const Alunos = lazy(() => import("./pages/Alunos"));
const GerenciarInstituicoes = lazy(() => import("./pages/GerenciarInstituicoes"));
const GerenciarUsuarios = lazy(() => import("./pages/GerenciarUsuarios"));
const Perfil = lazy(() => import("./pages/Perfil"));
const PrivacidadeLudusObserva = lazy(() => import("./pages/PrivacidadeLudusObserva"));
const LaboratorioDesenvolvedor = lazy(() => import("./pages/LaboratorioDesenvolvedor"));
const AcessosInstitucionais = lazy(() => import("./pages/AcessosInstitucionais"));
const Documentacao = lazy(() => import("./pages/Documentacao"));
const PaginaInicial = lazy(() => import("./pages/PaginaInicial"));
const Privacidade = lazy(() => import("./pages/Privacidade"));

function CarregandoPagina() {
    return (
        <div className="pagina-conteudo" role="status" aria-live="polite">
            Carregando página…
        </div>
    );
}

function Layout({ children }) {
    return (
        <div className="app-layout">
            <a className="atalho-conteudo" href="#conteudo-principal">
                Pular para o conteúdo principal
            </a>
            <Sidebar />
            <main id="conteudo-principal" className="conteudo-principal">
                {children}
            </main>
        </div>
    );
}

function Inicio() {
    const { usuario, carregando } = useAuth();

    if (carregando) return <CarregandoPagina />;
    if (!usuario) return <PaginaInicial />;

    return (
        <Layout>
            <Home />
        </Layout>
    );
}

function PaginaInicialComLayout() {
    const { usuario, carregando } = useAuth();

    if (carregando) return <CarregandoPagina />;
    if (!usuario) return <PaginaInicial />;

    return (
        <Layout>
            <PaginaInicial incorporada />
        </Layout>
    );
}

function DocumentacaoComLayout() {
    const { usuario, carregando } = useAuth();

    if (carregando) return <CarregandoPagina />;
    if (!usuario) {
        return (
            <LayoutPublico>
                <Documentacao publica />
            </LayoutPublico>
        );
    }

    return (
        <Layout>
            <Documentacao />
        </Layout>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <RolagemAoNavegar />
                <Suspense fallback={<CarregandoPagina />}>
                    <Routes>
                    {/* Rotas públicas */}
                    <Route path="/" element={<Inicio />} />
                    <Route path="/inicio" element={<PaginaInicialComLayout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro" element={<Cadastro />} />
                    <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="/confirmar-email" element={<ConfirmarEmail />} />
                    <Route
                        path="/privacidade/ludus-observa"
                        element={<PrivacidadeLudusObserva />}
                    />
                    <Route path="/privacidade" element={<Privacidade />} />

                    {/* Rotas protegidas */}
                    <Route
                        path="/laboratorio"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <LaboratorioDesenvolvedor />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/colaboradores"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <AcessosInstitucionais />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/sessao/:sessionId"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <DetalhesSessao />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/turmas"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <Turmas />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/coletas"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <Coletas />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/turmas/:id"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <DetalheTurma />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/alunos"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <Alunos />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/aluno/:id"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <PerfilAluno />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/jogos/:gameId/alunos"
                        element={
                            <RotaContextoAcompanhamento>
                                <Layout>
                                    <AlunosJogo />
                                </Layout>
                            </RotaContextoAcompanhamento>
                        }
                    />
                    <Route
                        path="/jogos"
                        element={
                            <RotaProtegida>
                                <Navigate to="/" replace />
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <RotaAdmin>
                                <Layout>
                                    <div style={{ padding: "2rem" }}>
                                        <h1>Área Admin</h1>
                                        <p>Funcionou!</p>
                                    </div>
                                </Layout>
                            </RotaAdmin>
                        }
                    />
                    <Route
                        path="/admin/instituicoes"
                        element={
                            <RotaAdmin>
                                <Layout>
                                    <GerenciarInstituicoes />
                                </Layout>
                            </RotaAdmin>
                        }
                    />
                    <Route
                        path="/admin/usuarios"
                        element={
                            <RotaAdmin>
                                <Layout>
                                    <GerenciarUsuarios />
                                </Layout>
                            </RotaAdmin>
                        }
                    />
                    <Route
                        path="/perfil"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <Perfil />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/documentacao"
                        element={<DocumentacaoComLayout />}
                    />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
