import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import {
    criarColeta,
    listarColetas,
    listarAlunos,
    listarRecebimentosColeta,
    resolverParticipanteColeta,
    importarSessoesColeta,
    listarTurmas,
    revogarColeta,
} from "../services/api";
import "./Coletas.css";

const DURACOES = [
    { valor: 60, rotulo: "1 hora" },
    { valor: 120, rotulo: "2 horas" },
    { valor: 240, rotulo: "4 horas" },
    { valor: 480, rotulo: "8 horas" },
];

const formatarData = (valor) =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(valor));

const obterId = (valor) => valor?._id || valor || "";

const formatarDuracao = (valor) => {
    const segundos = Math.max(0, Math.round((Number(valor) || 0) / 1000));
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return minutos > 0 ? `${minutos}min ${resto}s` : `${resto}s`;
};

export default function Coletas() {
    const [coletas, setColetas] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [titulo, setTitulo] = useState("");
    const [turmaId, setTurmaId] = useState("");
    const [duracao, setDuracao] = useState(120);
    const [origens, setOrigens] = useState("");
    const [codigoGerado, setCodigoGerado] = useState(null);
    const [codigoCopiado, setCodigoCopiado] = useState(false);
    const [modoApresentacao, setModoApresentacao] = useState(false);
    const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(null);
    const [revogando, setRevogando] = useState(null);
    const [coletaAberta, setColetaAberta] = useState(null);
    const [caixasPorColeta, setCaixasPorColeta] = useState({});
    const [carregandoRecebimentos, setCarregandoRecebimentos] = useState(null);
    const [alunosPorTurma, setAlunosPorTurma] = useState({});
    const [participanteEmRevisao, setParticipanteEmRevisao] = useState(null);
    const [alunoSelecionado, setAlunoSelecionado] = useState("");
    const [resolvendoParticipante, setResolvendoParticipante] = useState(null);
    const [importandoParticipante, setImportandoParticipante] = useState(null);
    const [resultadoImportacao, setResultadoImportacao] = useState({});

    const turmasPorId = useMemo(
        () => new Map(turmas.map((turma) => [String(turma._id), turma])),
        [turmas],
    );

    const carregarDados = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");
            const [resColetas, resTurmas] = await Promise.all([
                listarColetas(),
                listarTurmas(),
            ]);
            setColetas(resColetas.data.coletas || []);
            setTurmas(resTurmas.data.turmas || []);
        } catch (erroRequisicao) {
            setErro(
                erroRequisicao.response?.data?.mensagem ||
                    "Não foi possível carregar as coletas.",
            );
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

    useEffect(() => {
        if (!codigoCopiado) return undefined;

        const restaurarRotulo = () => setCodigoCopiado(false);
        const aoMudarVisibilidade = () => {
            if (document.hidden) restaurarRotulo();
        };
        const temporizador = window.setTimeout(restaurarRotulo, 2500);

        window.addEventListener("blur", restaurarRotulo);
        document.addEventListener("visibilitychange", aoMudarVisibilidade);

        return () => {
            window.clearTimeout(temporizador);
            window.removeEventListener("blur", restaurarRotulo);
            document.removeEventListener(
                "visibilitychange",
                aoMudarVisibilidade,
            );
        };
    }, [codigoCopiado]);

    const handleCriar = async (evento) => {
        evento.preventDefault();
        setErro("");
        setSucesso("");
        setCodigoGerado(null);
        setCodigoCopiado(false);
        setModoApresentacao(false);

        const allowedOrigins = origens
            .split(/\r?\n/)
            .map((origem) => origem.trim())
            .filter(Boolean);

        try {
            setSalvando(true);
            const resposta = await criarColeta({
                title: titulo.trim(),
                groupId: turmaId,
                durationMinutes: Number(duracao),
                allowedOrigins,
            });
            setCodigoGerado({
                codigo: resposta.data.codigoTemporario,
                coleta: resposta.data.coleta,
            });
            setColetas((atuais) => [resposta.data.coleta, ...atuais]);
            setTitulo("");
            setOrigens("");
            setSucesso("Coleta criada. Compartilhe o código apenas com os computadores desta turma.");
        } catch (erroRequisicao) {
            setErro(
                erroRequisicao.response?.data?.mensagem ||
                    "Não foi possível criar a coleta.",
            );
        } finally {
            setSalvando(false);
        }
    };

    const copiarCodigo = async () => {
        if (!codigoGerado?.codigo) return;
        try {
            await navigator.clipboard.writeText(codigoGerado.codigo);
            setCodigoCopiado(true);
        } catch {
            setCodigoCopiado(false);
            setErro("Não foi possível copiar automaticamente. Selecione o código e copie manualmente.");
        }
    };

    const handleRevogar = async (collectionId) => {
        try {
            setRevogando(collectionId);
            setErro("");
            const resposta = await revogarColeta(collectionId);
            setColetas((atuais) =>
                atuais.map((coleta) =>
                    coleta.collectionId === collectionId
                        ? resposta.data.coleta
                        : coleta,
                ),
            );
            if (codigoGerado?.coleta.collectionId === collectionId) {
                setCodigoGerado(null);
                setCodigoCopiado(false);
                setModoApresentacao(false);
            }
            setConfirmandoRevogacao(null);
            setSucesso("Coleta revogada. O código temporário deixou de ser válido.");
        } catch (erroRequisicao) {
            setErro(
                erroRequisicao.response?.data?.mensagem ||
                    "Não foi possível revogar a coleta.",
            );
        } finally {
            setRevogando(null);
        }
    };

    const carregarRecebimentos = async (coleta) => {
        const groupId = String(obterId(coleta.groupId));
        const [respostaCaixa, respostaAlunos] = await Promise.all([
            listarRecebimentosColeta(coleta.collectionId),
            listarAlunos(groupId),
        ]);
        setCaixasPorColeta((atuais) => ({
            ...atuais,
            [coleta.collectionId]: respostaCaixa.data,
        }));
        setAlunosPorTurma((atuais) => ({
            ...atuais,
            [groupId]: respostaAlunos.data.alunos || [],
        }));
    };

    const adicionarAoHistorico = async (coleta, recebimento) => {
        const pendentes = recebimento.sessoes.filter((sessao) => sessao.status === "pending").slice(0, 100);
        if (!pendentes.length || importandoParticipante) return;
        if (!window.confirm(`Adicionar ${pendentes.length} sessão(ões) ao histórico de ${recebimento.resolvedStudent?.name}? Cada jogo será mantido separado.`)) return;
        setImportandoParticipante(recebimento.participantRef);
        setErro("");
        try {
            const resposta = await importarSessoesColeta(coleta.collectionId, recebimento.participantRef, pendentes.map((item) => item.receiptId));
            setResultadoImportacao((atuais) => ({
                ...atuais,
                [recebimento.participantRef]: {
                    mensagem: resposta.data.mensagem,
                    tipo: resposta.data.sucesso ? "sucesso" : "atencao",
                },
                ...Object.fromEntries(resposta.data.resultados.map((item) => [item.receiptId, item.mensagem || ""])),
            }));
            await carregarRecebimentos(coleta);
        } catch (falha) {
            setErro(falha.response?.data?.mensagem || "Não foi possível confirmar a importação. Você pode tentar novamente sem duplicar as sessões.");
        } finally {
            setImportandoParticipante(null);
        }
    };

    const alternarRecebimentos = async (coleta) => {
        const collectionId = coleta.collectionId;
        if (coletaAberta === collectionId) {
            setColetaAberta(null);
            setParticipanteEmRevisao(null);
            return;
        }

        setColetaAberta(collectionId);

        try {
            setCarregandoRecebimentos(collectionId);
            setErro("");
            await carregarRecebimentos(coleta);
        } catch (erroRequisicao) {
            setColetaAberta(null);
            setErro(
                erroRequisicao.response?.data?.mensagem ||
                    "Não foi possível carregar os recebimentos da coleta.",
            );
        } finally {
            setCarregandoRecebimentos(null);
        }
    };

    const abrirRevisaoParticipante = (recebimento) => {
        setParticipanteEmRevisao(recebimento.participantRef);
        setAlunoSelecionado(recebimento.resolvedStudent?.studentId || "");
        setErro("");
        setSucesso("");
    };

    const resolverParticipante = async (coleta, recebimento, criarNovo) => {
        if (!criarNovo && !alunoSelecionado) {
            setErro("Selecione um aluno existente ou escolha criar um novo.");
            return;
        }

        try {
            setResolvendoParticipante(recebimento.participantRef);
            setErro("");
            setSucesso("");
            const resposta = await resolverParticipanteColeta(
                coleta.collectionId,
                recebimento.participantRef,
                criarNovo
                    ? { createNew: true }
                    : { studentId: alunoSelecionado },
            );
            await carregarRecebimentos(coleta);
            setParticipanteEmRevisao(null);
            setAlunoSelecionado("");
            setSucesso(resposta.data.mensagem);
        } catch (erroRequisicao) {
            const sugerido = erroRequisicao.response?.data?.alunoSugerido;
            if (sugerido?.studentId) setAlunoSelecionado(sugerido.studentId);
            setErro(
                erroRequisicao.response?.data?.mensagem ||
                    "Não foi possível confirmar o aluno desta coleta.",
            );
        } finally {
            setResolvendoParticipante(null);
        }
    };

    const descreverEstado = (coleta) => {
        if (coleta.status === "revoked") return "Revogada";
        if (coleta.status === "closed") return "Encerrada";
        if (coleta.expirada || new Date(coleta.expiresAt) <= new Date()) {
            return "Expirada";
        }
        return "Ativa";
    };

    const turmaDaColetaGerada = codigoGerado
        ? turmasPorId.get(String(obterId(codigoGerado.coleta.groupId)))
        : null;

    return (
        <div>
            <Header
                titulo="Coletas escolares"
                subtitulo="Prepare um código temporário para os computadores da turma"
            />

            <main className="pagina-conteudo pagina-coletas">
                <section className="card introducao-coletas">
                    <div>
                        <h2>Nova coleta observacional</h2>
                        <p>
                            O código não é a senha da professora e não permite
                            consultar o Dashboard. Ele valerá somente para esta
                            turma e pelo período escolhido.
                        </p>
                    </div>
                    <span aria-hidden="true">🔐</span>
                </section>

                <form className="card formulario-coleta" onSubmit={handleCriar}>
                    <label>
                        <span>Título da coleta</span>
                        <input
                            value={titulo}
                            onChange={(evento) => setTitulo(evento.target.value)}
                            placeholder="Ex.: Atividades da manhã"
                            maxLength={120}
                            required
                            disabled={salvando}
                        />
                    </label>

                    <label>
                        <span>Turma</span>
                        <select
                            value={turmaId}
                            onChange={(evento) => setTurmaId(evento.target.value)}
                            required
                            disabled={salvando || turmas.length === 0}
                        >
                            <option value="">Selecione uma turma</option>
                            {turmas.map((turma) => (
                                <option key={turma._id} value={turma._id}>
                                    {turma.name} — {turma.institutionId?.name || "Instituição"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Validade do código</span>
                        <select
                            value={duracao}
                            onChange={(evento) => setDuracao(evento.target.value)}
                            disabled={salvando}
                        >
                            {DURACOES.map((opcao) => (
                                <option key={opcao.valor} value={opcao.valor}>
                                    {opcao.rotulo}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="campo-origens-coleta">
                        <span>Sites dos jogos (opcional)</span>
                        <textarea
                            value={origens}
                            onChange={(evento) => setOrigens(evento.target.value)}
                            placeholder={"https://jogos.exemplo.org\nhttps://outro-portal.exemplo.org"}
                            rows={3}
                            disabled={salvando}
                        />
                        <small>
                            Informe um endereço por linha. Caminhos internos não
                            serão guardados. Deixe vazio enquanto o catálogo de
                            sites ainda estiver sendo preparado.
                        </small>
                    </label>

                    {turmas.length === 0 && !carregando && (
                        <p className="mensagem-coleta aviso">
                            Cadastre uma instituição e uma turma antes de criar
                            a coleta.
                        </p>
                    )}
                    {erro && <p className="mensagem-coleta erro">{erro}</p>}
                    {sucesso && (
                        <p className="mensagem-coleta sucesso">{sucesso}</p>
                    )}

                    <button
                        className="btn-primario"
                        type="submit"
                        disabled={salvando || turmas.length === 0}
                    >
                        {salvando ? "Criando coleta..." : "Gerar código temporário"}
                    </button>
                </form>

                {codigoGerado && (
                    <section className="codigo-coleta" aria-live="polite">
                        <p>Código da turma</p>
                        <strong>{codigoGerado.codigo}</strong>
                        <div className="acoes-codigo-coleta">
                            <button type="button" onClick={copiarCodigo}>
                                {codigoCopiado ? "Código copiado" : "Copiar código"}
                            </button>
                            <button
                                type="button"
                                className="btn-apresentar-coleta"
                                onClick={() => setModoApresentacao(true)}
                            >
                                Exibir para a turma
                            </button>
                        </div>
                        <small>
                            Cada estudante informa este código e seu nome uma
                            única vez. Se ele for perdido ou exposto, revogue a
                            coleta e gere outra.
                        </small>
                    </section>
                )}

                <section className="lista-coletas-secao">
                    <div className="cabecalho-lista-coletas">
                        <div>
                            <h2>Coletas preparadas</h2>
                            <p>Somente as coletas criadas pela sua conta.</p>
                        </div>
                        <span className="badge">{coletas.length}</span>
                    </div>

                    {carregando ? (
                        <div className="card estado-vazio">Carregando coletas...</div>
                    ) : coletas.length === 0 ? (
                        <div className="card estado-vazio">
                            Nenhuma coleta foi preparada ainda.
                        </div>
                    ) : (
                        <div className="lista-coletas">
                            {coletas.map((coleta) => {
                                const turma = turmasPorId.get(
                                    String(obterId(coleta.groupId)),
                                );
                                const estado = descreverEstado(coleta);
                                const podeRevogar = estado === "Ativa";

                                return (
                                    <article className="card coleta-card" key={coleta.collectionId}>
                                        <div className="coleta-card-principal">
                                            <div>
                                                <span className={`estado-coleta ${estado.toLowerCase()}`}>
                                                    {estado}
                                                </span>
                                                <h3>{coleta.title}</h3>
                                                <p>
                                                    {turma?.name || "Turma"} • {turma?.institutionId?.name || "Instituição"}
                                                </p>
                                            </div>
                                            <dl>
                                                <div>
                                                    <dt>Início</dt>
                                                    <dd>{formatarData(coleta.startsAt)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Validade</dt>
                                                    <dd>{formatarData(coleta.expiresAt)}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {podeRevogar &&
                                            (confirmandoRevogacao === coleta.collectionId ? (
                                                <div className="confirmacao-revogacao">
                                                    <p>
                                                        Revogar impede qualquer uso futuro deste código. Deseja continuar?
                                                    </p>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            className="btn-revogar-confirmar"
                                                            onClick={() => handleRevogar(coleta.collectionId)}
                                                            disabled={revogando === coleta.collectionId}
                                                        >
                                                            {revogando === coleta.collectionId ? "Revogando..." : "Sim, revogar"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-secundario"
                                                            onClick={() => setConfirmandoRevogacao(null)}
                                                            disabled={revogando === coleta.collectionId}
                                                        >
                                                            Manter ativa
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-revogar-coleta"
                                                    onClick={() => setConfirmandoRevogacao(coleta.collectionId)}
                                                >
                                                    Revogar código
                                                </button>
                                            ))}

                                        <button
                                            type="button"
                                            className="btn-recebimentos-coleta"
                                            onClick={() => alternarRecebimentos(coleta)}
                                            disabled={carregandoRecebimentos === coleta.collectionId}
                                        >
                                            {carregandoRecebimentos === coleta.collectionId
                                                ? "Carregando recebimentos..."
                                                : coletaAberta === coleta.collectionId
                                                  ? "Ocultar recebimentos"
                                                  : "Ver recebimentos"}
                                        </button>

                                        {coletaAberta === coleta.collectionId &&
                                            caixasPorColeta[coleta.collectionId] && (
                                                <section className="caixa-recebimentos-coleta">
                                                    <div className="resumo-recebimentos-coleta">
                                                        <strong>
                                                            {caixasPorColeta[coleta.collectionId].totalParticipantes} alunos
                                                        </strong>
                                                        <span>
                                                            {caixasPorColeta[coleta.collectionId].totalPendentes} pendentes • {caixasPorColeta[coleta.collectionId].totalImportadas} no histórico
                                                        </span>
                                                    </div>

                                                    {caixasPorColeta[coleta.collectionId].recebimentos.length === 0 ? (
                                                        <p className="recebimentos-vazios">
                                                            Nenhuma sessão foi recebida nesta coleta.
                                                        </p>
                                                    ) : (
                                                        <div className="lista-recebimentos-coleta">
                                                            {caixasPorColeta[coleta.collectionId].recebimentos.map((recebimento) => (
                                                                <article key={recebimento.participantRef}>
                                                                    <header>
                                                                        <div>
                                                                            <h4>{recebimento.displayName}</h4>
                                                                            <small>
                                                                                {recebimento.resolutionStatus === "resolved"
                                                                                    ? `Aluno confirmado: ${recebimento.resolvedStudent?.name || "cadastro selecionado"}`
                                                                                    : "Cadastro pendente de revisão"}
                                                                            </small>
                                                                        </div>
                                                                        <div className="acoes-recebimento-aluno">
                                                                            <span>{recebimento.totalSessoes} sessões</span>
                                                                            {recebimento.resolutionStatus === "resolved" && recebimento.sessoes.some((item) => item.status === "pending") && (
                                                                                <button type="button" disabled={Boolean(importandoParticipante)} onClick={() => adicionarAoHistorico(coleta, recebimento)}>
                                                                                    {importandoParticipante === recebimento.participantRef ? "Adicionando..." : "Adicionar sessões ao histórico"}
                                                                                </button>
                                                                            )}
                                                                            {recebimento.resolutionStatus !== "resolved" && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => abrirRevisaoParticipante(recebimento)}
                                                                                >
                                                                                    Revisar aluno
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </header>
                                                                    {resultadoImportacao[recebimento.participantRef] && (
                                                                        <p
                                                                            role="status"
                                                                            className={`aviso-importacao-coleta aviso-importacao-coleta--${resultadoImportacao[recebimento.participantRef].tipo}`}
                                                                        >
                                                                            {resultadoImportacao[recebimento.participantRef].mensagem}
                                                                        </p>
                                                                    )}
                                                                    {participanteEmRevisao === recebimento.participantRef && (
                                                                        <div className="revisao-participante-coleta">
                                                                            <label>
                                                                                Associar a um aluno da turma
                                                                                <select
                                                                                    value={alunoSelecionado}
                                                                                    onChange={(evento) => setAlunoSelecionado(evento.target.value)}
                                                                                >
                                                                                    <option value="">Selecione o aluno</option>
                                                                                    {(alunosPorTurma[String(obterId(coleta.groupId))] || []).map((aluno) => (
                                                                                        <option key={aluno._id} value={aluno._id}>
                                                                                            {aluno.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => resolverParticipante(coleta, recebimento, false)}
                                                                                    disabled={resolvendoParticipante === recebimento.participantRef}
                                                                                >
                                                                                    Confirmar aluno existente
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn-criar-aluno-coleta"
                                                                                    onClick={() => resolverParticipante(coleta, recebimento, true)}
                                                                                    disabled={resolvendoParticipante === recebimento.participantRef}
                                                                                >
                                                                                    Criar “{recebimento.displayName}” nesta turma
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn-cancelar-revisao"
                                                                                    onClick={() => setParticipanteEmRevisao(null)}
                                                                                    disabled={resolvendoParticipante === recebimento.participantRef}
                                                                                >
                                                                                    Cancelar
                                                                                </button>
                                                                            </div>
                                                                            <small>
                                                                                Esta confirmação ainda não importa as sessões. Ela apenas define o cadastro correto do aluno.
                                                                            </small>
                                                                        </div>
                                                                    )}
                                                                    <ul>
                                                                        {recebimento.sessoes.map((sessao) => (
                                                                            <li key={sessao.receiptId}>
                                                                                <div>
                                                                                    <strong>{sessao.gameId}</strong>
                                                                                    <small>{formatarData(sessao.receivedAt)}</small>
                                                                                    <small>{sessao.status === "imported" ? "Adicionada ao histórico" : sessao.status === "rejected" ? "Recusada" : "Pendente"}</small>
                                                                                    {resultadoImportacao[sessao.receiptId] && <small role="alert">{resultadoImportacao[sessao.receiptId]}</small>}
                                                                                </div>
                                                                                <span>{formatarDuracao(sessao.durationMs)}</span>
                                                                                <span>{sessao.totalCliques} cliques</span>
                                                                                <span>{sessao.totalPontosMovimento} movimentos</span>
                                                                                <span>{sessao.totalPontosArraste} arrastes</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </article>
                                                            ))}
                                                        </div>
                                                    )}
                                                </section>
                                            )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {codigoGerado && modoApresentacao && (
                <div
                    className="apresentacao-coleta"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="titulo-apresentacao-coleta"
                >
                    <button
                        type="button"
                        className="fechar-apresentacao-coleta"
                        onClick={() => setModoApresentacao(false)}
                        aria-label="Fechar modo de apresentação"
                    >
                        ×
                    </button>
                    <div className="conteudo-apresentacao-coleta">
                        <p className="marca-apresentacao-coleta">LUDUS Acompanha</p>
                        <h2 id="titulo-apresentacao-coleta">
                            {codigoGerado.coleta.title}
                        </h2>
                        <p className="turma-apresentacao-coleta">
                            {turmaDaColetaGerada?.name || "Turma selecionada"}
                        </p>
                        <p>Abra o LUDUS Observa e informe o código:</p>
                        <strong>{codigoGerado.codigo}</strong>
                        <ol>
                            <li>Digite seu nome completo.</li>
                            <li>Digite o código mostrado acima.</li>
                            <li>Aguarde a confirmação antes de começar.</li>
                        </ol>
                        <small>
                            Se houver estudantes com o mesmo nome, informe também
                            o sobrenome.
                        </small>
                    </div>
                </div>
            )}
        </div>
    );
}
