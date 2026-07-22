// =============================================================================
// RelatorioPDF.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Template formal do relatório PDF por aluno.
// Linguagem acessível — pensado para apresentação aos pais/responsáveis.
// =============================================================================

import { useState } from "react";
import { textosAnonimos } from "../../config/modoAnonimo";
import "./RelatorioPDF.css";

export default function RelatorioPDF({
    aluno,
    resumo,
    sessoes,
    alertas,
    professor,
}) {
    const nomeProfessorRelatorio =
        textosAnonimos.pdfProfessor || professor?.name;
    const [agora] = useState(() => Date.now());

    const calcularIdade = (birthDate) => {
        if (!birthDate) return null;
        const diff = agora - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const formatarData = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatarDataHora = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatarDuracao = (ms) => {
        if (!ms) return "0s";
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}s`;
        return `${Math.floor(s / 60)}min ${s % 60}s`;
    };

    const traduzirCategoria = (cat) => {
        const mapa = {
            Fase01: "Ações",
            Fase02: "Alimentos",
            Fase03: "Cotidiano",
            Fase04: "Diversão",
            Fase05: "Higiene",
        };
        return mapa[cat] || cat;
    };

    const traduzirAlerta = (alerta) => {
        const descricoes = {
            taxa_baixa:
                "Nas últimas sessões, o aluno acertou menos da metade das atividades. Esse resultado pode sugerir necessidade de retomar alguns itens com mediação adicional.",

            taxa_regular:
                "Nas últimas sessões, o aluno acertou entre metade e a maioria das atividades. Esse resultado sugere desempenho em desenvolvimento e pode orientar novas práticas.",

            inatividade_alta:
                "Foram registrados períodos mais longos sem interação durante o jogo. Esse dado pode estar relacionado a pausa, reflexão, cansaço, espera por ajuda ou necessidade de mediação.",

            inatividade_media:
                "Foram registrados alguns momentos de pausa durante o jogo. Vale observar o contexto dessas pausas para compreender se ocorreram por reflexão, espera, cansaço ou necessidade de apoio.",

            sem_jogar_longo:
                "Já se passaram mais de duas semanas desde a última sessão registrada. A regularidade pode apoiar a continuidade do acompanhamento pedagógico.",

            sem_jogar:
                "Já se passou uma semana desde a última sessão registrada. Pode ser interessante retomar as atividades para manter o acompanhamento.",
            categoria_problematica:
                "Uma das categorias apresentou maior ocorrência de erros. Esse dado pode apoiar o professor na escolha de itens que merecem nova mediação.",

            evolucao_positiva:
                "As sessões recentes apresentaram aumento de acertos. Esse dado pode estar relacionado à familiaridade com o jogo, ao contexto da atividade ou às estratégias de mediação utilizadas.",
        };
        return descricoes[alerta.tipo] || alerta.descricao;
    };

    const obterCategoriasSessao = (sessao) => {
        const categorias = [];
        sessao.gameEvents?.forEach((evento) => {
            if (evento.eventType === "CategorySelected") {
                try {
                    const payload = JSON.parse(evento.payload);
                    const cat = traduzirCategoria(payload.category);
                    if (!categorias.includes(cat)) categorias.push(cat);
                } catch {
                    // Ignora payload legado inválido sem interromper o relatório.
                }
            }
        });
        return categorias.join(", ") || "—";
    };

    const obterEstrelasSessao = (sessao) => {
        let estrelas = null;
        sessao.gameEvents?.forEach((evento) => {
            if (evento.eventType === "PhaseCompleted") {
                try {
                    const payload = JSON.parse(evento.payload);
                    estrelas = payload.stars;
                } catch {
                    // Ignora payload legado inválido sem interromper o relatório.
                }
            }
        });
        if (estrelas === null) return "—";
        return "⭐".repeat(estrelas);
    };

    const idade = calcularIdade(aluno?.birthDate);

    const sessoesComImagem =
        sessoes?.filter((sessao) => sessao.screenshots?.length > 0) || [];

    const totalImagensCapturadas = sessoesComImagem.reduce(
        (total, sessao) => total + (sessao.screenshots?.length || 0),
        0,
    );

    const totalSessoesComImagem = sessoesComImagem.length;
    const totalSessoesSemImagem =
        (sessoes?.length || 0) - totalSessoesComImagem;

    const descreverMapaInteracao = (sessao) => {
        const quantidade = sessao.screenshots?.length || 0;

        if (quantidade === 0) {
            return "Mapa sem imagem de fundo";
        }

        return `${quantidade} ${quantidade > 1 ? "imagens" : "imagem"} por fase`;
    };

    return (
        <div id="relatorio-pdf" className="relatorio-pdf">
            {/* Cabeçalho */}
            <div className="pdf-cabecalho">
                <div className="pdf-logo">
                    <span className="pdf-logo-icone">🎮</span>
                    <div>
                        <div className="pdf-logo-titulo">LUDUS Acompanha</div>
                        <div className="pdf-logo-subtitulo">
                            {textosAnonimos.pdfSubtitulo}
                        </div>
                    </div>
                </div>
                <div className="pdf-cabecalho-info">
                    <div className="pdf-titulo-relatorio">
                        Relatório de Acompanhamento
                    </div>
                    <div className="pdf-data-geracao">
                        Gerado em: {formatarDataHora(new Date().toISOString())}
                    </div>
                    {nomeProfessorRelatorio && (
                        <div className="pdf-data-geracao">
                            Gerado por: {nomeProfessorRelatorio}
                        </div>
                    )}
                </div>
            </div>

            <div className="pdf-divisor" />

            {/* Dados do aluno */}
            <div className="pdf-secao">
                <div className="pdf-secao-titulo">Dados do Aluno</div>
                <div className="pdf-grid-dados">
                    <div className="pdf-dado">
                        <span className="pdf-dado-label">Nome completo</span>
                        <span className="pdf-dado-valor">{aluno?.name}</span>
                    </div>
                    {idade !== null && (
                        <div className="pdf-dado">
                            <span className="pdf-dado-label">Idade</span>
                            <span className="pdf-dado-valor">{idade} anos</span>
                        </div>
                    )}
                    <div className="pdf-dado">
                        <span className="pdf-dado-label">
                            Nível de suporte relacionado ao TEA
                        </span>
                        <span className="pdf-dado-valor">
                            {aluno?.supportLevel || "Não informado"}
                        </span>
                    </div>
                    {aluno?.otherConditions && (
                        <div className="pdf-dado">
                            <span className="pdf-dado-label">
                                Outras condições ou informações relevantes
                            </span>
                            <span className="pdf-dado-valor">
                                {aluno.otherConditions}
                            </span>
                        </div>
                    )}
                    {aluno?.guardianName && (
                        <div className="pdf-dado">
                            <span className="pdf-dado-label">Responsável</span>
                            <span className="pdf-dado-valor">
                                {aluno.guardianName}
                            </span>
                        </div>
                    )}
                    {aluno?.guardianContact && (
                        <div className="pdf-dado">
                            <span className="pdf-dado-label">
                                Contato do responsável
                            </span>
                            <span className="pdf-dado-valor">
                                {aluno.guardianContact}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="pdf-divisor" />

            {/* Resumo de desempenho */}
            {resumo && (
                <>
                    <div className="pdf-secao">
                        <div className="pdf-secao-titulo">
                            Resumo Geral de Desempenho
                        </div>
                        <p className="pdf-texto-intro">
                            O quadro abaixo reúne os principais resultados das
                            sessões realizadas pelo aluno no jogo educacional{" "}
                            <strong>Para Que Serve?</strong>.
                        </p>
                        <div className="pdf-metricas">
                            <div className="pdf-metrica">
                                <div className="pdf-metrica-valor">
                                    {resumo.totalSessoes}
                                </div>
                                <div className="pdf-metrica-label">
                                    Sessões realizadas
                                </div>
                            </div>
                            <div className="pdf-metrica">
                                <div className="pdf-metrica-valor">
                                    {resumo.totalCorrect}
                                </div>
                                <div className="pdf-metrica-label">
                                    Total de acertos
                                </div>
                            </div>
                            <div className="pdf-metrica">
                                <div className="pdf-metrica-valor">
                                    {resumo.totalWrong}
                                </div>
                                <div className="pdf-metrica-label">
                                    Total de erros
                                </div>
                            </div>
                            <div className="pdf-metrica destaque">
                                <div className="pdf-metrica-valor">
                                    {resumo.taxaAcerto}
                                </div>
                                <div className="pdf-metrica-label">
                                    Taxa de acerto geral
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pdf-divisor" />
                </>
            )}

            {/* Categorias jogadas */}
            {resumo?.categorias &&
                Object.keys(resumo.categorias).length > 0 && (
                    <>
                        <div className="pdf-secao">
                            <div className="pdf-secao-titulo">
                                Categorias Praticadas
                            </div>
                            <p className="pdf-texto-intro">
                                O jogo é organizado em categorias temáticas.
                                Abaixo estão as categorias já praticadas pelo
                                aluno:
                            </p>
                            <div className="pdf-categorias">
                                {Object.entries(resumo.categorias).map(
                                    ([cat, qtd]) => (
                                        <div
                                            key={cat}
                                            className="pdf-categoria"
                                        >
                                            <span>
                                                {traduzirCategoria(cat)}
                                            </span>
                                            <span className="pdf-categoria-qtd">
                                                {qtd}{" "}
                                                {qtd === 1 ? "vez" : "vezes"}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="pdf-divisor" />
                    </>
                )}

            {/* Alertas pedagógicos */}
            {alertas?.length > 0 && (
                <>
                    <div className="pdf-secao">
                        <div className="pdf-secao-titulo">
                            Observações Pedagógicas
                        </div>
                        <p className="pdf-texto-intro">
                            Com base no histórico de sessões, o sistema destacou
                            alguns pontos que podem apoiar a observação
                            pedagógica do professor:
                        </p>
                        <div className="pdf-alertas">
                            {alertas.map((alerta, i) => (
                                <div key={i} className="pdf-alerta">
                                    <div className="pdf-alerta-titulo">
                                        {alerta.icone} {alerta.titulo}
                                    </div>
                                    <div className="pdf-alerta-descricao">
                                        {traduzirAlerta(alerta)}
                                    </div>
                                    <div className="pdf-alerta-sugestao">
                                        Sugestão para o professor:{" "}
                                        {alerta.sugestao}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pdf-divisor" />
                </>
            )}

            {/* Histórico de sessões */}
            {sessoes?.length > 0 && (
                <>
                    <div className="pdf-secao">
                        <div className="pdf-secao-titulo">
                            Histórico Detalhado de Sessões
                        </div>
                        <p className="pdf-texto-intro">
                            Cada linha representa uma sessão de jogo. Os acertos
                            e erros indicam as tentativas de associar cada item
                            à imagem correspondente durante a atividade.
                        </p>
                        <table className="pdf-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Categoria</th>
                                    <th>Acertos</th>
                                    <th>Erros</th>
                                    <th>Taxa</th>
                                    <th>Duração</th>
                                    <th>Avaliação</th>
                                    <th>Inatividades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessoes.map((sessao) => {
                                    const ac =
                                        sessao.metrics?.totalCorrect || 0;
                                    const er = sessao.metrics?.totalWrong || 0;
                                    const inat =
                                        sessao.metrics?.inactivityCount || 0;
                                    const taxa =
                                        ac + er > 0
                                            ? ((ac / (ac + er)) * 100).toFixed(
                                                  0,
                                              ) + "%"
                                            : "—";
                                    return (
                                        <tr key={sessao.sessionId}>
                                            <td>
                                                {formatarDataHora(
                                                    sessao.startedAt,
                                                )}
                                            </td>
                                            <td>
                                                {obterCategoriasSessao(sessao)}
                                            </td>
                                            <td>{ac}</td>
                                            <td>{er}</td>
                                            <td>{taxa}</td>
                                            <td>
                                                {formatarDuracao(
                                                    sessao.durationMs,
                                                )}
                                            </td>
                                            <td>
                                                {obterEstrelasSessao(sessao)}
                                            </td>
                                            <td>
                                                {inat === 0
                                                    ? "Nenhuma"
                                                    : `${inat} pausa${inat > 1 ? "s" : ""}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="pdf-divisor" />
                </>
            )}

            {/* Mapas de interação */}
            {sessoes?.length > 0 && (
                <>
                    <div className="pdf-secao">
                        <div className="pdf-secao-titulo">
                            Mapas de Interação
                        </div>

                        <p className="pdf-texto-intro">
                            O LUDUS Acompanha registra os movimentos e cliques
                            realizados durante o jogo. Quando há imagem da fase,
                            o mapa pode ser analisado sobre a própria tela
                            jogada. Quando não há imagem disponível, o sistema
                            apresenta um mapa geral das interações da sessão.
                        </p>

                        <div className="pdf-mapas-resumo">
                            <div className="pdf-mapa-resumo-item">
                                <span className="pdf-mapa-resumo-valor">
                                    {totalSessoesComImagem}
                                </span>
                                <span className="pdf-mapa-resumo-label">
                                    Sessões com imagens da fase
                                </span>
                            </div>

                            <div className="pdf-mapa-resumo-item">
                                <span className="pdf-mapa-resumo-valor">
                                    {totalSessoesSemImagem}
                                </span>
                                <span className="pdf-mapa-resumo-label">
                                    Sessões sem imagem de fundo
                                </span>
                            </div>

                            <div className="pdf-mapa-resumo-item">
                                <span className="pdf-mapa-resumo-valor">
                                    {totalImagensCapturadas}
                                </span>
                                <span className="pdf-mapa-resumo-label">
                                    Imagens das fases{" "}
                                </span>
                            </div>
                        </div>

                        <table className="pdf-tabela pdf-tabela-mapas">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Categoria</th>
                                    <th>Tipo de mapa disponível</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessoes.map((sessao) => (
                                    <tr key={`mapa-${sessao.sessionId}`}>
                                        <td>
                                            {formatarDataHora(sessao.startedAt)}
                                        </td>
                                        <td>{obterCategoriasSessao(sessao)}</td>
                                        <td>
                                            {descreverMapaInteracao(sessao)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pdf-divisor" />
                </>
            )}

            {/* Anotações do professor */}
            {aluno?.anotacoes?.length > 0 && (
                <div className="pdf-secao">
                    <div className="pdf-secao-titulo">
                        Observações do Professor
                    </div>
                    <p className="pdf-texto-intro">
                        Registros feitos pelo professor durante o acompanhamento
                        do aluno:
                    </p>
                    <div className="pdf-anotacoes">
                        {[...aluno.anotacoes].reverse().map((anot) => (
                            <div key={anot._id} className="pdf-anotacao">
                                <div className="pdf-anotacao-meta">
                                    <span>{anot.autorNome}</span>
                                    <span>{formatarData(anot.createdAt)}</span>
                                </div>
                                <div className="pdf-anotacao-texto">
                                    {anot.texto}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rodapé */}
            <div className="pdf-rodape">
                <div className="pdf-divisor" />
                <p>
                    Este relatório foi gerado automaticamente pelo sistema{" "}
                    <strong>LUDUS Acompanha</strong> e tem caráter
                    exclusivamente informativo. Os dados apresentados refletem o
                    desempenho da criança nas atividades do jogo educacional{" "}
                    <strong>Para Que Serve?</strong> e devem ser analisados em
                    conjunto com profissionais habilitados.{" "}
                    <strong>
                        Este documento não constitui diagnóstico clínico.
                    </strong>
                </p>
                <p>{textosAnonimos.pdfRodape}</p>
            </div>
        </div>
    );
}
