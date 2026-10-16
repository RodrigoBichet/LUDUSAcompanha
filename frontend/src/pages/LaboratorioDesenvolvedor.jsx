import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Icone from "../components/shared/Icone";
import { useAuth } from "../contexts/AuthContext";
import {
    obterLaboratorioDesenvolvedor,
    prepararLaboratorioDesenvolvedor,
} from "../services/api";
import "./LaboratorioDesenvolvedor.css";

export default function LaboratorioDesenvolvedor() {
    const { usuario } = useAuth();
    const [laboratorio, setLaboratorio] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [preparando, setPreparando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const carregar = async () => {
            try {
                const resposta = await obterLaboratorioDesenvolvedor();
                setLaboratorio(resposta.data.laboratorio);
            } catch (falha) {
                setErro(
                    falha.response?.data?.mensagem ||
                        "Não foi possível consultar o laboratório.",
                );
            } finally {
                setCarregando(false);
            }
        };

        void carregar();
    }, []);

    if (usuario?.role !== "developer") {
        return <Navigate to="/" replace />;
    }

    const preparar = async () => {
        try {
            setPreparando(true);
            setErro("");
            const resposta = await prepararLaboratorioDesenvolvedor();
            setLaboratorio(resposta.data.laboratorio);
            window.dispatchEvent(new Event("ludus:laboratorio-alterado"));
        } catch (falha) {
            setErro(
                falha.response?.data?.mensagem ||
                    "Não foi possível preparar o laboratório.",
            );
        } finally {
            setPreparando(false);
        }
    };

    const ativo = Boolean(laboratorio?.ativo);
    const institutionId = laboratorio?.instituicao?._id;

    return (
        <div>
            <Header
                titulo="Laboratório de testes"
                subtitulo="Simule uma aplicação real do SDK com dados fictícios e isolados"
            />

            <div className="pagina-conteudo laboratorio-dev">
                <section className="card laboratorio-aviso">
                    <span className="laboratorio-selo">Dados simulados</span>
                    <div>
                        <h2>Teste o fluxo completo antes de usar em uma escola</h2>
                        <p>
                            O laboratório reutiliza as mesmas telas de turmas,
                            alunos, coletas, sessões e capturas. Tudo o que aparece
                            aqui pertence somente ao seu ambiente de integração.
                        </p>
                    </div>
                </section>

                {carregando && (
                    <div className="estado-centro">
                        <div className="spinner" />
                        <p className="texto-leve">Consultando laboratório...</p>
                    </div>
                )}

                {erro && (
                    <div className="card erro-card" role="alert">
                        <Icone nome="aviso" titulo="Atenção" />
                        <p>{erro}</p>
                    </div>
                )}

                {!carregando && !ativo && (
                    <section className="card laboratorio-preparar">
                        <Icone nome="configuracao" tamanho={38} />
                        <h2>Prepare seu ambiente simulado</h2>
                        <p>
                            Com um clique serão criados o Laboratório LUDUS, uma
                            turma de teste e três alunos fictícios.
                        </p>
                        <button
                            type="button"
                            className="btn-primario"
                            onClick={preparar}
                            disabled={preparando}
                        >
                            {preparando
                                ? "Preparando laboratório..."
                                : "Criar laboratório de testes"}
                        </button>
                    </section>
                )}

                {!carregando && ativo && (
                    <>
                        <section className="laboratorio-resumo">
                            <article className="card laboratorio-resumo-card">
                                <Icone nome="instituicao" />
                                <span>Ambiente</span>
                                <strong>{laboratorio.instituicao.name}</strong>
                            </article>
                            <article className="card laboratorio-resumo-card">
                                <Icone nome="pessoas" />
                                <span>Turma</span>
                                <strong>{laboratorio.turma.name}</strong>
                            </article>
                            <article className="card laboratorio-resumo-card">
                                <Icone nome="usuario" />
                                <span>Alunos fictícios</span>
                                <strong>{laboratorio.alunos.length}</strong>
                            </article>
                        </section>

                        <section className="card laboratorio-acoes">
                            <div>
                                <h2>Comece o teste completo</h2>
                                <p className="texto-leve">
                                    Você pode editar a turma, incluir outros alunos
                                    fictícios e gerar um código de coleta exatamente
                                    como aconteceria em uma aplicação real.
                                </p>
                            </div>
                            <div className="laboratorio-links">
                                <Link
                                    className="laboratorio-link"
                                    to={`/turmas?institutionId=${encodeURIComponent(institutionId)}`}
                                >
                                    <Icone nome="instituicao" />
                                    <span>
                                        <strong>Turmas de teste</strong>
                                        <small>Organizar o ambiente simulado</small>
                                    </span>
                                </Link>
                                <Link
                                    className="laboratorio-link"
                                    to={`/alunos?institutionId=${encodeURIComponent(institutionId)}`}
                                >
                                    <Icone nome="pessoas" />
                                    <span>
                                        <strong>Alunos de teste</strong>
                                        <small>Abrir históricos e indicadores</small>
                                    </span>
                                </Link>
                                <Link
                                    className="laboratorio-link"
                                    to={`/coletas?institutionId=${encodeURIComponent(institutionId)}`}
                                >
                                    <Icone nome="coleta" />
                                    <span>
                                        <strong>Coletas de teste</strong>
                                        <small>Gerar nome e código para o SDK</small>
                                    </span>
                                </Link>
                            </div>
                        </section>

                    </>
                )}
            </div>
        </div>
    );
}
