// =============================================================================
// DetalheTurma.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de detalhe de uma turma — lista e cadastro de alunos.
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import {
    buscarTurma,
    listarAlunos,
    criarAluno,
    deletarAluno,
} from "../services/api";
import "./DetalheTurma.css";

export default function DetalheTurma() {
    const { id } = useParams();
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();
    const { usuario } = useAuth();

    const gameIdSelecionado = searchParams.get("gameId");

    const nomesJogos = {
        "para-que-serve": "Para Que Serve?",
        "historietas-divertidas": "Historietas Divertidas",
    };

    const nomeJogoSelecionado = nomesJogos[gameIdSelecionado];

    const [turma, setTurma] = useState(null);
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");

    // Campos do formulário
    const [form, setForm] = useState({
        name: "",
        birthDate: "",
        supportLevel: "Não informado",
        otherConditions: "",
        guardianName: "",
        guardianContact: "",
    });

    useEffect(() => {
        carregarDados();
    }, [id]);

    const montarUrlAluno = (alunoId) => {
        const params = new URLSearchParams();

        if (gameIdSelecionado) {
            params.set("gameId", gameIdSelecionado);
        }

        const query = params.toString();

        return query ? `/aluno/${alunoId}?${query}` : `/aluno/${alunoId}`;
    };

    const montarUrlVoltar = () => {
        const params = new URLSearchParams();

        const institutionIdTurma =
            turma?.institutionId?._id || turma?.institutionId;

        if (institutionIdTurma) {
            params.set("institutionId", institutionIdTurma);
        }

        if (gameIdSelecionado) {
            params.set("gameId", gameIdSelecionado);
        }

        const query = params.toString();

        return query ? `/turmas?${query}` : "/turmas";
    };

    const carregarDados = async () => {
        try {
            setCarregando(true);
            const [resTurma, resAlunos] = await Promise.all([
                buscarTurma(id),
                listarAlunos(id),
            ]);
            setTurma(resTurma.data.turma);
            setAlunos(resAlunos.data.alunos || []);
        } catch {
            setErro("Erro ao carregar dados da turma.");
        } finally {
            setCarregando(false);
        }
    };

    const calcularIdade = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const fecharFormAluno = () => {
        setMostrarForm(false);
        setErroForm("");
        setForm({
            name: "",
            birthDate: "",
            supportLevel: "Não informado",
            otherConditions: "",
            guardianName: "",
            guardianContact: "",
        });
    };

    const handleCriarAluno = async (e) => {
        e.preventDefault();
        setErroForm("");

        if (!form.name.trim()) {
            setErroForm("Nome do aluno é obrigatório.");
            return;
        }

        try {
            setSalvando(true);
            await criarAluno({ ...form, groupId: id });
            fecharFormAluno();
            carregarDados();
        } catch {
            setErroForm("Erro ao cadastrar aluno. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const handleDeletar = async (alunoId, nome) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${nome}"?`))
            return;
        try {
            await deletarAluno(alunoId);
            carregarDados();
        } catch {
            alert("Erro ao excluir aluno.");
        }
    };

    return (
        <div>
            <Header
                titulo={turma?.name || "Turma"}
                subtitulo={
                    nomeJogoSelecionado
                        ? `Turma acompanhada no jogo ${nomeJogoSelecionado}`
                        : "Gerencie os alunos desta turma"
                }
            />

            <div className="pagina-conteudo">
                <button
                    className="btn-voltar"
                    onClick={() => navegar(montarUrlVoltar())}
                >
                    ← Voltar para Turmas
                </button>

                {nomeJogoSelecionado && (
                    <div className="contexto-jogo">
                        <span>Jogo acompanhado</span>
                        <strong>{nomeJogoSelecionado}</strong>
                    </div>
                )}

                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando...</p>
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
                        {/* Topo */}
                        <div className="turmas-topo">
                            <div className="secao-titulo">
                                <h2>Alunos</h2>
                                <span className="badge">{alunos.length}</span>
                            </div>
                            {!mostrarForm && (
                                <button
                                    className="btn-primario"
                                    onClick={() => setMostrarForm(true)}
                                >
                                    + Novo Aluno
                                </button>
                            )}
                        </div>

                        {/* Formulário de novo aluno */}
                        {mostrarForm && (
                            <div className="card form-card">
                                <h3>Cadastrar Aluno</h3>
                                <form
                                    onSubmit={handleCriarAluno}
                                    className="form-grid"
                                >
                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Nome completo *
                                        </label>
                                        <input
                                            type="text"
                                            className="campo-input"
                                            placeholder="Nome do aluno"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    name: e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        />
                                    </div>

                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Data de nascimento
                                        </label>
                                        <input
                                            type="date"
                                            className="campo-input"
                                            value={form.birthDate}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    birthDate: e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        />
                                    </div>

                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Grau de suporte (TEA)
                                        </label>
                                        <select
                                            className="campo-input"
                                            value={form.supportLevel}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    supportLevel:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        >
                                            <option>Não informado</option>
                                            <option>Nível 1</option>
                                            <option>Nível 2</option>
                                            <option>Nível 3</option>
                                        </select>
                                    </div>

                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Outras condições
                                        </label>
                                        <input
                                            type="text"
                                            className="campo-input"
                                            placeholder="Ex: TDAH, Dislexia"
                                            value={form.otherConditions}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    otherConditions:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        />
                                    </div>

                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Nome do responsável
                                        </label>
                                        <input
                                            type="text"
                                            className="campo-input"
                                            placeholder="Nome do pai/mãe"
                                            value={form.guardianName}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    guardianName:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        />
                                    </div>

                                    <div className="campo-grupo">
                                        <label className="campo-label">
                                            Contato do responsável
                                        </label>
                                        <input
                                            type="text"
                                            className="campo-input"
                                            placeholder="Telefone ou email"
                                            value={form.guardianContact}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    guardianContact:
                                                        e.target.value,
                                                })
                                            }
                                            disabled={salvando}
                                        />
                                    </div>

                                    {erroForm && (
                                        <p className="form-erro">{erroForm}</p>
                                    )}

                                    <div className="form-acoes">
                                        <button
                                            type="submit"
                                            className="btn-primario"
                                            disabled={salvando}
                                        >
                                            {salvando
                                                ? "Salvando..."
                                                : "Cadastrar Aluno"}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-secundario"
                                            onClick={fecharFormAluno}
                                            disabled={salvando}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Lista de alunos */}
                        {alunos.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">👦</span>
                                <p>Nenhum aluno cadastrado nesta turma.</p>
                                <p className="texto-leve">
                                    Clique em "+ Novo Aluno" para começar.
                                </p>
                            </div>
                        ) : (
                            <div className="lista-alunos">
                                {alunos.map((aluno) => {
                                    const idade = calcularIdade(
                                        aluno.birthDate,
                                    );
                                    return (
                                        <div
                                            key={aluno._id}
                                            className="card card-aluno"
                                        >
                                            <div
                                                className="aluno-info"
                                                onClick={() =>
                                                    navegar(
                                                        montarUrlAluno(
                                                            aluno._id,
                                                        ),
                                                    )
                                                }
                                            >
                                                <div className="aluno-avatar">
                                                    {aluno.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3>{aluno.name}</h3>
                                                    <div className="aluno-meta">
                                                        {idade !== null && (
                                                            <span className="texto-leve">
                                                                {idade} anos
                                                            </span>
                                                        )}
                                                        {aluno.supportLevel !==
                                                            "Não informado" && (
                                                            <span className="chip-nivel">
                                                                TEA{" "}
                                                                {
                                                                    aluno.supportLevel
                                                                }
                                                            </span>
                                                        )}
                                                        {aluno.otherConditions && (
                                                            <span className="chip-condicao">
                                                                {
                                                                    aluno.otherConditions
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="turma-acoes">
                                                <button
                                                    className="btn-ver"
                                                    onClick={() =>
                                                        navegar(
                                                            montarUrlAluno(
                                                                aluno._id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    Ver perfil →
                                                </button>
                                                <button
                                                    className="btn-deletar"
                                                    onClick={() =>
                                                        handleDeletar(
                                                            aluno._id,
                                                            aluno.name,
                                                        )
                                                    }
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
