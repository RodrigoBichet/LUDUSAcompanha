// =============================================================================
// Home.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página inicial — visão geral dos alunos monitorados.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { listarTurmas, listarAlunos, resumoJogador } from "../services/api";
import "./Home.css";

function CardAluno({ aluno, navegar }) {
    const [indicador, setIndicador] = useState(null);

    useEffect(() => {
        resumoJogador(aluno.name)
            .then((res) => {
                const taxa = parseFloat(res.data.taxaAcerto);
                if (taxa >= 70)
                    setIndicador({
                        icone: "🟢",
                        label: "Bom desempenho",
                        cor: "#4ECBA0",
                    });
                else if (taxa >= 50)
                    setIndicador({
                        icone: "🟡",
                        label: "Desempenho regular",
                        cor: "#F6AD55",
                    });
                else
                    setIndicador({
                        icone: "🔴",
                        label: "Atenção necessária",
                        cor: "#FC8181",
                    });
            })
            .catch(() => setIndicador(null));
    }, [aluno.name]);

    return (
        <div
            className="card card-jogador"
            onClick={() => navegar(`/aluno/${aluno._id}`)}
        >
            <div className="jogador-avatar">
                {aluno.name.charAt(0).toUpperCase()}
            </div>
            <div className="jogador-info">
                <h3>{aluno.name}</h3>
                <p className="texto-leve">
                    {aluno.groupId?.name || "Sem turma"}
                </p>
                {indicador && (
                    <p
                        style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: indicador.cor,
                            marginTop: "0.2rem",
                        }}
                    >
                        {indicador.icone} {indicador.label}
                        <span
                            style={{
                                fontWeight: 400,
                                color: "var(--cor-texto-leve)",
                                marginLeft: "0.3rem",
                            }}
                        >
                            (taxa de acerto)
                        </span>
                    </p>
                )}
            </div>
            <span className="jogador-seta">→</span>
        </div>
    );
}

export default function Home() {
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const navegar = useNavigate();

    useEffect(() => {
        carregarAlunos();
    }, []);

    const carregarAlunos = async () => {
        try {
            setCarregando(true);

            // Busca todas as turmas do professor
            const resTurmas = await listarTurmas();
            const turmas = resTurmas.data.turmas || [];

            // Busca alunos de cada turma
            const promessas = turmas.map((t) => listarAlunos(t._id));
            const resultados = await Promise.all(promessas);

            // Junta todos os alunos em uma lista única
            const todosAlunos = resultados.flatMap((r) => r.data.alunos || []);
            setAlunos(todosAlunos);
        } catch {
            setErro("Não foi possível carregar os alunos.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div>
            <Header
                titulo="Visão Geral"
                subtitulo="Acompanhe o desempenho dos alunos monitorados"
            />

            <div className="pagina-conteudo">
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando alunos...</p>
                    </div>
                )}

                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {!carregando && !erro && (
                    <>
                        <div className="secao-titulo">
                            <h2>Alunos</h2>
                            <span className="badge">{alunos.length}</span>
                        </div>

                        {alunos.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">🎮</span>
                                <p>Nenhum aluno cadastrado ainda.</p>
                                <p className="texto-leve">
                                    Vá em Minhas Turmas para cadastrar alunos.
                                </p>
                            </div>
                        ) : (
                            <div className="grid-jogadores">
                                {alunos.map((aluno) => (
                                    <CardAluno
                                        key={aluno._id}
                                        aluno={aluno}
                                        navegar={navegar}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
