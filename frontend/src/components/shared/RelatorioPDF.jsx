// =============================================================================
// RelatorioPDF.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Template formal do relatório PDF por aluno.
// Linguagem acessível — pensado para apresentação aos pais/responsáveis.
// =============================================================================

import "./RelatorioPDF.css";

export default function RelatorioPDF({
    aluno,
    resumo,
    sessoes,
    alertas,
    professor,
}) {
    const calcularIdade = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
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
                "A criança está acertando menos da metade das atividades nas últimas sessões. Isso pode indicar dificuldade com o conteúdo apresentado.",
            taxa_regular:
                "A criança está acertando entre metade e a maioria das atividades. Há espaço para melhorar com mais prática.",
            inatividade_alta:
                "A criança ficou parada por longos períodos durante o jogo, sem interagir com a tela. Isso pode indicar distração, cansaço ou dificuldade de concentração.",
            inatividade_media:
                "A criança teve alguns momentos de pausa durante o jogo. Vale observar se precisa de incentivo ou pausas planejadas.",
            sem_jogar_longo:
                "Faz mais de duas semanas desde a última vez que a criança jogou. A regularidade é importante para o aprendizado.",
            sem_jogar:
                "Faz uma semana desde a última sessão. Recomenda-se manter uma frequência regular de atividades.",
            categoria_problematica:
                "A criança está com mais dificuldade em uma categoria específica do jogo. Vale dedicar atenção especial a esse tema.",
            evolucao_positiva:
                "A criança melhorou significativamente nas últimas sessões! O esforço está dando resultado.",
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
                } catch (_) {}
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
                } catch (_) {}
            }
        });
        if (estrelas === null) return "—";
        return "⭐".repeat(estrelas);
    };

    const idade = calcularIdade(aluno?.birthDate);

    return (
        <div id="relatorio-pdf" className="relatorio-pdf">
            {/* Cabeçalho */}
            <div className="pdf-cabecalho">
                <div className="pdf-logo">
                    <span className="pdf-logo-icone">🎮</span>
                    <div>
                        <div className="pdf-logo-titulo">LUDUS Acompanha</div>
                        <div className="pdf-logo-subtitulo">
                            Ferramenta de Monitoramento Educacional — UFPel
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
                    {professor && (
                        <div className="pdf-data-geracao">
                            Gerado por: {professor.name}
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
                            Grau de Suporte (TEA)
                        </span>
                        <span className="pdf-dado-valor">
                            {aluno?.supportLevel || "Não informado"}
                        </span>
                    </div>
                    {aluno?.otherConditions && (
                        <div className="pdf-dado">
                            <span className="pdf-dado-label">
                                Outras condições
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
                            O quadro abaixo apresenta um resumo de todas as
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
                                O jogo é dividido em categorias temáticas. Veja
                                quais o aluno já praticou:
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
                            O sistema identificou automaticamente os seguintes
                            pontos de atenção com base no histórico de sessões
                            do aluno:
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
                            Cada linha representa uma sessão de jogo. "Acertos"
                            e "Erros" referem-se às tentativas de associar a
                            imagem correta durante o jogo.
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
                <p>
                    UFPel — Universidade Federal de Pelotas |{" "}
                    {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
