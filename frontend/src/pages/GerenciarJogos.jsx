// =============================================================================
// GerenciarJogos.jsx
// Catálogo pessoal/institucional de jogos acompanhados.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
    arquivarJogo,
    atualizarJogo,
    listarJogos,
} from "../services/api";
import "./GerenciarJogos.css";

export default function GerenciarJogos() {
    const navegar = useNavigate();
    const [jogos, setJogos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState({});
    const [salvando, setSalvando] = useState(false);

    const carregarJogos = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");
            const resposta = await listarJogos();
            setJogos(resposta.data.jogos || []);
        } catch (erroCarregamento) {
            setErro(
                erroCarregamento.response?.data?.mensagem ||
                    "Não foi possível carregar os jogos.",
            );
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(carregarJogos);
    }, [carregarJogos]);

    const abrirEdicao = (jogo) => {
        setEditandoId(jogo._id);
        setForm({
            name: jogo.name || "",
            description: jogo.description || "",
            defaultVersion: jogo.defaultVersion || "",
            sourceType: jogo.sourceType || "external-json",
        });
    };

    const salvar = async (evento) => {
        evento.preventDefault();
        try {
            setSalvando(true);
            setErro("");
            const resposta = await atualizarJogo(editandoId, form);
            setJogos((atuais) => atuais.map((jogo) =>
                jogo._id === editandoId ? resposta.data.jogo : jogo,
            ));
            setEditandoId(null);
        } catch (erroAtualizacao) {
            setErro(
                erroAtualizacao.response?.data?.mensagem ||
                    "Não foi possível atualizar o jogo.",
            );
        } finally {
            setSalvando(false);
        }
    };

    const alternarArquivo = async (jogo) => {
        const acao = jogo.active === false ? "reativar" : "arquivar";
        if (!window.confirm(`Deseja ${acao} “${jogo.name}”? O histórico será preservado.`)) {
            return;
        }

        try {
            setSalvando(true);
            setErro("");
            const resposta = jogo.active === false
                ? await atualizarJogo(jogo._id, { active: true })
                : await arquivarJogo(jogo._id);
            setJogos((atuais) => atuais.map((item) =>
                item._id === jogo._id ? resposta.data.jogo : item,
            ));
        } catch (erroArquivo) {
            setErro(
                erroArquivo.response?.data?.mensagem ||
                    "Não foi possível alterar o estado do jogo.",
            );
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div>
            <Header
                titulo="Gerenciar jogos"
                subtitulo="Edite ou arquive jogos sem apagar alunos e sessões."
            />
            <div className="pagina-conteudo">
                <button className="btn-voltar" onClick={() => navegar("/")}>
                    ← Voltar à visão geral
                </button>

                {erro && <div className="card erro-card"><p>{erro}</p></div>}

                {carregando ? (
                    <div className="estado-centro"><div className="spinner" /></div>
                ) : jogos.length === 0 ? (
                    <div className="card estado-vazio">
                        <p>Nenhum jogo cadastrado por você ainda.</p>
                    </div>
                ) : (
                    <div className="jogos-gerenciamento-grid">
                        {jogos.map((jogo) => (
                            <div className="card jogo-gerenciamento-card" key={jogo._id}>
                                {editandoId === jogo._id ? (
                                    <form className="jogo-gerenciamento-form" onSubmit={salvar}>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Nome do jogo</span>
                                            <input className="campo-input" value={form.name} required maxLength={120}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Descrição (opcional)</span>
                                            <input className="campo-input" value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                        </label>
                                        <label className="campo-grupo">
                                            <span className="campo-label">Origem</span>
                                            <select className="campo-input" value={form.sourceType}
                                                onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
                                                <option value="external-json">JSON externo</option>
                                                <option value="sdk-ludus">SDK LUDUS</option>
                                                <option value="manual">Cadastro manual</option>
                                            </select>
                                        </label>
                                        <div className="jogo-gerenciamento-acoes">
                                            <button className="btn-primario" disabled={salvando}>
                                                {salvando ? "Salvando..." : "Salvar alterações"}
                                            </button>
                                            <button type="button" className="btn-secundario" onClick={() => setEditandoId(null)}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="jogo-gerenciamento-cabecalho">
                                            <h3>{jogo.name}</h3>
                                            <span className={jogo.active === false ? "jogo-status arquivado" : "jogo-status"}>
                                                {jogo.active === false ? "Arquivado" : "Ativo"}
                                            </span>
                                        </div>
                                        <p className="texto-leve jogo-gerenciamento-descricao">
                                            {jogo.description || "Sem descrição cadastrada."}
                                        </p>
                                        <div className="jogo-gerenciamento-meta">
                                            <span>Identificador técnico</span>
                                            <code>{jogo.gameId}</code>
                                        </div>
                                        <div className="jogo-gerenciamento-acoes">
                                            <button className="btn-secundario" onClick={() => abrirEdicao(jogo)}>
                                                Editar
                                            </button>
                                            <button className="btn-secundario" disabled={salvando} onClick={() => alternarArquivo(jogo)}>
                                                {jogo.active === false ? "Reativar" : "Arquivar"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
