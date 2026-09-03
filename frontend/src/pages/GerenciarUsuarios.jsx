// =============================================================================
// GerenciarUsuarios.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Página admin — listagem, cadastro e remoção de usuários (professores e admins).
// Acessível apenas por usuários com role 'admin'.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import ConfirmacaoRemocao from "../components/ConfirmacaoRemocao";
import { useConfirmacaoRemocao } from "../components/useConfirmacaoRemocao";
import {
    listarUsuarios,
    deletarUsuario,
    listarInstituicoes,
    criarUsuario,
    atualizarUsuario,
} from "../services/api";
import "./GerenciarUsuarios.css";

const ehVinculoPendente = (usuario) =>
    !usuario.institutionId && Boolean(usuario.institutionRequest);

export default function GerenciarUsuarios() {
    const { usuario } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [instituicoes, setInstituicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [mostrarSomentePendentes, setMostrarSomentePendentes] = useState(false);

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
    const remocao = useConfirmacaoRemocao();
    const totalPendentes = usuarios.filter(ehVinculoPendente).length;
    const usuariosExibidos = useMemo(() => {
        const ordenados = [...usuarios].sort((a, b) => {
            const diferencaPendencia = Number(ehVinculoPendente(b)) - Number(ehVinculoPendente(a));
            if (diferencaPendencia !== 0) return diferencaPendencia;
            return a.name.localeCompare(b.name, "pt-BR");
        });

        return mostrarSomentePendentes
            ? ordenados.filter(ehVinculoPendente)
            : ordenados;
    }, [mostrarSomentePendentes, usuarios]);

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
            const usuariosRecebidos = resUsuarios.data.usuarios || [];
            setUsuarios(usuariosRecebidos);
            if (!usuariosRecebidos.some(ehVinculoPendente)) {
                setMostrarSomentePendentes(false);
            }
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
    // Cria novo usuário pela rota administrativa protegida
    // -------------------------------------------------------------------------
    const salvarUsuario = async () => {
        if (!nome.trim() || !email.trim()) {
            setErroForm("Nome e email são obrigatórios.");
            return;
        }

        // Senha obrigatória apenas na criação
        if (!editando && senha.length < 8) {
            setErroForm("A senha do novo usuário deve ter pelo menos 8 caracteres.");
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
                await criarUsuario({
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
    const abrirRemocaoUsuario = (usuario, origemFoco) => {
        remocao.abrir({ id: usuario._id, nome: usuario.name, titulo: "Remover usuário permanentemente?",
            descricao: "O acesso dessa pessoa será removido. Cadastros e históricos vinculados não serão apagados por esta ação.",
            rotuloConfirmacao: "Remover usuário" }, origemFoco);
    };
    const removerUsuario = () => {
        remocao.executar((alvo) => deletarUsuario(alvo.id), carregarDados, "Erro ao remover usuário. Tente novamente.");
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
                                        placeholder="Mínimo 8 caracteres"
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

                        {editando?.institutionRequest && (
                            <div className="solicitacao-instituicao">
                                <strong>Vínculo solicitado no cadastro</strong>
                                <span>{editando.institutionRequest.name}{editando.institutionRequest.city ? ` • ${editando.institutionRequest.city}` : ""}</span>
                                <small>Selecione acima a instituição correspondente. Se ela ainda não existir, cadastre-a primeiro em Admin → Instituições.</small>
                            </div>
                        )}

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

                {!carregando && !erro && totalPendentes > 0 && (
                    <section className="card resumo-vinculos-pendentes">
                        <div>
                            <span className="resumo-vinculos-icone" aria-hidden="true">🏫</span>
                            <div>
                                <strong>
                                    {totalPendentes === 1
                                        ? "1 vínculo aguardando análise"
                                        : `${totalPendentes} vínculos aguardando análise`}
                                </strong>
                                <p>Confira a instituição informada e vincule cada professora ao cadastro correto.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-secundario"
                            aria-pressed={mostrarSomentePendentes}
                            onClick={() => setMostrarSomentePendentes((atual) => !atual)}
                        >
                            {mostrarSomentePendentes ? "Mostrar todos" : "Mostrar somente pendentes"}
                        </button>
                    </section>
                )}

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
                        {usuariosExibidos.length === 0 ? (
                            <div className="card estado-vazio">
                                <span className="estado-vazio-icone">👥</span>
                                <p>
                                    {mostrarSomentePendentes
                                        ? "Nenhum vínculo institucional está pendente."
                                        : "Nenhum usuário cadastrado ainda."}
                                </p>
                            </div>
                        ) : (
                            <div className="lista-usuarios">
                                {usuariosExibidos.map((u) => (
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
                                                    {!u.institutionId && u.institutionRequest && (
                                                        <span className="tag-solicitacao">
                                                            Vínculo pendente: {u.institutionRequest.name}
                                                            {u.institutionRequest.city ? ` • ${u.institutionRequest.city}` : ""}
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
                                            {u._id === usuario?.id ? (
                                                <span className="tag-role">Conta atual</span>
                                            ) : (
                                                <button
                                                    className="btn-acao deletar"
                                                    onClick={(evento) => abrirRemocaoUsuario(u, evento.currentTarget)}
                                                    disabled={remocao.ocupado}
                                                >
                                                    🗑️ Remover
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            {remocao.alvo && <ConfirmacaoRemocao alvo={remocao.alvo} ocupado={remocao.ocupado} erro={remocao.erro}
                onCancelar={remocao.cancelar} onConfirmar={removerUsuario} />}
        </div>
    );
}
