// =============================================================================
// GerenciarUsuarios.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página admin — listagem, cadastro e remoção de usuários (professores e admins).
// Acessível apenas por usuários com role 'admin'.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Header from "../components/layout/Header";
import {
    listarUsuarios,
    deletarUsuario,
    listarInstituicoes,
    atualizarUsuario,
} from "../services/api";
import api from "../services/api";
import "./GerenciarUsuarios.css";

export default function GerenciarUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [instituicoes, setInstituicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Controle do formulário
    const [formAberto, setFormAberto] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [role, setRole] = useState("professor");
    const [instituicaoId, setInstituicaoId] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState(null);
    const [editando, setEditando] = useState(null); // usuário sendo editado ou null

    // -------------------------------------------------------------------------
    // Carrega usuários e instituições em paralelo
    // -------------------------------------------------------------------------
    const carregarDados = useCallback(async () => {
        try {
            setCarregando(true);
            const [resUsuarios, resInstituicoes] = await Promise.all([
                listarUsuarios(),
                listarInstituicoes(),
            ]);
            setUsuarios(resUsuarios.data.usuarios || []);
            setInstituicoes(resInstituicoes.data.instituicoes || []);
        } catch {
            setErro("Não foi possível carregar os dados.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        const iniciarCarregamento = async () => {
            await carregarDados();
        };

        iniciarCarregamento();
    }, [carregarDados]);

    // -------------------------------------------------------------------------
    // Abre formulário limpo para novo usuário
    // -------------------------------------------------------------------------
    const abrirForm = (usuario = null) => {
        setEditando(usuario);
        setNome(usuario?.name || "");
        setEmail(usuario?.email || "");
        setSenha("");
        setRole(usuario?.role || "professor");
        setInstituicaoId(usuario?.institutionId?._id || "");
        setErroForm(null);
        setFormAberto(true);
    };

    // -------------------------------------------------------------------------
    // Cancela e fecha o formulário
    // -------------------------------------------------------------------------
    const cancelarForm = () => {
        setFormAberto(false);
        setErroForm(null);
    };

    // -------------------------------------------------------------------------
    // Cria novo usuário via POST /api/auth/register
    // -------------------------------------------------------------------------
    const salvarUsuario = async () => {
        if (!nome.trim() || !email.trim()) {
            setErroForm("Nome e email são obrigatórios.");
            return;
        }

        // Senha obrigatória apenas na criação
        if (!editando && !senha.trim()) {
            setErroForm("Senha é obrigatória para novo usuário.");
            return;
        }

        try {
            setSalvando(true);
            setErroForm(null);

            if (editando) {
                await atualizarUsuario(editando._id, {
                    name: nome.trim(),
                    email: email.trim(),
                    role,
                    institutionId: instituicaoId || null,
                });
            } else {
                await api.post("/auth/register", {
                    name: nome.trim(),
                    email: email.trim(),
                    password: senha,
                    role,
                    institutionId: instituicaoId || undefined,
                });
            }

            cancelarForm();
            await carregarDados();
        } catch (err) {
            const msg = err.response?.data?.mensagem;
            setErroForm(msg || "Erro ao salvar usuário. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    // -------------------------------------------------------------------------
    // Remove usuário com confirmação
    // -------------------------------------------------------------------------
    const removerUsuario = async (usuario) => {
        if (
            !window.confirm(
                `Deseja remover o usuário "${usuario.name}"? Esta ação não pode ser desfeita.`,
            )
        )
            return;

        try {
            await deletarUsuario(usuario._id);
            await carregarDados();
        } catch {
            alert("Erro ao remover usuário. Tente novamente.");
        }
    };

    // -------------------------------------------------------------------------
    // Label amigável do papel do usuário
    // -------------------------------------------------------------------------
    const labelRole = (role) =>
        role === "admin" ? "⚙️ Admin" : "👨‍🏫 Professor";

    return (
        <div>
            <Header
                titulo="Gerenciar Usuários"
                subtitulo="Cadastre e gerencie professores e administradores"
            />

            <div className="pagina-conteudo">
                {/* Formulário de cadastro */}
                {formAberto && (
                    <div className="card form-usuario">
                        <h3 className="form-titulo">
                            {editando ? "Editar Usuário" : "Novo Usuário"}
                        </h3>
                        <div className="form-campos form-campos-3">
                            <div className="campo-grupo">
                                <label className="campo-label">Nome *</label>
                                <input
                                    className="campo-input"
                                    type="text"
                                    placeholder="Nome completo"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>

                            <div className="campo-grupo">
                                <label className="campo-label">Email *</label>
                                <input
                                    className="campo-input"
                                    type="email"
                                    placeholder="email@instituicao.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Campo senha — apenas na criação */}
                            {!editando && (
                                <div className="campo-grupo">
                                    <label className="campo-label">
                                        Senha *
                                    </label>
                                    <input
                                        className="campo-input"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={senha}
                                        onChange={(e) =>
                                            setSenha(e.target.value)
                                        }
                                    />
                                </div>
                            )}

                            <div className="campo-grupo">
                                <label className="campo-label">Papel</label>
                                <select
                                    className="campo-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="professor">Professor</option>
                                    <option value="admin">Admin</option>
                                </select>
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
                                >
                                    <option value="">
                                        Sem instituição vinculada
                                    </option>
                                    {instituicoes.map((inst) => (
                                        <option key={inst._id} value={inst._id}>
                                            {inst.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {erroForm && <p className="form-erro">⚠️ {erroForm}</p>}

                        <div className="form-acoes">
                            <button
                                className="btn-primario"
                                onClick={salvarUsuario}
                                disabled={salvando}
                            >
                                {salvando
                                    ? "Salvando..."
                                    : editando
                                      ? "Salvar alterações"
                                      : "Cadastrar usuário"}
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
                        <h2>Usuários cadastrados</h2>
                        <span className="badge">{usuarios.length}</span>
                    </div>
                    {!formAberto && (
                        <button
                            className="btn-primario"
                            onClick={() => abrirForm()}
                        >
                            + Novo usuário
                        </button>
                    )}
                </div>

                {/* Estado de carregamento */}
                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Carregando usuários...</p>
                    </div>
                )}

                {/* Erro de carregamento */}
                {erro && (
                    <div className="card erro-card">
                        <span>⚠️</span>
                        <p>{erro}</p>
                    </div>
                )}

                {/* Lista de usuários */}
                {!carregando && !erro && (
                    <>
                        {usuarios.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">👥</span>
                                <p>Nenhum usuário cadastrado ainda.</p>
                            </div>
                        ) : (
                            <div className="lista-usuarios">
                                {usuarios.map((u) => (
                                    <div
                                        key={u._id}
                                        className="card card-usuario"
                                    >
                                        <div className="usuario-info-card">
                                            <div className="usuario-avatar-card">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="usuario-nome-card">
                                                    {u.name}
                                                </p>
                                                <p className="texto-leve">
                                                    {u.email}
                                                </p>
                                                <p className="usuario-meta">
                                                    <span className="tag-role">
                                                        {labelRole(u.role)}
                                                    </span>
                                                    {u.institutionId && (
                                                        <span className="tag-instituicao">
                                                            🏫{" "}
                                                            {
                                                                u.institutionId
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="usuario-acoes">
                                            <button
                                                className="btn-acao editar"
                                                onClick={() => abrirForm(u)}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className="btn-acao deletar"
                                                onClick={() =>
                                                    removerUsuario(u)
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
