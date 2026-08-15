import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { listarJogos, listarVisaoGeralAlunos } from "../services/api";
import { criarMapaNomesJogos, obterNomeJogo } from "../utils/jogos";
import "./Alunos.css";

export default function Alunos() {
    const navegar = useNavigate();
    const [alunos, setAlunos] = useState([]);
    const [nomesJogos, setNomesJogos] = useState(new Map());
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const carregar = async () => {
            try {
                setCarregando(true);
                setErro("");
                const [resAlunos, resJogos] = await Promise.all([
                    listarVisaoGeralAlunos(),
                    listarJogos().catch(() => null),
                ]);
                setAlunos(resAlunos.data.alunos || []);
                setNomesJogos(
                    criarMapaNomesJogos(resJogos?.data?.jogos || []),
                );
            } catch (erroCarregamento) {
                setErro(
                    erroCarregamento.response?.data?.mensagem ||
                        "Não foi possível carregar os alunos.",
                );
            } finally {
                setCarregando(false);
            }
        };

        void carregar();
    }, []);

    const alunosFiltrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        if (!termo) return alunos;

        return alunos.filter((aluno) => {
            const nomes = (aluno.jogos || []).map((jogo) =>
                obterNomeJogo(jogo.gameId, nomesJogos),
            );
            return [aluno.name, aluno.groupId?.name, ...nomes].some((valor) =>
                String(valor || "")
                    .toLocaleLowerCase("pt-BR")
                    .includes(termo),
            );
        });
    }, [alunos, busca, nomesJogos]);

    const abrirAluno = (aluno, gameId = null) => {
        const parametros = new URLSearchParams();
        if (gameId) parametros.set("gameId", gameId);
        const query = parametros.toString();
        navegar(`/aluno/${aluno._id}${query ? `?${query}` : ""}`);
    };

    return (
        <div>
            <Header
                titulo="Alunos"
                subtitulo="Acompanhe cada aluno e os jogos com sessões registradas"
            />

            <div className="pagina-conteudo">
                <div className="card alunos-visao-intro">
                    <div>
                        <h2>Visão por aluno</h2>
                        <p className="texto-leve">
                            Selecione um aluno para reunir seu acompanhamento ou
                            abra diretamente um dos jogos registrados.
                        </p>
                    </div>
                    <label className="alunos-busca">
                        <span className="campo-label">Buscar aluno ou jogo</span>
                        <input
                            className="campo-input"
                            type="search"
                            value={busca}
                            onChange={(evento) => setBusca(evento.target.value)}
                            placeholder="Digite um nome"
                        />
                    </label>
                </div>

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

                {!carregando && !erro && alunosFiltrados.length === 0 && (
                    <div className="card estado-vazio">
                        <span className="estado-vazio-icone">👤</span>
                        <p>
                            {busca
                                ? "Nenhum aluno corresponde à busca."
                                : "Nenhum aluno está disponível."}
                        </p>
                    </div>
                )}

                {!carregando && !erro && alunosFiltrados.length > 0 && (
                    <div className="alunos-visao-grid">
                        {alunosFiltrados.map((aluno) => (
                            <article className="card aluno-visao-card" key={aluno._id}>
                                <button
                                    type="button"
                                    className="aluno-visao-principal"
                                    onClick={() => abrirAluno(aluno)}
                                >
                                    <span className="aluno-individual-avatar">
                                        {aluno.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="aluno-visao-identificacao">
                                        <strong>{aluno.name}</strong>
                                        <span className="texto-leve">
                                            {aluno.groupId?.name ||
                                                "Acompanhamento individual"}
                                        </span>
                                    </span>
                                    <span className="aluno-individual-seta">→</span>
                                </button>

                                <div className="aluno-visao-resumo">
                                    <span>
                                        {aluno.totalSessoes === 1
                                            ? "1 sessão registrada"
                                            : `${aluno.totalSessoes} sessões registradas`}
                                    </span>
                                    <div className="aluno-visao-jogos">
                                        {(aluno.jogos || []).length === 0 ? (
                                            <span className="texto-leve">
                                                Nenhum jogo com sessão registrada.
                                            </span>
                                        ) : (
                                            aluno.jogos.map((jogo) => (
                                                <button
                                                    type="button"
                                                    className="aluno-visao-jogo"
                                                    key={jogo.gameId}
                                                    onClick={() =>
                                                        abrirAluno(aluno, jogo.gameId)
                                                    }
                                                >
                                                    {obterNomeJogo(
                                                        jogo.gameId,
                                                        nomesJogos,
                                                    )}
                                                    <small>
                                                        {jogo.totalSessoes === 1
                                                            ? "1 sessão"
                                                            : `${jogo.totalSessoes} sessões`}
                                                    </small>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
