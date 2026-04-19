// =============================================================================
// Home.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página inicial — visão geral dos jogadores monitorados.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { listarJogadores } from "../services/api";
import "./Home.css";

export default function Home() {
    const [jogadores, setJogadores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const navegar = useNavigate();

    useEffect(() => {
        listarJogadores()
            .then((res) => {
                setJogadores(res.data.jogadoresNasSessoes || []);
                setCarregando(false);
            })
            .catch(() => {
                setErro(
                    "Não foi possível carregar os jogadores. Verifique se o backend está rodando.",
                );
                setCarregando(false);
            });
    }, []);

    return (
        <div>
            <Header
                titulo="Visão Geral"
                subtitulo="Acompanhe o desempenho dos jogadores monitorados"
            />

            <div className="pagina-conteudo">
                {/* Estado de carregamento */}
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando jogadores...</p>
                    </div>
                )}

                {/* Estado de erro */}
                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {/* Lista de jogadores */}
                {!carregando && !erro && (
                    <>
                        <div className="secao-titulo">
                            <h2>Jogadores</h2>
                            <span className="badge">{jogadores.length}</span>
                        </div>

                        {jogadores.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">🎮</span>
                                <p>Nenhuma sessão registrada ainda.</p>
                                <p className="texto-leve">
                                    Quando uma criança jogar, ela aparecerá
                                    aqui.
                                </p>
                            </div>
                        ) : (
                            <div className="grid-jogadores">
                                {jogadores.map((nome) => (
                                    <div
                                        key={nome}
                                        className="card card-jogador"
                                        onClick={() =>
                                            navegar(
                                                `/jogador/${encodeURIComponent(nome)}`,
                                            )
                                        }
                                    >
                                        <div className="jogador-avatar">
                                            {nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="jogador-info">
                                            <h3>{nome}</h3>
                                            <p className="texto-leve">
                                                Clique para ver o perfil
                                            </p>
                                        </div>
                                        <span className="jogador-seta">→</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
