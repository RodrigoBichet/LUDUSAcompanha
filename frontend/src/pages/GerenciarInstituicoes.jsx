// =============================================================================
// GerenciarInstituicoes.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página admin — listagem, cadastro, edição e remoção de instituições.
// Acessível apenas por usuários com role 'admin'.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Header from "../components/layout/Header";
import ConfirmacaoRemocao from "../components/ConfirmacaoRemocao";
import { useConfirmacaoRemocao } from "../components/useConfirmacaoRemocao";
import {
    listarInstituicoes,
    criarInstituicao,
    atualizarInstituicao,
    deletarInstituicao,
} from "../services/api";
import "./GerenciarInstituicoes.css";

export default function GerenciarInstituicoes() {
    const [instituicoes, setInstituicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Controle do formulário
    const [formAberto, setFormAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [nome, setNome] = useState("");
    const [cidade, setCidade] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState(null);
    const remocao = useConfirmacaoRemocao();

    // -------------------------------------------------------------------------
    // Carrega lista de instituições do backend
    // -------------------------------------------------------------------------
    const carregarInstituicoes = useCallback(async () => {
        try {
            setCarregando(true);
            const res = await listarInstituicoes();
            setInstituicoes(res.data.instituicoes || []);
        } catch {
            setErro("Não foi possível carregar as instituições.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        const iniciarCarregamento = async () => {
            await carregarInstituicoes();
        };

        iniciarCarregamento();
    }, [carregarInstituicoes]);

    // -------------------------------------------------------------------------
    // Abre formulário para nova instituição
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
    const abrirFormEdicao = (instituicao) => {
        setEditando(instituicao);
        setNome(instituicao.name);
        setCidade(instituicao.city || "");
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
    // Salva instituição — cria nova ou atualiza existente
    // -------------------------------------------------------------------------
    const salvarInstituicao = async () => {
        if (!nome.trim()) {
            setErroForm("O nome da instituição é obrigatório.");
            return;
        }

        try {
            setSalvando(true);
            setErroForm(null);

            if (editando) {
                await atualizarInstituicao(editando._id, {
                    name: nome.trim(),
                    city: cidade.trim(),
                });
            } else {
                await criarInstituicao({
                    name: nome.trim(),
                    city: cidade.trim(),
                });
            }

            cancelarForm();
            await carregarInstituicoes();
        } catch {
            setErroForm("Erro ao salvar instituição. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    // -------------------------------------------------------------------------
    // Deleta instituição com confirmação
    // -------------------------------------------------------------------------
    const abrirRemocaoInstituicao = (instituicao, origemFoco) => {
        remocao.abrir({ id: instituicao._id, nome: instituicao.name, titulo: "Remover instituição permanentemente?",
            descricao: "A instituição só pode ser removida se não possuir alunos. As turmas vazias vinculadas também serão removidas; alunos, sessões e imagens são preservados.",
            rotuloConfirmacao: "Remover instituição" }, origemFoco);
    };
    const removerInstituicao = () => {
        remocao.executar((alvo) => deletarInstituicao(alvo.id), carregarInstituicoes, "Erro ao remover instituição. Tente novamente.");
    };

    return (
        <div>
            <Header
                titulo="Gerenciar Instituições"
                subtitulo="Cadastre e gerencie as instituições parceiras"
            />

            <div className="pagina-conteudo">
                {/* Formulário de criação/edição */}
                {formAberto && (
                    <div className="card admin-instituicao-form">
                        <h3 className="form-titulo">
                            {editando
                                ? "Editar Instituição"
                                : "Nova Instituição"}
                        </h3>

                        <div className="admin-instituicao-form-campos">
                            <div className="campo-grupo">
                                <label className="campo-label">
                                    Nome da instituição *
                                </label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    placeholder="Ex: APAE Pelotas"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>

                            <div className="campo-grupo">
                                <label className="campo-label">Cidade</label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    placeholder="Ex: Pelotas"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                />
                            </div>
                        </div>

                        {erroForm && <p className="form-erro">⚠️ {erroForm}</p>}

                        <div className="admin-instituicao-form-acoes">
                            <button
                                className="btn-primario"
                                onClick={salvarInstituicao}
                                disabled={salvando}
                            >
                                {salvando
                                    ? "Salvando..."
                                    : editando
                                      ? "Salvar alterações"
                                      : "Cadastrar instituição"}
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
                        <h2>Instituições cadastradas</h2>
                        <span className="badge">{instituicoes.length}</span>
                    </div>
                    {!formAberto && (
                        <button
                            className="btn-primario"
                            onClick={abrirFormNovo}
                        >
                            + Nova instituição
                        </button>
                    )}
                </div>

                {/* Estado de carregamento */}
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando instituições...</p>
                    </div>
                )}

                {/* Erro de carregamento */}
                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {/* Lista de instituições */}
                {!carregando && !erro && (
                    <>
                        {instituicoes.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">🏫</span>
                                <p>Nenhuma instituição cadastrada ainda.</p>
                                <p className="texto-leve">
                                    Clique em "Nova instituição" para começar.
                                </p>
                            </div>
                        ) : (
                            <div className="lista-instituicoes">
                                {instituicoes.map((instituicao) => (
                                    <div
                                        key={instituicao._id}
                                        className="card card-instituicao"
                                    >
                                        <div className="instituicao-info">
                                            <span className="instituicao-icone">
                                                🏫
                                            </span>
                                            <div>
                                                <p className="instituicao-nome">
                                                    {instituicao.name}
                                                </p>
                                                <p className="texto-leve">
                                                    {instituicao.city ||
                                                        "Cidade não informada"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="instituicao-acoes">
                                            <button
                                                className="btn-acao editar"
                                                onClick={() =>
                                                    abrirFormEdicao(instituicao)
                                                }
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className="btn-acao deletar"
                                                onClick={(evento) => abrirRemocaoInstituicao(instituicao, evento.currentTarget)}
                                                disabled={remocao.ocupado}
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
            {remocao.alvo && <ConfirmacaoRemocao alvo={remocao.alvo} ocupado={remocao.ocupado} erro={remocao.erro}
                onCancelar={remocao.cancelar} onConfirmar={removerInstituicao} />}
        </div>
    );
}
