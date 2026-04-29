// =============================================================================
// Turmas.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de gerenciamento de turmas do professor.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import {
    listarTurmas,
    criarTurma,
    deletarTurma,
    listarInstituicoes,
} from "../services/api";
import "./Turmas.css";

export default function Turmas() {
    const { usuario } = useAuth();
    const navegar = useNavigate();

    const [turmas, setTurmas] = useState([]);
    const [instituicoes, setInstituicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [mostrarForm, setMostrarForm] = useState(false);

    // Campos do formulário
    const [nomeTurma, setNomeTurma] = useState("");
    const [instituicaoId, setInstituicaoId] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setCarregando(true);
            const [resTurmas, resInstituicoes] = await Promise.all([
                listarTurmas(),
                listarInstituicoes(),
            ]);
            setTurmas(resTurmas.data.turmas || []);
            setInstituicoes(resInstituicoes.data.instituicoes || []);
        } catch {
            setErro("Erro ao carregar turmas.");
        } finally {
            setCarregando(false);
        }
    };

    const handleCriarTurma = async (e) => {
        e.preventDefault();
        setErroForm("");

        if (!nomeTurma.trim()) {
            setErroForm("Nome da turma é obrigatório.");
            return;
        }

        if (!instituicaoId) {
            setErroForm("Selecione uma instituição.");
            return;
        }

        try {
            setSalvando(true);
            await criarTurma({
                name: nomeTurma.trim(),
                institutionId: instituicaoId,
                professorId: usuario.id,
            });
            setNomeTurma("");
            setInstituicaoId("");
            setMostrarForm(false);
            carregarDados();
        } catch {
            setErroForm("Erro ao criar turma. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    const handleDeletar = async (id, nome) => {
        if (
            !window.confirm(`Tem certeza que deseja excluir a turma "${nome}"?`)
        )
            return;
        try {
            await deletarTurma(id);
            carregarDados();
        } catch {
            alert("Erro ao excluir turma.");
        }
    };

    return (
        <div>
            <Header
                titulo="Minhas Turmas"
                subtitulo="Gerencie suas turmas e alunos"
            />

            <div className="pagina-conteudo">
                {/* Botão nova turma */}
                <div className="turmas-topo">
                    <div className="secao-titulo">
                        <h2>Turmas</h2>
                        {!carregando && (
                            <span className="badge">{turmas.length}</span>
                        )}
                    </div>
                    <button
                        className="btn-primario"
                        onClick={() => setMostrarForm(!mostrarForm)}
                    >
                        {mostrarForm ? "✕ Cancelar" : "+ Nova Turma"}
                    </button>
                </div>

                {/* Formulário de nova turma */}
                {mostrarForm && (
                    <div className="card form-card">
                        <h3>Nova Turma</h3>
                        <form
                            onSubmit={handleCriarTurma}
                            className="form-inline"
                        >
                            <div className="campo-grupo">
                                <label className="campo-label">
                                    Nome da turma
                                </label>
                                <input
                                    type="text"
                                    className="campo-input"
                                    placeholder="Ex: Turma A — Manhã"
                                    value={nomeTurma}
                                    onChange={(e) =>
                                        setNomeTurma(e.target.value)
                                    }
                                    disabled={salvando}
                                />
                            </div>
                            <div className="campo-grupo">
                                <label className="campo-label">
                                    Instituição
                                </label>
                                <select
                                    className="campo-input"
                                    value={instituicaoId}
                                    onChange={(e) =>
                                        setInstituicaoId(e.target.value)
                                    }
                                    disabled={salvando}
                                >
                                    <option value="">Selecione...</option>
                                    {instituicoes.map((inst) => (
                                        <option key={inst._id} value={inst._id}>
                                            {inst.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {erroForm && (
                                <p className="form-erro">{erroForm}</p>
                            )}
                            <button
                                type="submit"
                                className="btn-primario"
                                disabled={salvando}
                            >
                                {salvando ? "Salvando..." : "Salvar Turma"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Loading */}
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando turmas...</p>
                    </div>
                )}

                {/* Erro */}
                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {/* Lista de turmas */}
                {!carregando &&
                    !erro &&
                    (turmas.length === 0 ? (
                        <div className="card estado-vazio">
                            <span className="estado-vazio-icone">📚</span>
                            <p>Nenhuma turma cadastrada ainda.</p>
                            <p className="texto-leve">
                                Clique em "+ Nova Turma" para começar.
                            </p>
                        </div>
                    ) : (
                        <div className="lista-turmas">
                            {turmas.map((turma) => (
                                <div
                                    key={turma._id}
                                    className="card card-turma"
                                >
                                    <div
                                        className="turma-info"
                                        onClick={() =>
                                            navegar(`/turmas/${turma._id}`)
                                        }
                                    >
                                        <span className="turma-icone">📚</span>
                                        <div>
                                            <h3>{turma.name}</h3>
                                            <p className="texto-leve">
                                                {turma.institutionId?.name ||
                                                    "Instituição não informada"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="turma-acoes">
                                        <button
                                            className="btn-ver"
                                            onClick={() =>
                                                navegar(`/turmas/${turma._id}`)
                                            }
                                        >
                                            Ver alunos →
                                        </button>
                                        <button
                                            className="btn-deletar"
                                            onClick={() =>
                                                handleDeletar(
                                                    turma._id,
                                                    turma.name,
                                                )
                                            }
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
            </div>
        </div>
    );
}
