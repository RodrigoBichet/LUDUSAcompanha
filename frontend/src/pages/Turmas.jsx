// =============================================================================
// Turmas.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página de gerenciamento de turmas do professor.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import {
    listarTurmas,
    criarTurma,
    atualizarTurma,
    deletarTurma,
    listarInstituicoes,
    criarInstituicao,
} from "../services/api";
import "./Turmas.css";

export default function Turmas() {
    const { usuario } = useAuth();
    const navegar = useNavigate();
    const [searchParams] = useSearchParams();

    const institutionIdSelecionada = searchParams.get("institutionId");
    const gameIdSelecionado = searchParams.get("gameId");

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
    const [editando, setEditando] = useState(null);
    const [mostrarFormInstituicao, setMostrarFormInstituicao] = useState(false);
    const [nomeInstituicao, setNomeInstituicao] = useState("");
    const [cidadeInstituicao, setCidadeInstituicao] = useState("");
    const [salvandoInstituicao, setSalvandoInstituicao] = useState(false);
    const [erroInstituicao, setErroInstituicao] = useState("");

    const turmasFiltradas = institutionIdSelecionada
        ? turmas.filter((turma) => {
              const institutionIdTurma =
                  turma.institutionId?._id || turma.institutionId;

              return institutionIdTurma === institutionIdSelecionada;
          })
        : turmas;

    const instituicaoSelecionada = institutionIdSelecionada
        ? instituicoes.find((inst) => inst._id === institutionIdSelecionada)
        : null;

    const montarUrlTurma = (turmaId) => {
        const params = new URLSearchParams();

        if (gameIdSelecionado) {
            params.set("gameId", gameIdSelecionado);
        }

        const query = params.toString();

        return query ? `/turmas/${turmaId}?${query}` : `/turmas/${turmaId}`;
    };

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

    const abrirEdicao = (turma) => {
        setEditando(turma);
        setNomeTurma(turma.name);
        setInstituicaoId(turma.institutionId?._id || turma.institutionId || "");
        setErroForm("");
        setMostrarForm(true);
    };

    const fecharForm = () => {
        setMostrarForm(false);
        setEditando(null);
        setNomeTurma("");
        setInstituicaoId("");
        setErroForm("");
    };

    const handleSalvarTurma = async (e) => {
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

            if (editando) {
                await atualizarTurma(editando._id, {
                    name: nomeTurma.trim(),
                    institutionId: instituicaoId || null,
                });
            } else {
                await criarTurma({
                    name: nomeTurma.trim(),
                    institutionId: instituicaoId,
                    professorId: usuario.id,
                });
            }

            fecharForm();
            carregarDados();
        } catch (erroCadastro) {
            setErroForm(
                erroCadastro.response?.data?.mensagem ||
                    "Erro ao salvar turma. Tente novamente.",
            );
        } finally {
            setSalvando(false);
        }
    };

    const handleDeletar = async (id, nome) => {
        if (
            !window.confirm(
                `Tem certeza que deseja excluir a turma "${nome}"? Apenas turmas sem alunos podem ser excluídas; alunos e sessões existentes serão preservados.`,
            )
        )
            return;
        try {
            await deletarTurma(id);
            carregarDados();
        } catch (erroExclusao) {
            alert(
                erroExclusao.response?.data?.mensagem ||
                    "Não foi possível excluir a turma.",
            );
        }
    };

    const handleCriarInstituicao = async (evento) => {
        evento.preventDefault();
        if (!nomeInstituicao.trim()) return;

        try {
            setSalvandoInstituicao(true);
            setErroInstituicao("");
            const resposta = await criarInstituicao({
                name: nomeInstituicao.trim(),
                city: cidadeInstituicao.trim(),
            });
            const instituicao = resposta.data.instituicao;
            setInstituicoes((atuais) => [...atuais, instituicao].sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR"),
            ));
            setNomeInstituicao("");
            setCidadeInstituicao("");
            setMostrarFormInstituicao(false);
            navegar(`/turmas?institutionId=${encodeURIComponent(instituicao._id)}`);
        } catch (erroCadastro) {
            setErroInstituicao(
                erroCadastro.response?.data?.mensagem ||
                    "Não foi possível cadastrar a instituição.",
            );
        } finally {
            setSalvandoInstituicao(false);
        }
    };

    return (
        <div>
            <Header
                titulo={instituicaoSelecionada?.name || "Instituições"}
                subtitulo={
                    instituicaoSelecionada
                        ? "Turmas vinculadas a esta instituição"
                        : "Organize instituições, turmas e alunos"
                }
            />

            <div className="pagina-conteudo">
                <section className="instituicoes-escolares">
                    <div className="turmas-topo">
                        <div className="secao-titulo">
                            <h2>Instituições</h2>
                            {!carregando && (
                                <span className="badge">{instituicoes.length}</span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn-primario"
                            onClick={() => setMostrarFormInstituicao((aberto) => !aberto)}
                        >
                            {mostrarFormInstituicao
                                ? "Fechar cadastro"
                                : "+ Nova Instituição"}
                        </button>
                    </div>

                    {mostrarFormInstituicao && (
                        <form className="card form-instituicao" onSubmit={handleCriarInstituicao}>
                            <label className="campo-grupo">
                                <span className="campo-label">Nome da instituição</span>
                                <input className="campo-input" value={nomeInstituicao}
                                    onChange={(evento) => setNomeInstituicao(evento.target.value)}
                                    required disabled={salvandoInstituicao} />
                            </label>
                            <label className="campo-grupo">
                                <span className="campo-label">Cidade (opcional)</span>
                                <input className="campo-input" value={cidadeInstituicao}
                                    onChange={(evento) => setCidadeInstituicao(evento.target.value)}
                                    disabled={salvandoInstituicao} />
                            </label>
                            {erroInstituicao && <p className="form-erro">{erroInstituicao}</p>}
                            <button className="btn-primario" disabled={salvandoInstituicao}>
                                {salvandoInstituicao ? "Salvando..." : "Salvar instituição"}
                            </button>
                        </form>
                    )}

                    {!carregando && instituicoes.length === 0 ? (
                        <div className="card estado-vazio">
                            <p>Cadastre a primeira instituição para organizar suas turmas e alunos.</p>
                        </div>
                    ) : (
                        <div className="lista-instituicoes-escolares">
                            {instituicoes.map((instituicao) => (
                                <button key={instituicao._id} type="button"
                                    className={institutionIdSelecionada === instituicao._id ? "card instituicao-escolar-card selecionada" : "card instituicao-escolar-card"}
                                    onClick={() => navegar(`/turmas?institutionId=${encodeURIComponent(instituicao._id)}`)}>
                                    <span className="instituicao-escolar-icone">🏫</span>
                                    <span>
                                        <strong>{instituicao.name}</strong>
                                        <small>{instituicao.city || "Cidade não informada"}</small>
                                    </span>
                                    <span className="aluno-individual-seta">→</span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {institutionIdSelecionada && (
                    <button
                        className="btn-voltar"
                        onClick={() => navegar("/turmas")}
                    >
                        ← Voltar para instituições
                    </button>
                )}

                {!institutionIdSelecionada ? (
                    <div className="card estado-vazio turma-sem-instituicao">
                        <span className="estado-vazio-icone">🏫</span>
                        <p>Selecione uma instituição para visualizar ou cadastrar turmas.</p>
                    </div>
                ) : (
                    <>
                {/* Botão nova turma */}
                <div className="turmas-topo">
                    <div className="secao-titulo">
                        <h2>Turmas</h2>
                        {!carregando && (
                            <span className="badge">
                                {turmasFiltradas.length}
                            </span>
                        )}
                    </div>
                    {!mostrarForm && (
                        <button
                            className="btn-primario"
                            onClick={() => {
                                if (institutionIdSelecionada) {
                                    setInstituicaoId(institutionIdSelecionada);
                                }

                                setMostrarForm(true);
                            }}
                        >
                            + Nova Turma
                        </button>
                    )}
                </div>

                {/* Formulário de nova turma */}
                {mostrarForm && (
                    <div className="card form-card">
                        <h3>{editando ? "Editar Turma" : "Nova Turma"}</h3>
                        <form
                            onSubmit={handleSalvarTurma}
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
                            <p className="texto-leve">
                                A turma será vinculada a {instituicaoSelecionada?.name}.
                            </p>
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
                                        : editando
                                          ? "Salvar alterações"
                                          : "Salvar Turma"}
                                </button>

                                <button
                                    type="button"
                                    className="btn-secundario"
                                    onClick={fecharForm}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>
                            </div>
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
                    (turmasFiltradas.length === 0 ? (
                        <div className="card estado-vazio">
                            <span className="estado-vazio-icone">📚</span>
                            <p>Nenhuma turma cadastrada ainda.</p>
                            <p className="texto-leve">
                                Clique em "+ Nova Turma" para começar.
                            </p>
                        </div>
                    ) : (
                        <div className="lista-turmas">
                            {turmasFiltradas.map((turma) => (
                                <div
                                    key={turma._id}
                                    className="card card-turma"
                                >
                                    <div
                                        className="turma-info"
                                        onClick={() =>
                                            navegar(montarUrlTurma(turma._id))
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
                                                navegar(
                                                    montarUrlTurma(turma._id),
                                                )
                                            }
                                        >
                                            Ver alunos →
                                        </button>
                                        <button
                                            className="btn-acao editar"
                                            onClick={() => abrirEdicao(turma)}
                                        >
                                            ✏️
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
                    </>
                )}
            </div>
        </div>
    );
}
