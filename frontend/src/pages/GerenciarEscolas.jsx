// =============================================================================
// GerenciarEscolas.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página admin — listagem, cadastro, edição e remoção de escolas.
// Acessível apenas por usuários com role 'admin'.
// =============================================================================

import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import {
    listarEscolas,
    criarEscola,
    atualizarEscola,
    deletarEscola,
} from "../services/api";
import "./GerenciarEscolas.css";

export default function GerenciarEscolas() {
    const [escolas, setEscolas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Controle do formulário
    const [formAberto, setFormAberto] = useState(false);
    const [editando, setEditando] = useState(null); // escola sendo editada ou null
    const [nome, setNome] = useState("");
    const [cidade, setCidade] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState(null);

    useEffect(() => {
        carregarEscolas();
    }, []);

    // -------------------------------------------------------------------------
    // Carrega lista de escolas do backend
    // -------------------------------------------------------------------------
    const carregarEscolas = async () => {
        try {
            setCarregando(true);
            const res = await listarEscolas();
            setEscolas(res.data.escolas || []);
        } catch {
            setErro("Não foi possível carregar as escolas.");
        } finally {
            setCarregando(false);
        }
    };

    // -------------------------------------------------------------------------
    // Abre formulário para nova escola
    // -------------------------------------------------------------------------
    const abrirFormNovo = () => {
        setEditando(null);
        setNome("");
        setCidade("");
        setErroForm(null);
        setFormAberto(true);
    };

    // -------------------------------------------------------------------------
    // Abre formulário preenchido para edição
    // -------------------------------------------------------------------------
    const abrirFormEdicao = (escola) => {
        setEditando(escola);
        setNome(escola.name);
        setCidade(escola.city || "");
        setErroForm(null);
        setFormAberto(true);
    };

    // -------------------------------------------------------------------------
    // Cancela e fecha o formulário
    // -------------------------------------------------------------------------
    const cancelarForm = () => {
        setFormAberto(false);
        setEditando(null);
        setNome("");
        setCidade("");
        setErroForm(null);
    };

    // -------------------------------------------------------------------------
    // Salva escola — cria nova ou atualiza existente
    // -------------------------------------------------------------------------
    const salvarEscola = async () => {
        if (!nome.trim()) {
            setErroForm("O nome da escola é obrigatório.");
            return;
        }

        try {
            setSalvando(true);
            setErroForm(null);

            if (editando) {
                await atualizarEscola(editando._id, {
                    name: nome.trim(),
                    city: cidade.trim(),
                });
            } else {
                await criarEscola({ name: nome.trim(), city: cidade.trim() });
            }

            cancelarForm();
            await carregarEscolas();
        } catch {
            setErroForm("Erro ao salvar escola. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    // -------------------------------------------------------------------------
    // Deleta escola com confirmação
    // -------------------------------------------------------------------------
    const removerEscola = async (escola) => {
        if (
            !window.confirm(
                `Deseja remover a escola "${escola.name}"? Esta ação não pode ser desfeita.`,
            )
        )
            return;

        try {
            await deletarEscola(escola._id);
            await carregarEscolas();
        } catch {
            alert("Erro ao remover escola. Tente novamente.");
        }
    };

    return (
        <div>
            <Header
                titulo="Gerenciar Escolas"
                subtitulo="Cadastre e gerencie as escolas parceiras"
            />

            <div className="pagina-conteudo">
                {/* Formulário de criação/edição */}
                {formAberto && (
                    <div className="card form-escola">
                        <h3 className="form-titulo">
                            {editando ? "Editar Escola" : "Nova Escola"}
                        </h3>

                        <div className="form-campos">
                            <div className="campo-grupo">
                                <label className="campo-label">
                                    Nome da escola *
                                </label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    placeholder="Ex: E. M. Silveira Martins"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>

                            <div className="campo-grupo">
                                <label className="campo-label">Cidade</label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    placeholder="Ex: Bagé"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                />
                            </div>
                        </div>

                        {erroForm && <p className="form-erro">⚠️ {erroForm}</p>}

                        <div className="form-acoes">
                            <button
                                className="btn-primario"
                                onClick={salvarEscola}
                                disabled={salvando}
                            >
                                {salvando
                                    ? "Salvando..."
                                    : editando
                                      ? "Salvar alterações"
                                      : "Cadastrar escola"}
                            </button>
                            <button
                                className="btn-secundario"
                                onClick={cancelarForm}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Cabeçalho da listagem */}
                <div className="secao-titulo">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        }}
                    >
                        <h2>Escolas cadastradas</h2>
                        <span className="badge">{escolas.length}</span>
                    </div>
                    {!formAberto && (
                        <button
                            className="btn-primario"
                            onClick={abrirFormNovo}
                        >
                            + Nova escola
                        </button>
                    )}
                </div>

                {/* Estado de carregamento */}
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando escolas...</p>
                    </div>
                )}

                {/* Erro de carregamento */}
                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {/* Lista de escolas */}
                {!carregando && !erro && (
                    <>
                        {escolas.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">🏫</span>
                                <p>Nenhuma escola cadastrada ainda.</p>
                                <p className="texto-leve">
                                    Clique em "Nova escola" para começar.
                                </p>
                            </div>
                        ) : (
                            <div className="lista-escolas">
                                {escolas.map((escola) => (
                                    <div
                                        key={escola._id}
                                        className="card card-escola"
                                    >
                                        <div className="escola-info">
                                            <span className="escola-icone">
                                                🏫
                                            </span>
                                            <div>
                                                <p className="escola-nome">
                                                    {escola.name}
                                                </p>
                                                <p className="texto-leve">
                                                    {escola.city ||
                                                        "Cidade não informada"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="escola-acoes">
                                            <button
                                                className="btn-acao editar"
                                                onClick={() =>
                                                    abrirFormEdicao(escola)
                                                }
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className="btn-acao deletar"
                                                onClick={() =>
                                                    removerEscola(escola)
                                                }
                                            >
                                                🗑️ Remover
                                            </button>
                                        </div>
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
