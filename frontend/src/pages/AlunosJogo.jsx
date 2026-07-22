// =============================================================================
// AlunosJogo.jsx
// Seleção e cadastro de alunos individuais dentro do fluxo de um jogo.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    criarAlunoIndividual,
    deletarAluno,
    listarAlunosPorJogo,
} from "../services/api";
import "./AlunosJogo.css";

export default function AlunosJogo() {
    const { gameId } = useParams();
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();
    const nomeAlunoSugerido = searchParams.get("novoAluno") || "";
    const origemImportacao = searchParams.get("origem") === "importacao";
    // A URL é limpa logo após a chegada, mas este estado preserva a origem
    // até o cadastro do aluno concluir e o perfil ser aberto.
    const [criadoPeloFluxoDeImportacao] = useState(origemImportacao);
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mostrarForm, setMostrarForm] = useState(Boolean(nomeAlunoSugerido));
    const [nomeAluno, setNomeAluno] = useState(nomeAlunoSugerido);
    const [salvando, setSalvando] = useState(false);
    const [excluindoAlunoId, setExcluindoAlunoId] = useState(null);

    const carregarAlunos = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");
            const resposta = await listarAlunosPorJogo(gameId);
            setAlunos(resposta.data.alunos || []);
        } catch (erroCarregamento) {
            setErro(
                erroCarregamento.response?.data?.mensagem ||
                    "Não foi possível carregar os alunos individuais.",
            );
        } finally {
            setCarregando(false);
        }
    }, [gameId]);

    useEffect(() => {
        void Promise.resolve().then(carregarAlunos);
    }, [carregarAlunos]);

    // A sugestão de aluno é usada só na primeira chegada pelo fluxo de
    // importação. Limpamos a URL para ela não reaparecer ao voltar à lista.
    useEffect(() => {
        if (!origemImportacao) return;
        navegar(`/jogos/${encodeURIComponent(gameId)}/alunos`, {
            replace: true,
        });
    }, [gameId, navegar, origemImportacao]);

    const abrirAluno = (aluno, exibirOrientacaoImportacao = false) => {
        const parametros = new URLSearchParams({ gameId });
        if (exibirOrientacaoImportacao) {
            parametros.set("importacaoPronta", "1");
        }
        navegar(`/aluno/${aluno._id}?${parametros.toString()}`);
    };

    const handleCriarAluno = async (evento) => {
        evento.preventDefault();
        if (!nomeAluno.trim()) return;

        try {
            setSalvando(true);
            setErro("");
            const resposta = await criarAlunoIndividual({
                name: nomeAluno,
                gameId,
            });
            const aluno = resposta.data.aluno;
            setAlunos((atuais) => [...atuais, aluno].sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR"),
            ));
            setNomeAluno("");
            setMostrarForm(false);
            abrirAluno(aluno, criadoPeloFluxoDeImportacao);
        } catch (erroCadastro) {
            setErro(
                erroCadastro.response?.data?.mensagem ||
                    "Não foi possível cadastrar o aluno.",
            );
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluirAluno = async (aluno) => {
        if (!window.confirm(
            `Excluir “${aluno.name}” permanentemente? O perfil, as sessões e as imagens vinculadas serão apagados. Esta ação não pode ser desfeita.`,
        )) {
            return;
        }

        try {
            setExcluindoAlunoId(aluno._id);
            setErro("");
            await deletarAluno(aluno._id);
            setAlunos((atuais) => atuais.filter((item) => item._id !== aluno._id));
        } catch (erroExclusao) {
            setErro(
                erroExclusao.response?.data?.mensagem ||
                    "Não foi possível excluir o aluno.",
            );
        } finally {
            setExcluindoAlunoId(null);
        }
    };

    return (
        <div>
            <Header
                titulo="Selecionar aluno"
                subtitulo={`Jogo selecionado: ${gameId}`}
            />

            <div className="pagina-conteudo">
                <button className="btn-voltar" onClick={() => navegar(-1)}>
                    ← Voltar aos jogos
                </button>

                <div className="card alunos-jogo-intro">
                    <div>
                        <h2>Quem será acompanhado?</h2>
                        <p className="texto-leve">
                            Escolha um aluno já associado a este jogo ou crie um
                            novo sem precisar informar instituição ou turma.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-primario"
                        onClick={() => setMostrarForm((aberto) => !aberto)}
                    >
                        {mostrarForm ? "Fechar cadastro" : "+ Cadastrar aluno"}
                    </button>
                </div>

                {mostrarForm && (
                    <form className="card form-aluno-individual" onSubmit={handleCriarAluno}>
                        {origemImportacao && (
                            <p className="texto-leve">
                                Você tentou anexar um JSON enquanto acompanhava
                                “{nomeAlunoSugerido}”. Deseja criar um perfil
                                individual com esse nome neste jogo?
                            </p>
                        )}
                        <label className="campo-grupo">
                            <span className="campo-label">Nome do aluno</span>
                            <input
                                className="campo-input"
                                value={nomeAluno}
                                onChange={(evento) => setNomeAluno(evento.target.value)}
                                required
                                maxLength={200}
                                autoFocus
                            />
                        </label>
                        <button
                            type="submit"
                            className="btn-primario"
                            disabled={salvando || !nomeAluno.trim()}
                        >
                            {salvando ? "Salvando..." : "Salvar e selecionar"}
                        </button>
                    </form>
                )}

                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {carregando ? (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando alunos...</p>
                    </div>
                ) : alunos.length === 0 ? (
                    <div className="card estado-vazio">
                        <span className="estado-vazio-icone">👤</span>
                        <p>Nenhum aluno associado a este jogo ainda.</p>
                        <p className="texto-leve">
                            Cadastre o primeiro aluno para importar ou acompanhar
                            sessões deste jogo.
                        </p>
                    </div>
                ) : (
                    <div className="grid-alunos-individuais">
                        {alunos.map((aluno) => (
                            <div
                                key={aluno._id}
                                className="card aluno-individual-card aluno-jogo-item"
                            >
                                <button
                                    type="button"
                                    className="aluno-jogo-abrir"
                                    onClick={() => abrirAluno(aluno)}
                                >
                                    <span className="aluno-individual-avatar">
                                        {aluno.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="aluno-individual-info">
                                        <strong>{aluno.name}</strong>
                                        <span className="texto-leve">
                                            {aluno.enrollmentMode === "individual"
                                                ? "Acompanhamento individual"
                                                : "Acompanhamento escolar"}
                                        </span>
                                    </span>
                                    <span className="aluno-individual-seta">→</span>
                                </button>
                                {!aluno.deletionProtected && (
                                    <div className="aluno-jogo-acoes">
                                        <button
                                            type="button"
                                            className="aluno-jogo-excluir"
                                            title="Excluir aluno permanentemente"
                                            aria-label={`Excluir ${aluno.name} permanentemente`}
                                            onClick={() => handleExcluirAluno(aluno)}
                                            disabled={excluindoAlunoId === aluno._id}
                                        >
                                            {excluindoAlunoId === aluno._id ? "…" : "🗑️"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
