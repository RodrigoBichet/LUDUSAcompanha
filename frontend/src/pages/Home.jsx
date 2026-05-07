// =============================================================================
// Home.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página inicial — visão geral dos alunos monitorados.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import { listarTurmas, listarInstituicoes } from "../services/api";
import "./Home.css";

const JOGOS_DISPONIVEIS = [
    {
        id: "para-que-serve",
        nome: "Para Que Serve?",
        descricao: "Jogo atual do projeto LUDUS Acompanha.",
        ativo: true,
    },
    {
        id: "historietas-divertidas",
        nome: "Historietas Divertidas",
        descricao: "Preparado para integração futura.",
        ativo: false,
    },
];

function CardInstituicao({ instituicao, turmas, jogoSelecionado, navegar }) {
    const totalTurmas = turmas.filter((turma) => {
        const instituicaoTurma =
            turma.institutionId?._id || turma.institutionId;

        return instituicaoTurma === instituicao._id;
    }).length;

    const montarUrlTurmas = () => {
        const params = new URLSearchParams();

        params.set("institutionId", instituicao._id);
        params.set("gameId", jogoSelecionado.id);

        return `/turmas?${params.toString()}`;
    };

    return (
        <div
            className="card card-instituicao"
            onClick={() => navegar(montarUrlTurmas())}
        >
            <div className="instituicao-icone">🏫</div>

            <div className="instituicao-info">
                <h3>{instituicao.name}</h3>
                <p className="texto-leve">
                    {instituicao.city || "Cidade não informada"}
                </p>
                <span className="instituicao-meta">
                    {totalTurmas} {totalTurmas === 1 ? "turma" : "turmas"}
                </span>
            </div>

            <span className="jogador-seta">→</span>
        </div>
    );
}

export default function Home() {
    const [instituicoes, setInstituicoes] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [jogoSelecionado, setJogoSelecionado] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const navegar = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        const gameIdUrl = searchParams.get("gameId");

        if (!gameIdUrl) {
            setJogoSelecionado(null);
            return;
        }

        const jogoUrl = JOGOS_DISPONIVEIS.find(
            (jogo) => jogo.id === gameIdUrl && jogo.ativo,
        );

        setJogoSelecionado(jogoUrl || null);
    }, [searchParams]);

    const carregarDados = async () => {
        try {
            setCarregando(true);

            const [resInstituicoes, resTurmas] = await Promise.all([
                listarInstituicoes(),
                listarTurmas(),
            ]);

            setInstituicoes(resInstituicoes.data.instituicoes || []);
            setTurmas(resTurmas.data.turmas || []);
        } catch {
            setErro("Não foi possível carregar as instituições.");
        } finally {
            setCarregando(false);
        }
    };

    const selecionarJogo = (jogo) => {
        if (!jogo.ativo) return;

        setJogoSelecionado(jogo);
        setSearchParams({ gameId: jogo.id });
    };

    return (
        <div>
            <Header
                titulo="Visão Geral"
                subtitulo="Selecione um jogo para acompanhar instituições, turmas e alunos"
            />

            <div className="pagina-conteudo">
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando instituições...</p>
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
                        <div className="jogos-selecao">
                            <div>
                                <h2>Jogo acompanhado</h2>
                                <p className="texto-leve">
                                    Escolha o jogo para visualizar os dados dos
                                    alunos.
                                </p>
                            </div>

                            <div className="jogos-opcoes">
                                {JOGOS_DISPONIVEIS.map((jogo) => (
                                    <button
                                        key={jogo.id}
                                        type="button"
                                        className={
                                            jogoSelecionado?.id === jogo.id
                                                ? "jogo-opcao ativo"
                                                : "jogo-opcao"
                                        }
                                        onClick={() => selecionarJogo(jogo)}
                                        disabled={!jogo.ativo}
                                    >
                                        <span className="jogo-opcao-nome">
                                            {jogo.nome}
                                        </span>
                                        <span className="jogo-opcao-descricao">
                                            {jogo.descricao}
                                        </span>
                                        {!jogo.ativo && (
                                            <span className="jogo-opcao-badge">
                                                Em breve
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!jogoSelecionado ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">🎮</span>
                                <p>Selecione um jogo para começar.</p>
                                <p className="texto-leve">
                                    As instituições, turmas e alunos aparecerão
                                    após a escolha.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="secao-titulo">
                                    <h2>Instituições</h2>
                                    <span className="badge">
                                        {instituicoes.length}
                                    </span>
                                </div>

                                {instituicoes.length === 0 ? (
                                    <div className="card estado-vazio">
                                        <span className="estado-vazio-icone">
                                            🏫
                                        </span>
                                        <p>
                                            Nenhuma instituição cadastrada
                                            ainda.
                                        </p>
                                        <p className="texto-leve">
                                            Cadastre instituições para organizar
                                            turmas e alunos.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid-instituicoes">
                                        {instituicoes.map((instituicao) => (
                                            <CardInstituicao
                                                key={instituicao._id}
                                                instituicao={instituicao}
                                                turmas={turmas}
                                                jogoSelecionado={
                                                    jogoSelecionado
                                                }
                                                navegar={navegar}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
