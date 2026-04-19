import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Home from "./pages/Home";
import PerfilJogador from "./pages/PerfilJogador";
import DetalhesSessao from "./pages/DetalhesSessao";
import "./index.css";

function App() {
    return (
        <BrowserRouter>
            <div className="app-layout">
                <Sidebar />
                <div className="conteudo-principal">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/jogador/:playerId"
                            element={<PerfilJogador />}
                        />
                        <Route
                            path="/sessao/:sessionId"
                            element={<DetalhesSessao />}
                        />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
