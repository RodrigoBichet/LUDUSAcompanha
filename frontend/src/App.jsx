import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./components/shared/RotaProtegida";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DetalhesSessao from "./pages/DetalhesSessao";
import Turmas from "./pages/Turmas";
import DetalheTurma from "./pages/DetalheTurma";
import PerfilAluno from "./pages/PerfilAluno";
import RotaAdmin from "./components/shared/RotaAdmin";
import GerenciarInstituicoes from "./pages/GerenciarInstituicoes";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import Perfil from "./pages/Perfil";
import "./index.css";

function Layout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="conteudo-principal">{children}</div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rota pública */}
                    <Route path="/login" element={<Login />} />

                    {/* Rotas protegidas */}
                    <Route
                        path="/"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <Home />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/sessao/:sessionId"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <DetalhesSessao />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/turmas"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <Turmas />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/turmas/:id"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <DetalheTurma />
                                </Layout>
                            </RotaProtegida>
                        }
                    />
                    <Route
                        path="/aluno/:id"
                        element={
                            <RotaProtegida>
                                <Layout>
                                    <PerfilAluno />
                                </Layout>
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
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
