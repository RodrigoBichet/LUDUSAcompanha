import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Icone from "../components/shared/Icone";
import { useAuth } from "../contexts/AuthContext";
import "./Documentacao.css";

const urlPacoteSdk =
    "https://github.com/RodrigoBichet/LUDUS-Unity-SDK.git#main";
const urlDownloadSdk =
    "https://github.com/RodrigoBichet/LUDUS-Unity-SDK/archive/refs/heads/main.zip";

async function copiarTexto(texto) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
        return;
    }

    const campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.opacity = "0";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();
    document.execCommand("copy");
    campoTemporario.remove();
}

function TextoCopiavel({ texto, rotulo = "Copiar" }) {
    const [copiado, setCopiado] = useState(false);

    const copiar = async () => {
        try {
            await copiarTexto(texto);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1800);
        } catch {
            setCopiado(false);
        }
    };

    return (
        <span className="documentacao-texto-copiavel">
            <code>{texto}</code>
            <button type="button" onClick={copiar} aria-label={`${rotulo}: ${texto}`}>
                <Icone nome="copiar" tamanho={15} />
                <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
            </button>
        </span>
    );
}

function MidiaPreparada({ tipo = "imagem", titulo, descricao }) {
    return (
        <figure className={`documentacao-midia-preparada documentacao-midia-preparada--${tipo}`}>
            <div role="img" aria-label={`${titulo}. Conteúdo será adicionado posteriormente.`}>
                <Icone nome="imagem" tamanho={tipo === "video" ? 34 : 28} />
                {tipo === "video" && <span aria-hidden="true">▶</span>}
            </div>
            <figcaption>
                <strong>{titulo}</strong>
                <span>{descricao}</span>
                <small>{tipo === "video" ? "Espaço preparado para o vídeo do OBS" : "Envie o print para substituir esta marcação"}</small>
            </figcaption>
        </figure>
    );
}

const trilhas = [
    {
        id: "professor",
        titulo: "Para professores",
    },
    {
        id: "desenvolvedor",
        titulo: "Para desenvolvedores",
    },
];

export default function Documentacao({ publica = false }) {
    const { usuario } = useAuth();
    const [guiaAtivo, setGuiaAtivo] = useState(null);
    const trilhaPreferida = usuario
        ? usuario.role === "developer"
            ? "desenvolvedor"
            : "professor"
        : "desenvolvedor";
    const guiaSelecionado = guiaAtivo || trilhaPreferida;
    const trilhasOrdenadas = [...trilhas].sort((a) =>
        a.id === trilhaPreferida ? -1 : 1,
    );

    const seletorPerfil = (
        <nav
            className="documentacao-seletor-perfil"
            aria-label="Escolha do perfil da documentação"
        >
            <span>Escolha seu perfil para continuar:</span>
            <div>
                {trilhasOrdenadas.map((trilha) => (
                    <button
                        type="button"
                        key={trilha.id}
                        className={
                            trilha.id === guiaSelecionado ? "ativo" : ""
                        }
                        aria-pressed={trilha.id === guiaSelecionado}
                        onClick={() => setGuiaAtivo(trilha.id)}
                    >
                        <Icone
                            nome={
                                trilha.id === "professor"
                                    ? "pessoas"
                                    : "configuracao"
                            }
                            tamanho={18}
                        />
                        {trilha.titulo}
                        {!publica && trilha.id === trilhaPreferida && (
                            <small>Seu perfil</small>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );

    return (
        <div>
            {!publica && (
                <Header
                    titulo="Documentação do SDK LUDUS"
                    subtitulo="Guias para integrar o SDK Unity e acompanhar no dashboard as sessões recebidas por esse fluxo"
                />
            )}

            <div className="pagina-conteudo documentacao-conteudo">
                {publica && (
                    <header className="documentacao-cabecalho-publico">
                        <h1>Documentação do SDK LUDUS</h1>
                        <p>
                            Guias para integrar o SDK Unity e acompanhar no dashboard
                            as sessões recebidas por esse fluxo.
                        </p>
                    </header>
                )}

                <section className="documentacao-limites card" aria-labelledby="documentacao-limites-titulo">
                    <Icone nome="aviso" tamanho={24} />
                    <div>
                        <h2 id="documentacao-limites-titulo">Antes de começar</h2>
                        <p>
                            O LUDUS Acompanha oferece evidências parciais para apoiar
                            a observação e a mediação docente. Os registros não
                            constituem diagnóstico, classificação clínica, nota ou
                            medida conclusiva de aprendizagem.
                        </p>
                    </div>
                </section>

                <div className="documentacao-disponibilidade" role="status">
                    <span><strong>SDK Unity</strong> disponível</span>
                    <span><strong>LUDUS Observa</strong> em preparação</span>
                    <Link to="/privacidade">Privacidade e uso responsável</Link>
                </div>

                {seletorPerfil}

                <details id="privacidade-e-dados" className="documentacao-privacidade card">
                    <summary>
                        <span>
                            <strong>Privacidade e uso responsável</strong>
                            <small>Veja os cuidados antes de trabalhar com dados reais</small>
                        </span>
                    </summary>
                    <div className="documentacao-privacidade-grid">
                        <article>
                            <h3>Cadastros</h3>
                            <p>
                                Evite informações clínicas e contatos familiares.
                                A data de nascimento é opcional. Anotações devem se
                                limitar ao contexto pedagógico observado.
                            </p>
                        </article>
                        <article>
                            <h3>Telemetria</h3>
                            <p>
                                Registre somente as capacidades necessárias. Um dado
                                indisponível não pode ser inventado por inferência do
                                dashboard, do SDK ou do professor.
                            </p>
                        </article>
                        <article>
                            <h3>Capturas</h3>
                            <p>
                                Mantenha imagens desligadas por padrão. Quando forem
                                necessárias, defina finalidade, autorização, acesso e
                                anonimização antes da coleta.
                            </p>
                        </article>
                        <article>
                            <h3>Pesquisa e divulgação</h3>
                            <p>
                                Use dados fictícios em demonstrações e resultados
                                agregados na pesquisa. Revise prints, PDFs, JSONs e
                                logs antes de compartilhar.
                            </p>
                        </article>
                    </div>
                    <p className="documentacao-referencia">
                        O prazo de retenção e o procedimento institucional de
                        exclusão ainda precisam ser definidos antes da avaliação com
                        dados reais. Consulte também a {" "}
                        <Link to="/privacidade">página de privacidade e uso responsável</Link>.
                    </p>
                </details>

                {guiaSelecionado === "professor" && (
                <section id="guia-professor" className="documentacao-guia card">
                    <h2>Da preparação da turma à leitura dos resultados</h2>
                    <p className="documentacao-guia-resumo">
                        Este fluxo serve para uma aplicação real em sala ou no
                        laboratório de informática. Faça primeiro um teste com dados
                        fictícios para conhecer as telas.
                    </p>

                    <div className="documentacao-passos">
                        <article className="documentacao-passo">
                            <span>1</span>
                            <div>
                                <h3>Prepare o ambiente escolar</h3>
                                <p>
                                    Confirme a instituição, crie a turma e cadastre os
                                    alunos que participarão. O nome é obrigatório; a
                                    data de nascimento é opcional e só deve ser usada
                                    quando realmente necessária ao acompanhamento.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>2</span>
                            <div>
                                <h3>Crie uma coleta para a atividade</h3>
                                <p>
                                    Você não precisa cadastrar um novo jogo. Abra{" "}
                                    <strong>Coletas</strong>, escolha a turma,
                                    informe um nome fácil de reconhecer e defina o
                                    período de validade. Se souber quais jogos serão
                                    usados, selecione entre os que já foram
                                    disponibilizados na plataforma. No primeiro uso,
                                    ative a opção de reconhecer jogos durante a
                                    atividade: o cadastro será criado automaticamente
                                    quando a sessão recebida for adicionada ao histórico
                                    e poderá ser revisado depois em <strong>Meus jogos</strong>.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>3</span>
                            <div>
                                <h3>Mostre o código para a turma</h3>
                                <p>
                                    Cada aluno informa uma vez o próprio nome e o
                                    código temporário no jogo ou no capturador. O
                                    código identifica a coleta, não substitui a conta
                                    do professor e não deve ser reutilizado fora da
                                    atividade planejada.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>4</span>
                            <div>
                                <h3>Acompanhe os recebimentos</h3>
                                <p>
                                    No cartão da coleta, clique em <strong>Ver recebimentos</strong>.
                                    Participantes ainda não confirmados ficam pendentes: use
                                    <strong> Revisar aluno</strong> para associar o nome a um cadastro
                                    da turma ou criar um novo aluno. Depois da confirmação, clique em
                                    <strong> Adicionar sessões ao histórico</strong>. Só então os
                                    resultados passam a compor o perfil em <strong>Meus alunos</strong>.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>5</span>
                            <div>
                                <h3>Consulte os resultados com contexto</h3>
                                <p>
                                    Observe duração, cliques, arrastes, sequência de
                                    eventos, acertos e erros somente quando o jogo
                                    fornecer esses dados. Compare sessões e anotações
                                    com o que aconteceu durante a atividade; um número
                                    isolado não explica a causa de um comportamento.
                                </p>
                            </div>
                        </article>
                    </div>

                    <details className="documentacao-orientacoes-professor">
                        <summary>Orientações para aplicação real, colaboração e privacidade</summary>
                        <div className="documentacao-subsecoes">
                        <article>
                            <h3>Aplicação em vários computadores</h3>
                            <ul>
                                <li>Teste o jogo e a conexão em pelo menos um computador da escola.</li>
                                <li>Confirme que todos usam o mesmo código ainda válido.</li>
                                <li>Peça que cada aluno confira o próprio nome antes de conectar.</li>
                                <li>Mantenha a coleta aberta durante toda a atividade.</li>
                                <li>Ao terminar, confira os recebimentos e revogue o código.</li>
                            </ul>
                        </article>

                        <article>
                            <h3>Colaboração sem compartilhar senha</h3>
                            <p>
                                Em <strong>Colaborações</strong>, convide outra pessoa
                                pela conta dela e escolha somente as permissões
                                necessárias: gerenciar turmas e alunos, preparar
                                coletas ou visualizar resultados. O acesso pode ser
                                alterado ou revogado a qualquer momento.
                            </p>
                        </article>

                        <article>
                            <h3>Capturas visuais e privacidade</h3>
                            <p>
                                Capturas são opcionais e devem ser ativadas apenas
                                quando houver finalidade pedagógica e autorização
                                adequada. Elas aparecem somente para pessoas
                                autenticadas com acesso ao aluno. Não publique imagens
                                reais em artigos, slides ou repositórios sem
                                anonimização e validação do uso.
                            </p>
                        </article>
                        </div>
                    </details>

                    <details className="documentacao-duvidas">
                        <summary>O aluno jogou antes de eu revisar o nome. Perdi os dados?</summary>
                        <p>
                            Não. O recebimento fica associado ao participante da coleta
                            e pode ser revisado depois. Após a associação, as sessões
                            autorizadas passam a aparecer no perfil correto.
                        </p>
                    </details>
                    <details className="documentacao-duvidas">
                        <summary>O código foi exposto ou deixou de funcionar. O que faço?</summary>
                        <p>
                            Gere um novo código na própria coleta. Computadores já
                            conectados mantêm a credencial limitada da atividade; novos
                            acessos precisam usar o código substituto.
                        </p>
                    </details>
                    <details className="documentacao-duvidas">
                        <summary>Um indicador significa que o aluno tem uma dificuldade?</summary>
                        <p>
                            Não de forma conclusiva. O indicador sinaliza um padrão nos
                            registros daquela atividade e deve ser interpretado junto à
                            observação do professor, ao contexto e a outras evidências.
                        </p>
                    </details>
                </section>
                )}

                {guiaSelecionado === "desenvolvedor" && (
                <section id="guia-desenvolvedor" className="documentacao-guia card">
                    <h2>Do primeiro contato ao jogo integrado</h2>
                    <p className="documentacao-guia-resumo">
                        O LUDUS Acompanha reúne o SDK para Unity e o dashboard em um
                        único fluxo: o jogo registra as interações habilitadas e a
                        plataforma organiza as sessões para apoiar o acompanhamento
                        pedagógico. Nesta trilha, você valida todo o percurso com
                        dados fictícios antes de integrar o seu próprio jogo.
                    </p>

                    <div className="documentacao-sdk-conceito">
                        <div>
                            <h3>O que é o LUDUS SDK?</h3>
                            <p>
                                O SDK é o componente do LUDUS Acompanha instalado no
                                projeto Unity. Ele reúne scripts e assistentes que,
                                durante uma atividade,
                                registra somente os tipos de dados habilitados, como
                                cliques, trajetória e arrastes. O próprio jogo continua
                                responsável por suas regras, telas, acertos e erros.
                            </p>
                        </div>
                        <div className="documentacao-fluxo-dados" aria-label="Fluxo dos dados do SDK">
                            <span><Icone nome="unity" tamanho={18} />Jogo Unity</span>
                            <b aria-hidden="true">→</b>
                            <span><Icone nome="configuracao" tamanho={18} />SDK gera a sessão</span>
                            <b aria-hidden="true">→</b>
                            <span><Icone nome="api" tamanho={18} />API do LUDUS Acompanha</span>
                            <b aria-hidden="true">→</b>
                            <span><Icone nome="dashboard" tamanho={18} />Dashboard LUDUS Acompanha</span>
                        </div>
                        <p>
                            No dashboard, a sessão fica vinculada ao participante da
                            coleta e pode ser lida pelo professor como evidência parcial
                            da atividade. O SDK não altera o jogo e não produz
                            diagnóstico ou conclusão pedagógica sozinho.
                        </p>
                    </div>

                    <div className="documentacao-aviso-acesso">
                        <strong>Antes de começar:</strong> entre no LUDUS Acompanha
                        com uma conta de desenvolvedor. A área
                        <strong> Laboratório</strong> e as opções usadas na integração
                        aparecem somente depois do login. Este guia foi validado na
                        <strong> Unity 6.2 (6000.2.8f1)</strong>. Nessa versão, o caminho
                        de build é <strong>File &gt; Build Profiles</strong>, a plataforma
                        aparece como <strong>Web</strong> e sua ativação usa
                        <strong> Switch Profile</strong>. Em versões anteriores, você pode
                        encontrar <strong>Build Settings</strong>, <strong>WebGL</strong> e
                        <strong> Switch Platform</strong>; a função é equivalente, embora
                        nomes e posições possam variar.
                    </div>

                    <nav className="documentacao-atalhos-guia" aria-label="Atalhos do tutorial">
                        <a href="#tutorial-preparacao"><span>1–3</span>Preparar</a>
                        <a href="#configuracao-sdk-detalhada"><span>4–7</span>Configurar</a>
                        <a href="#tutorial-conectar"><span>8–10</span>Testar e conferir</a>
                        <a href="#integrar-jogo-real"><span>Depois</span>Jogo real</a>
                    </nav>

                    <article className="documentacao-tutorial-destaque">
                        <header className="documentacao-tutorial-cabecalho">
                            <span className="documentacao-tutorial-selo">Recomendado: comece aqui</span>
                            <h3>Tutorial em uma cena separada do seu jogo</h3>
                            <p>
                                O SDK cria <code>Assets/LUDUS/Tutorial/TutorialLudus.unity</code>.
                                Essa cena não modifica suas cenas existentes e usa apenas
                                dados fictícios. Nela você poderá testar configuração,
                                interações, envio e leitura no dashboard antes de tocar
                                nas cenas reais do seu projeto.
                            </p>
                        </header>

                        <MidiaPreparada
                            tipo="video"
                            titulo="Tutorial completo em vídeo"
                            descricao="Instalação, configuração, teste no Play e conferência da sessão no dashboard."
                        />

                        <div className="documentacao-tutorial-etapas">
                            <section className="documentacao-tutorial-fase" id="tutorial-preparacao">
                                <span>1</span>
                                <div>
                                    <h4>Prepare um ambiente fictício no dashboard</h4>
                                    <p>
                                        Na barra lateral, dentro de <strong>Laboratório</strong>,
                                        clique em <strong>Visão geral</strong>. Confirme se a tela
                                        já apresenta os cartões <strong>Ambiente — Laboratório
                                        LUDUS</strong>, <strong>Turma — Turma de teste</strong> e
                                        <strong> Alunos fictícios — 3</strong>.
                                    </p>
                                    <details className="documentacao-configuracao">
                                        <summary>Se o laboratório fictício ainda não existir</summary>
                                        <p>
                                        Caso esses dados ainda não existam, a própria Visão geral
                                        exibirá o botão <strong>Criar laboratório de testes</strong>.
                                        Clique nele e aguarde a criação automática da turma e dos
                                        alunos. Se os dados já aparecem, não é necessário recriá-los.
                                        O <strong>Laboratório LUDUS</strong> ocupa o lugar de uma
                                        instituição simulada e permanece separado das escolas reais.
                                        </p>
                                    </details>
                                    <p>
                                        Depois, volte à barra lateral e clique em
                                        <strong> Coletas de teste</strong>. Primeiro informe o
                                        <strong> título da sua coleta</strong> (por exemplo,
                                        <strong> Turma X — atividade das 10h</strong>); em seguida, escolha a
                                        <strong> Turma de teste</strong>, defina a validade, selecione
                                        <strong> Reconhecer jogos durante a atividade</strong> e gere
                                        o código temporário.
                                    </p>
                                    <div className="documentacao-dados-teste">
                                        <strong>Lembre-se destas duas informações:</strong>
                                        <ul>
                                            <li><strong>Nome do aluno:</strong> use <TextoCopiavel texto="Aluno teste 01" />, caso não tenha criado outro aluno fictício manualmente.</li>
                                            <li><strong>Código da coleta:</strong> use o código temporário gerado pelo sistema.</li>
                                        </ul>
                                        <p>
                                            É com esse nome e esse código que o jogo será conectado
                                            à coleta e enviará a sessão para o aluno correto no dashboard.
                                        </p>
                                    </div>
                                    <Link
                                        className="documentacao-link-acao"
                                        to={usuario ? "/laboratorio" : "/cadastro?perfil=developer"}
                                    >
                                        {usuario
                                            ? "Ir para o laboratório de testes"
                                            : "Criar conta para acessar o laboratório"}
                                    </Link>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>2</span>
                                <div>
                                    <h4>Instale o pacote na Unity</h4>
                                    <p>
                                        Abra <strong>Window &gt; Package Manager</strong>, clique
                                        em <strong>+</strong> e escolha <strong>Install package
                                        from git URL...</strong>. Cole o endereço abaixo e aguarde
                                        a Unity terminar a importação e a compilação.
                                    </p>
                                    <div className="documentacao-codigo-copiavel">
                                        <TextoCopiavel texto={urlPacoteSdk} rotulo="Copiar link" />
                                        <a href={urlDownloadSdk} download>
                                            Baixar ZIP do SDK
                                        </a>
                                    </div>
                                    <MidiaPreparada
                                        titulo="Print 1 — instalação pelo Package Manager"
                                        descricao="Enquadre o menu +, a opção Install package from git URL e o campo com o endereço colado."
                                    />
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>3</span>
                                <div>
                                    <h4>Crie a cena tutorial</h4>
                                    <p>
                                        Execute <strong>LUDUS &gt; Criar tutorial de teste do
                                        SDK</strong>. A Unity cria e abre a cena, o objeto
                                        <code> LUDUS SDK — Tutorial</code> e o asset
                                        <code> ConfiguracaoTutorialLudus</code>. Salve a cena. Esses
                                        arquivos ficam em <code>Assets/LUDUS/Tutorial/</code> e não
                                        substituem nenhuma cena existente.
                                    </p>
                                    <details className="documentacao-configuracao">
                                        <summary>Opcional — preparar a validação WebGL</summary>
                                        <div className="documentacao-tutorial-primeiro-build">
                                        <strong>Use somente a cena tutorial neste build de teste.</strong>
                                        <p>
                                            Agora que o pacote e a cena existem, abra
                                            <strong> File &gt; Build Profiles</strong>. Selecione
                                            <strong> Web</strong> e confirme que esse perfil está
                                            ativo. Se não estiver, clique em <strong>Switch
                                            Profile</strong> — algumas versões exibem
                                            <strong> Switch Platform</strong> — e aguarde a Unity
                                            terminar a troca, a importação e a compilação.
                                        </p>
                                        <p>
                                            No perfil Web, abra <strong>Open Scene List</strong>.
                                            Desmarque temporariamente as cenas do seu jogo, use
                                            <strong> Add Open Scenes</strong> com
                                            <code> TutorialLudus</code> aberta e deixe somente ela
                                            habilitada no índice 0. Não exclua as cenas originais.
                                        </p>
                                        <p>
                                            Esse isolamento permite testar todas as funcionalidades
                                            do tutorial sem interferir no fluxo do seu jogo. Ao final
                                            do roteiro, você será lembrado de retirar o tutorial e
                                            restaurar as cenas originais do seu jogo.
                                        </p>
                                        </div>
                                    </details>
                                </div>
                            </section>

                            <section
                                className="documentacao-tutorial-fase"
                                id="configuracao-sdk-detalhada"
                            >
                                <span>4</span>
                                <div>
                                    <h4>Conheça a configuração antes de executar</h4>
                                    <p>
                                        Selecione o objeto <code>LUDUS SDK — Tutorial</code> na
                                        <strong> Hierarchy</strong>. Os componentes desse objeto já
                                        foram criados, preenchidos e interligados automaticamente;
                                        não altere suas referências. No componente
                                        <strong> Ludus Session Controller</strong>, clique apenas na
                                        referência <code>ConfiguracaoTutorialLudus</code>. A Unity
                                        destacará o asset no painel <strong>Project</strong>; selecione
                                        esse asset para abrir a configuração que realmente será
                                        revisada. Se ele não for localizado automaticamente, percorra
                                        manualmente <strong>Assets &gt; LUDUS &gt; Tutorial</strong> e
                                        selecione <code>ConfiguracaoTutorialLudus</code>. É no
                                        Inspector desse asset que configuraremos o SDK para o tutorial.
                                    </p>
                                    <details className="documentacao-configuracao documentacao-detalhe-principal">
                                        <summary>Conferir todos os campos do Inspector</summary>
                                        <ol className="documentacao-inspector-sequencia">
                                        <li><strong>Identificação do jogo:</strong> mantenha <strong>Nome do jogo</strong> como <TextoCopiavel texto="Tutorial LUDUS" />. Esse será o nome apresentado no dashboard.</li>
                                        <li>
                                            <strong>Envio e cópia local:</strong> abra a lista
                                            <strong> Destino dos dados</strong> para conhecer os três
                                            fluxos e, neste primeiro teste, mantenha
                                            <strong> Enviar automaticamente ao LUDUS Acompanha</strong>.
                                            <ul className="documentacao-inspector-opcoes">
                                                <li><strong>Enviar automaticamente ao LUDUS Acompanha:</strong> envia ao dashboard ao encerrar e usa fallback local se houver falha.</li>
                                                <li><strong>Exportar JSON manualmente:</strong> gera um arquivo JSON no computador para você revisar e importar manualmente no dashboard.</li>
                                                <li><strong>Desenvolvimento: enviar e também baixar:</strong> executa os dois fluxos e deve ser usado apenas em testes técnicos.</li>
                                            </ul>
                                            O envio automático é o fluxo usado na prática com nome e
                                            código de coleta. Logo abaixo, mantenha marcada
                                            <strong> Guardar também uma cópia de segurança local</strong>.
                                            Essa cópia fica no
                                            armazenamento persistente da aplicação e é separada do
                                            JSON que o navegador pode baixar durante o jogo.
                                            <div className="documentacao-caminho-local">
                                                <strong>Onde encontrar a cópia local?</strong>
                                                <p>
                                                    O caminho exato é exibido no Console pela mensagem
                                                    <code> Sessão salva localmente</code>. No Editor ou
                                                    executável Windows, normalmente começa em
                                                    <code> %USERPROFILE%\AppData\LocalLow\&lt;Empresa&gt;\&lt;Jogo&gt;\ludus_offline</code>.
                                                    No macOS, costuma ficar em
                                                    <code> ~/Library/Application Support/&lt;Empresa&gt;/&lt;Jogo&gt;/ludus_offline</code>.
                                                    No WebGL, a cópia de segurança fica no armazenamento
                                                    interno do navegador; para obter um arquivo comum,
                                                    use a exportação manual. Ela nunca fica dentro da
                                                    pasta do projeto Unity.
                                                </p>
                                            </div>
                                        </li>
                                        <li><strong>Rótulo do arquivo (opcional):</strong> aparece somente nos modos que baixam JSON e acrescenta um texto ao nome do arquivo, por exemplo <code>tutorial-arraste</code>. É útil para diferenciar vários testes manuais, mas não altera a sessão no dashboard. Deixe vazio agora e nunca use nome ou dado pessoal.</li>
                                        <li><strong>Conexão com ambiente LUDUS (avançado):</strong> contém a origem oficial da API usada pelo envio automático e já vem preenchida. Mantenha a seção fechada; ela só precisa ser aberta para conferir ou trocar o ambiente, nunca para informar senha ou token.</li>
                                        <li>
                                            <strong>Cenas acompanhadas:</strong> abra
                                            <strong> Capturar automaticamente em</strong> para ver as
                                            opções. <strong>Todas as cenas</strong> registra as
                                            interações em qualquer cena habilitada no Build Profile.
                                            <strong> Somente cenas selecionadas</strong> permite
                                            arrastar para o asset apenas as cenas de atividade; nas
                                            demais, a sessão continua ativa, mas mouse e cliques ficam
                                            pausados. No tutorial, mantenha <strong>Todas as cenas</strong>:
                                            como o primeiro build terá somente <code>TutorialLudus</code>,
                                            apenas ela será acompanhada.
                                        </li>
                                        <li><strong>Coleta essencial:</strong> mantenha marcadas <strong>Cliques</strong>, <strong>Trajetória do mouse</strong> e <strong>Trajetória de arraste</strong>. Elas registram, respectivamente, acionamentos, percurso do ponteiro e o gesto completo de arrastar.</li>
                                        <li>
                                            <strong>Resultados informados pelo jogo:</strong> essas
                                            opções só declaram capacidades que o jogo realmente
                                            conectou à Ponte semântica, aos adaptadores ou à API C#.
                                            Na prática, o SDK registra cliques e movimentos sozinho,
                                            mas não consegue adivinhar que uma resposta foi correta,
                                            que uma fase terminou ou que o jogador trocou de categoria.
                                            O próprio jogo precisa informar esses significados ao SDK.
                                            <ul className="documentacao-inspector-opcoes">
                                                <li><strong>Categorias:</strong> use quando o jogo informa temas, dificuldades ou modos diferentes, como Iniciante, Intermediário, Difícil, Ação ou Filmes, conforme a organização do próprio jogo.</li>
                                                <li><strong>Eventos de fase:</strong> registra início e conclusão de fases ou rodadas reconhecidas pelo próprio jogo.</li>
                                                <li><strong>Acertos e erros:</strong> registra respostas avaliadas pela regra real do jogo; será habilitado mais adiante após conectarmos o botão.</li>
                                                <li><strong>Eventos personalizados:</strong> permite eventos contextuais criados pelo desenvolvedor para situações que não cabem nas opções anteriores.</li>
                                            </ul>
                                            No começo do tutorial, mantenha <strong>Categorias</strong>,
                                            <strong> Eventos de fase</strong> e <strong>Acertos e erros</strong>
                                            {" "}desmarcados. <strong>Eventos personalizados</strong> pode
                                            permanecer marcado como vem no asset. O SDK nunca deduz
                                            sozinho categoria, fase, acerto ou erro.
                                        </li>
                                        <li>
                                            <strong>Capturas visuais:</strong> marque
                                            <strong> Capturar imagem da tela</strong>. O dashboard
                                            poderá usar a Game View como fundo do mapa de interações,
                                            sobrepondo trajetórias, arrastes e cliques. Sem essa opção,
                                            o mapa continua funcionando, mas usa um fundo sólido.
                                            <ul className="documentacao-inspector-opcoes">
                                                <li><strong>Capturar após a primeira interação:</strong> mantenha marcado para evitar telas de carregamento. Desmarque somente se seu jogo chamar manualmente a API de captura em um momento estável específico.</li>
                                                <li><strong>Imagens automáticas nas cenas:</strong> funciona como a seleção de cenas explicada anteriormente, mas decide especificamente onde haverá uma imagem de fundo. Em um jogo real, prefira as cenas principais da atividade e deixe de fora menu, configurações, créditos e telas auxiliares: isso reduz o tamanho da sessão, evita poluir o dashboard e mantém o foco pedagógico. No tutorial, mantenha <strong>Todas as cenas acompanhadas</strong>.</li>
                                                <li><strong>Telas ou atividades dentro da cena:</strong> serve quando uma única cena possui Canvas, painéis ou atividades diferentes ativados em momentos distintos. A imagem continua sendo da Game View completa, mas recebe o contexto correto. Na etapa 5 começaremos marcando o laboratório inteiro como uma única área; no jogo real, você poderá separar os contextos internos que realmente precisar distinguir.</li>
                                            </ul>
                                            Como os dados do tutorial são fictícios, esta é uma
                                            demonstração segura. No jogo real, confirme finalidade,
                                            autorização e minimização antes de habilitar imagens.
                                        </li>
                                        <li><strong>Desenvolvimento:</strong> mantenha <strong>Exibir mensagens detalhadas no Console</strong> marcado durante todo o tutorial. Os logs ajudarão a localizar início, encerramento, envio e fallback.</li>
                                        </ol>
                                    </details>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>5</span>
                                <div>
                                    <h4>Adicione e marque as interações observáveis</h4>
                                    <p>
                                        Execute <strong>LUDUS &gt; Tutorial &gt; Adicionar exercício
                                        de interações</strong>. O assistente acrescenta à cena o
                                        objeto <code>LUDUS — Exercício de interações</code>, um
                                        laboratório didático com seis cenários navegáveis e uma
                                        tela final de orientação:
                                        interações automáticas, alternativas por botão, arraste
                                        com destino, contato por física, meta por valor e ciclo de
                                        categoria/fase. Ele também cria o <code>EventSystem</code>
                                        quando necessário, sem alterar suas cenas originais. Se a
                                        versão antiga do exercício já existir, a Unity pedirá sua
                                        confirmação antes de recriar somente esse objeto tutorial.
                                    </p>
                                    <p>
                                        Na Hierarchy, expanda <code>LUDUS — Exercício de
                                        interações &gt; Painel do exercício &gt; 01 — Interações
                                        automáticas</code>. Localize <code>BotaoTutorial</code>,
                                        <code> CampoTextoTutorial</code> e, dentro de
                                        <code> Área de arraste livre</code>, o filho
                                        <code> PecaArrastavelTutorial</code>. É importante escolher
                                        a peça que realmente se move, não apenas o contêiner visual.
                                        Se quiser enquadrar rapidamente todo o exercício na aba
                                        <strong> Scene</strong>, dê dois cliques no objeto
                                        <code> LUDUS — Exercício de interações</code> na Hierarchy.
                                    </p>
                                    <p>
                                        Agora abra <strong>LUDUS &gt; Configurar interações desta
                                        cena</strong>. A Unity exibirá a janela
                                        <strong> Interações LUDUS</strong>. Arraste os três objetos
                                        da Hierarchy, um de cada vez, para o campo
                                        <strong> Arraste um objeto aqui</strong> —
                                        <code> BotaoTutorial</code>, <code>CampoTextoTutorial</code> e
                                        <code> PecaArrastavelTutorial</code> (<strong>Área de arraste
                                        livre &gt; PecaArrastavelTutorial</strong>). Esse é o mesmo
                                        procedimento que será usado depois com botões, campos,
                                        imagens, peças arrastáveis e objetos clicáveis das cenas do
                                        seu projeto.
                                    </p>
                                    <MidiaPreparada
                                        titulo="Print 2 — janela Interações LUDUS"
                                        descricao="Mostre a Hierarchy e os três itens já separados em botão, campo e objeto arrastável."
                                    />
                                    <div className="documentacao-dialogos-unity">
                                        <details>
                                            <summary>Se aparecer “Como este objeto funciona no jogo?”</summary>
                                            <p>
                                                O item não é um botão ou campo reconhecido
                                                automaticamente. Escolha <strong>Objeto
                                                arrastável</strong> somente quando ele recebe e
                                                acompanha o gesto; escolha <strong>Objeto
                                                clicável</strong> quando apenas reage ao clique.
                                                Use <strong>Cancelar</strong> se selecionou o objeto
                                                errado. A aparência sozinha não permite ao SDK
                                                decidir essa função.
                                            </p>
                                        </details>
                                        <details>
                                            <summary>Se o SDK avisar que o arrastável parece ser um filho</summary>
                                            <p>
                                                Isso ocorre, por exemplo, ao arrastar
                                                <code> Área de arraste</code> em vez da peça. Use
                                                <strong> Usar o filho</strong> para acompanhar
                                                <code> PecaArrastavelTutorial</code>, que realmente
                                                se move. Use <strong>Usar o contêiner mesmo</strong>
                                                apenas quando o próprio contêiner recebe o gesto no
                                                seu jogo; ou cancele para revisar a Hierarchy.
                                            </p>
                                        </details>
                                        <details>
                                            <summary>Depois que os três itens forem adicionados</summary>
                                            <p>
                                                A janela separa botões, campos e objetos
                                                arrastáveis. Em cada item, edite
                                                <strong> Nome exibido no dashboard</strong>: esse é
                                                o texto que aparecerá no site, independentemente do
                                                nome técnico da Hierarchy. No campo de texto, o SDK
                                                registra somente conclusão, quantidade de caracteres
                                                e estado vazio — nunca o conteúdo digitado, protegendo
                                                a privacidade e evitando guardar textos que a pessoa
                                                possa escrever. Na peça,
                                                <strong> Movimento mínimo</strong> diferencia um
                                                clique curto de um arraste; mantenha 5 pixels no
                                                tutorial. Use <strong>Trocar função</strong> somente
                                                se tiver classificado o objeto incorretamente.
                                            </p>
                                        </details>
                                    </div>
                                    <p>
                                        Agora pode fechar a janela <strong>Interações LUDUS</strong>.
                                        Para entender o próximo comando, encare o objeto-raiz
                                        <code> LUDUS — Exercício de interações</code> como o laboratório
                                        completo: ele reúne as seis páginas e todos os elementos que
                                        aparecem para o jogador. É a esse objeto que vamos associar
                                        primeiro um único contexto de observação.
                                    </p>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>6</span>
                                <div>
                                    <h4>Marque o contexto de observação</h4>
                                    <p>
                                        Selecione novamente o objeto
                                        <code> LUDUS — Exercício de interações</code> na Hierarchy e aplique
                                        <strong> GameObject &gt; LUDUS &gt; Marcar como área de
                                        observação</strong>. Esse comando diz ao SDK que aquele
                                        objeto-raiz (<code>LUDUS — Exercício de interações</code>)
                                        representa uma tela ou atividade específica
                                        dentro da cena, agrupando sob o mesmo nome as interações
                                        realizadas enquanto ele estiver ativo.
                                    </p>
                                    <details className="documentacao-configuracao">
                                        <summary>Conferir os campos da Área de observação LUDUS</summary>
                                        <div className="documentacao-area-observacao">
                                        <h5>Confira o componente Área de observação LUDUS</h5>
                                        <p>
                                            Depois do comando, o novo componente ficará visível no
                                            Inspector do objeto. Use os campos assim:
                                        </p>
                                        <ul>
                                            <li><strong>Iniciar ao ativar este objeto:</strong> começa o recorte quando <code>LUDUS — Exercício de interações</code> é habilitado e passa a representar a atividade visível. <strong>Deixe marcado no tutorial.</strong></li>
                                            <li><strong>Encerrar ao desativar este objeto:</strong> encerra o recorte quando esse objeto é desabilitado e sua atividade deixa de estar visível. <strong>Deixe marcado no tutorial.</strong></li>
                                            <li><strong>Título exibido no acompanhamento:</strong> nome que aparecerá no dashboard; vazio usa o nome do GameObject. No tutorial, informe <TextoCopiavel texto="Exercício de interações" />.</li>
                                            <li><strong>Tipo deste recorte:</strong> identifica se o objeto representa uma cena, um Canvas, uma atividade ou outro contexto. No tutorial, selecione <strong>Canvas</strong>.</li>
                                            <li><strong>Objetivo deste recorte:</strong> descrição opcional do que acontece nessa parte do jogo. No tutorial, você pode escrever <TextoCopiavel texto="Experimentar botão, campo de texto e arraste" />.</li>
                                            <li><strong>Usar este recorte como fundo do mapa:</strong> permite associar a captura visual dessa atividade ao mapa de interações. <strong>Deixe marcado no tutorial.</strong></li>
                                            <li><strong>Objeto controlador LUDUS SDK:</strong> normalmente fica vazio, pois o componente localiza automaticamente a única base LUDUS. <strong>Deixe vazio no tutorial</strong> e preencha manualmente somente em um teste técnico com mais de uma base.</li>
                                        </ul>
                                        <p>
                                            Neste ponto, o objeto-raiz
                                            <code> LUDUS — Exercício de interações</code> agrupa o laboratório inteiro em
                                            um contexto. Em um jogo real, você também pode marcar
                                            separadamente os objetos-raiz de minijogos, Canvas ou painéis
                                            que aparecem em momentos distintos. Cada um abrirá e encerrará
                                            seu próprio contexto no dashboard. Se a cena inteira representa
                                            uma única atividade, a marcação interna é opcional. A captura
                                            continua sendo da Game View completa: o recorte organiza o
                                            momento e o contexto, mas não corta fisicamente a imagem.
                                        </p>
                                        </div>
                                    </details>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>7</span>
                                <div>
                                    <h4>Registre um resultado conhecido pelo jogo</h4>
                                    <div className="documentacao-ponte-explicacao">
                                        <h5>Como a Ponte semântica participa destes cenários</h5>
                                        <p>
                                            A <strong>Ponte semântica do jogo</strong> informa ao LUDUS
                                            Acompanha qual é o objetivo da atividade e como interpretar regras
                                            que somente o próprio jogo conhece. Ela não inventa acertos, erros,
                                            categorias ou fases: apenas encaminha as decisões produzidas pelo
                                            jogo e pelos adaptadores.
                                        </p>
                                        <p>
                                            Ao adicionar um adaptador, a Unity cria e preenche a Ponte
                                            automaticamente quando necessário, ou reutiliza a que já existe.
                                            Na maioria dos cenários, você apenas confere seus campos. Abra as
                                            situações abaixo para entender quando será necessário personalizá-la.
                                        </p>
                                        <div className="documentacao-ponte-casos">
                                            <details>
                                                <summary>Quando não preciso alterar a Ponte?</summary>
                                                <p>
                                                    Em resultados de botão, arraste por tag, contato por tag e
                                                    meta por valor, o adaptador já envia os dados específicos.
                                                    Mantenha a Ponte habilitada e preserve os valores padrão.
                                                </p>
                                            </details>
                                            <details>
                                                <summary>Quando preciso preencher categoria e fase?</summary>
                                                <p>
                                                    Quando o jogo possui categorias, fases ou objetivos próprios,
                                                    informe esses campos e conecte os eventos reais que selecionam
                                                    a categoria, iniciam a fase e concluem a atividade.
                                                </p>
                                            </details>
                                            <details>
                                                <summary>Quando preciso chamar a Ponte diretamente?</summary>
                                                <p>
                                                    Quando nenhuma regra cabe nos adaptadores prontos, o evento
                                                    que o jogo já usa pode chamar os métodos públicos da Ponte.
                                                    Isso é útil para regras personalizadas, sem transferir a
                                                    decisão pedagógica para o SDK.
                                                </p>
                                            </details>
                                        </div>
                                    </div>
                                    <p>
                                        Na <strong>Hierarchy</strong>, expanda
                                        <code> LUDUS — Exercício de interações &gt; Painel do
                                        exercício &gt; 02 — Resultados por botão</code>. Comece pelo
                                        objeto <code>BotaoCorretoTutorial</code>. No fim do Inspector,
                                        clique em <strong>Add Component</strong> e navegue, sem usar
                                        a busca, por <strong>LUDUS &gt; Adaptadores &gt; Resultado de
                                        botão</strong>.
                                    </p>
                                    <div className="documentacao-resultados-opcoes">
                                        <details className="documentacao-resultado-opcao">
                                            <summary>Botão correto ou incorreto — faça este no tutorial</summary>
                                            <p>
                                                Ao adicionar <strong>Resultado de botão</strong>, a Unity
                                                também adiciona automaticamente <strong>Ponte semântica do
                                                jogo</strong>. O primeiro componente guarda o contexto geral;
                                                o segundo escuta o clique e informa o resultado sem remover
                                                as ações que o botão já possuía.
                                            </p>
                                            <h5>Resultado de botão</h5>
                                            <ul>
                                                <li><strong>Acompanhar esta alternativa:</strong> ativa o adaptador. Deixe marcado.</li>
                                                <li><strong>Resultado desta alternativa:</strong> escolha <strong>Correto</strong>.</li>
                                                <li><strong>Resposta exibida no Dashboard:</strong> é o nome da opção escolhida que aparecerá na sessão. Neste botão, informe <TextoCopiavel texto="2" />. No seu jogo, troque pelo texto correspondente à alternativa acionada.</li>
                                                <li><strong>Resposta esperada no Dashboard:</strong> identifica qual opção deveria ter sido escolhida. Informe também <strong>2</strong>.</li>
                                                <li><strong>Avisar falhas no Console:</strong> deixe marcado enquanto estiver integrando.</li>
                                                <li><strong>Botão observado</strong> e <strong>Ponte semântica:</strong> são preenchidos automaticamente e aparecem somente para conferência.</li>
                                            </ul>
                                            <p>
                                                Repita o mesmo caminho no objeto
                                                <code> BotaoIncorretoTutorial</code>, começando novamente
                                                em <strong>Add Component &gt; LUDUS &gt; Adaptadores &gt;
                                                Resultado de botão</strong>. Desta vez, escolha
                                                <strong> Incorreto</strong>, informe
                                                <strong> 3</strong> como resposta exibida
                                                e mantenha <strong>2</strong> como resposta
                                                esperada. Assim, se o segundo botão for acionado, o
                                                dashboard mostrará exatamente o que foi escolhido e qual
                                                opção deveria ter sido selecionada.
                                            </p>
                                            <p>
                                                A tarefa visual agora possui duas opções. Na Hierarchy,
                                                siga <strong>LUDUS — Exercício de interações &gt; Painel do
                                                exercício &gt; 02 — Resultados por botão</strong>. Selecione
                                                <code> ImagemUmaFormaTutorial</code>, que representa a opção
                                                incorreta, e repita desde <strong>Add Component &gt; LUDUS &gt;
                                                Adaptadores &gt; Resultado de botão</strong>. Escolha
                                                <strong> Incorreto</strong>, informe <TextoCopiavel texto="Uma forma" />{" "}
                                                como resposta exibida e <TextoCopiavel texto="Duas formas" /> como
                                                resposta esperada.
                                            </p>
                                            <p>
                                                Em seguida, no mesmo caminho da Hierarchy, selecione
                                                <code> ImagemDuasFormasTutorial</code>. Adicione o mesmo
                                                adaptador, escolha <strong>Correto</strong> e use
                                                <strong> Duas formas</strong> como resposta exibida e esperada.
                                                As duas imagens do tutorial possuem <code>Button</code>, por
                                                isso podem usar esse adaptador sem perder as ações existentes.
                                                Em um jogo real, uma imagem sem <code>Button</code> pode ter o
                                                clique observado, mas o resultado deverá vir da regra
                                                personalizada que realmente avalia a ação.
                                            </p>
                                            <p>
                                                Depois de configurar os dois botões e as duas imagens, no painel
                                                <strong> Project</strong>, abra
                                                <strong> Assets &gt; LUDUS &gt; Tutorial</strong> e clique no
                                                asset <code>ConfiguracaoTutorialLudus</code>. Com o asset
                                                aberto no Inspector, habilite <strong>Acertos e erros</strong>.
                                                Essa capacidade só deve ser marcada porque agora existe um
                                                componente que informa ao SDK a regra real daquele botão.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Imagine a pergunta “Quanto é 4 + 4?” com as alternativas
                                                    “6”, “8” e “10”. Cada alternativa aparece em um botão que o
                                                    jogo já avalia. Configure o botão “8” como correto e os
                                                    botões “6” e “10” como incorretos. Assim, o SDK recebe a
                                                    semântica que o próprio jogo conhece e o dashboard consegue
                                                    mostrar qual alternativa foi escolhida, qual era a esperada
                                                    e quantos acertos e erros ocorreram, sem alterar o feedback
                                                    ou a troca de perguntas do jogo.
                                                </p>
                                            </details>
                                        </details>

                                        <details className="documentacao-resultado-opcao">
                                            <summary>Peça arrastável com área correta — faça este no tutorial</summary>
                                            <p>
                                                Na Hierarchy, expanda <code>LUDUS — Exercício de
                                                interações &gt; Painel do exercício &gt; 03 — Arraste com
                                                destino &gt; Área do cenário de arraste</code>. A peça
                                                <code> PecaCorretaTutorial</code> já usa a tag exclusiva
                                                <strong> LARespostaCorretaTutorial</strong>;
                                                <code> PecaIncorretaTutorial</code> permanece
                                                <strong> Untagged</strong>. A tag identifica, para a regra
                                                desse cenário, qual peça o destino deve considerar correta. O
                                                componente <strong>Resultado de arraste por tag</strong> fica
                                                no destino, recebe o <code>OnDrop</code>, compara a tag da peça
                                                solta com a tag escolhida e pede à Ponte semântica que registre
                                                tentativa, acerto ou erro. Ele não movimenta a peça nem cria a
                                                lógica do quebra-cabeça.
                                            </p>
                                            <p>
                                                Agora, seguindo a mesma hierarquia, selecione
                                                <code> DestinoArrasteTutorial</code> e adicione somente
                                                <strong> Add Component &gt; LUDUS &gt; Adaptadores &gt;
                                                Resultado de arraste por tag</strong>. A Unity adicionará ou
                                                reutilizará automaticamente a <strong>Ponte semântica do
                                                jogo</strong>. O adaptador fica no destino que recebe o drop,
                                                não nas peças que se movem.
                                            </p>
                                            <ul>
                                                <li><strong>Acompanhar este destino:</strong> deixe marcado.</li>
                                                <li><strong>Tag considerada correta:</strong> escolha <strong>LARespostaCorretaTutorial</strong>, criada automaticamente pelo gerador.</li>
                                                <li><strong>Nome do destino no Dashboard:</strong> informe <TextoCopiavel texto="Área de destino do tutorial" />.</li>
                                                <li><strong>Resposta esperada no Dashboard:</strong> informe <TextoCopiavel texto="Peça correta do tutorial" />.</li>
                                                <li><strong>Registrar tentativa de arraste</strong> e <strong>Registrar acerto ou erro:</strong> deixe os dois marcados.</li>
                                                <li><strong>Avisar falhas no Console:</strong> deixe marcado durante o tutorial.</li>
                                                <li><strong>Ponte semântica compartilhada:</strong> já aparece preenchida com a Ponte do próprio <code>DestinoArrasteTutorial</code>. Apenas confira a referência; não é necessário arrastá-la manualmente.</li>
                                            </ul>
                                            <p>
                                                Esse caminho exige um arraste de interface que use o
                                                EventSystem e entregue a peça em <code>OnDrop</code>. O
                                                componente didático libera o raycast da peça enquanto ela
                                                se move para que o destino receba o evento. No jogo real,
                                                a movimentação e a resposta visual continuam sendo
                                                responsabilidade do próprio jogo.
                                                No laboratório, a tentativa incorreta mostra o feedback e
                                                devolve a peça à origem. Quando a resposta está correta, a peça
                                                permanece encaixada e bloqueada no destino para confirmar
                                                visualmente a conclusão do cenário.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Em uma atividade de associação, peças com a tag
                                                    <code> AnimalAquatico</code> podem ser soltas no destino
                                                    “Ambiente aquático”. O jogo continua responsável por mover
                                                    e encaixar as peças; o adaptador apenas registra se a tag da
                                                    peça entregue corresponde à regra do destino.
                                                </p>
                                            </details>
                                        </details>

                                        <details className="documentacao-resultado-opcao">
                                            <summary>Contato por trigger ou colisão — faça este no tutorial</summary>
                                            <p>
                                                Na Hierarchy, expanda
                                                <code> 04 — Contato por física &gt; Área do cenário de
                                                contato</code>. O gerador já deixou as duas peças com
                                                <code> Rigidbody2D</code> e <code>BoxCollider2D</code>; o
                                                objeto <code>DestinoContatoTutorial</code> já possui um
                                                <code> BoxCollider2D</code> marcado como trigger. Esses
                                                componentes existem para que o contato 2D aconteça de verdade,
                                                mas ainda não há nenhuma interpretação de acerto ou erro.
                                            </p>
                                            <p>
                                                Selecione <code>DestinoContatoTutorial</code> na Hierarchy e
                                                adicione <strong>Add Component &gt; LUDUS &gt; Adaptadores &gt;
                                                Resultado de contato por tag</strong>. A Unity acrescentará
                                                também a <strong>Ponte semântica do jogo</strong> exigida pelo
                                                adaptador. Configure o componente de contato assim:
                                            </p>
                                            <ul>
                                                <li><strong>Acompanhar este contato:</strong> deixe marcado.</li>
                                                <li><strong>Tipo de contato:</strong> escolha <strong>Trigger 2D</strong>, pois o destino tutorial usa <code>Is Trigger</code>.</li>
                                                <li><strong>Tag considerada correta:</strong> escolha <strong>LARespostaCorretaTutorial</strong>.</li>
                                                <li><strong>Procurar tag nos objetos pais:</strong> deixe marcado; isso ajuda quando o Collider está em um filho e a identidade da peça está no objeto-raiz.</li>
                                                <li><strong>Resposta esperada no Dashboard:</strong> informe <TextoCopiavel texto="Peça de contato correta" />.</li>
                                                <li><strong>Avisar falhas no Console:</strong> deixe marcado durante a integração.</li>
                                                <li><strong>Ponte semântica:</strong> aparece preenchida automaticamente e somente para conferência.</li>
                                            </ul>
                                            <p>
                                                No jogo real, escolha entre Trigger/Colisão e 2D/3D conforme a
                                                física que o jogo já utiliza. O SDK apenas escuta o callback:
                                                Colliders, Rigidbody, layers, matriz de colisão, movimento e
                                                resposta visual continuam sob responsabilidade do jogo.
                                                No laboratório, o contato também mostra o feedback e devolve
                                                as peças à origem para impedir duas ocupações simultâneas da zona.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Imagine uma atividade em que o jogador conduz um animal até
                                                    seu habitat. A área “Oceano” é um trigger 2D e a peça
                                                    “Golfinho” possui a tag <code>AnimalAquatico</code>. Quando
                                                    ela entra na área, o adaptador registra o acerto; se a peça
                                                    “Leão”, com outra tag, tocar o mesmo destino, registra o erro.
                                                    Use Trigger ou Colisão, 2D ou 3D, conforme o contato que a
                                                    lógica do jogo já recebe.
                                                </p>
                                            </details>
                                        </details>

                                        <details className="documentacao-resultado-opcao">
                                            <summary>Meta de pontuação ou progresso — faça este no tutorial</summary>
                                            <p>
                                                Na Hierarchy, selecione
                                                <code> 05 — Meta por valor &gt; ControladorMetaTutorial</code>.
                                                Adicione <strong>Add Component &gt; LUDUS &gt; Adaptadores &gt;
                                                Meta por valor ou pontuação</strong>. A Ponte semântica será
                                                adicionada automaticamente. O controlador didático já cuida dos
                                                três botões e da contagem visual; quando encontra o adaptador no
                                                mesmo objeto, também repassa cada novo valor a ele.
                                            </p>
                                            <ul>
                                                <li><strong>Acompanhar esta meta:</strong> deixe marcado.</li>
                                                <li><strong>Valor inicial:</strong> use <strong>0</strong>.</li>
                                                <li><strong>Valor da meta:</strong> use <TextoCopiavel texto="3" />.</li>
                                                <li><strong>Condição da meta:</strong> escolha <strong>Maior ou igual</strong>.</li>
                                                <li><strong>Ao atingir a meta:</strong> escolha <strong>Registrar acerto</strong>.</li>
                                                <li><strong>Nome exibido no Dashboard:</strong> informe <TextoCopiavel texto="Meta de 3 pontos" />.</li>
                                                <li><strong>Registrar somente uma vez:</strong> deixe marcado para não repetir o resultado a cada ponto seguinte.</li>
                                                <li><strong>Avisar falhas no Console:</strong> deixe marcado.</li>
                                            </ul>
                                            <p>
                                                No jogo real, o SDK não procura a variável do placar. O evento
                                                que já altera pontos, progresso, itens coletados ou tempo deve
                                                chamar <code>Adicionar</code>, <code>SubtrairUm</code>,
                                                <code> DefinirValor</code> ou <code>AvaliarAgora</code> no
                                                adaptador. Assim, a mesma regra que o jogo usa continua sendo a
                                                fonte da verdade.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Se a atividade termina ao coletar cinco estrelas, configure
                                                    a meta como 5 e faça o evento de coleta chamar
                                                    <code> AdicionarUm</code>. O adaptador registra o resultado
                                                    quando o quinto item eleva o valor até a meta.
                                                </p>
                                            </details>
                                        </details>

                                        <details className="documentacao-resultado-opcao">
                                            <summary>Categoria e ciclo de fase — faça este no tutorial</summary>
                                            <p>
                                                Na Hierarchy, selecione
                                                <code> ControladorFluxoSemanticoTutorial</code>.
                                                Adicione <strong>Add Component &gt; LUDUS &gt; Ponte semântica
                                                do jogo</strong>. Essa página demonstra eventos que não podem
                                                ser deduzidos por aparência: somente o jogo sabe quando uma
                                                categoria foi escolhida ou uma fase realmente começou e terminou.
                                            </p>
                                            <p>
                                                No Play, esse cenário apresenta um pequeno ciclo guiado. Apenas
                                                a ação atual fica habilitada: escolher o desafio, começar a
                                                atividade, informar o resultado e concluir. A linha de progresso
                                                troca cada círculo por uma confirmação conforme você avança.
                                                Os textos visíveis tornam o exercício mais natural, enquanto os
                                                nomes técnicos dos GameObjects abaixo continuam sendo usados para
                                                configurar os eventos no Inspector.
                                            </p>
                                            <ul>
                                                <li><strong>Nome da categoria:</strong> informe <TextoCopiavel texto="Categoria tutorial" />.</li>
                                                <li><strong>Identificador da fase:</strong> informe <TextoCopiavel texto="fase-tutorial-1" />.</li>
                                                <li><strong>Objetivo ou destino:</strong> informe <TextoCopiavel texto="Concluir o fluxo guiado" />.</li>
                                                <li><strong>Opções apresentadas:</strong> pode permanecer vazio neste cenário, pois os botões representam etapas, não alternativas de resposta.</li>
                                                <li><strong>Item ou resposta informada</strong> e <strong>esperada:</strong> informe <TextoCopiavel texto="Ação tutorial" /> nos dois campos.</li>
                                                <li>
                                                    <strong>Estrelas ao concluir:</strong> é um valor opcional
                                                    para jogos que já concedem estrelas, medalhas ou outra
                                                    pontuação ao terminar uma fase. Ele acompanha o evento de
                                                    conclusão no dashboard; não representa nota, diagnóstico ou
                                                    medida conclusiva de aprendizagem. Neste tutorial, use
                                                    <strong> 1</strong> apenas como valor fictício.
                                                </li>
                                            </ul>
                                            <p>
                                                Na Hierarchy, expanda
                                                <code> ControladorFluxoSemanticoTutorial</code> para revelar os
                                                quatro botões listados abaixo. Em cada um deles, localize o evento
                                                <strong> On Click ()</strong> no componente de botão da Unity
                                                (<strong>Button</strong>), clique em <strong>+</strong>,
                                                arraste <code>ControladorFluxoSemanticoTutorial</code> para o
                                                campo do evento e selecione, nesta ordem:
                                            </p>
                                            <ol className="documentacao-eventos-semanticos">
                                                <li><code>SelecionarCategoriaTutorial</code> → <strong>LudusSemanticBridge &gt; RegistrarCategoriaSelecionada</strong>.</li>
                                                <li><code>IniciarFaseTutorial</code> → <strong>LudusSemanticBridge &gt; RegistrarInicioDeFase</strong>.</li>
                                                <li><code>RegistrarAcertoTutorial</code> → <strong>LudusSemanticBridge &gt; RegistrarAcerto</strong>.</li>
                                                <li><code>ConcluirFaseTutorial</code> → <strong>LudusSemanticBridge &gt; RegistrarConclusaoDeFase</strong>.</li>
                                            </ol>
                                            <p>
                                                Depois, volte ao asset <code>ConfiguracaoTutorialLudus</code> em
                                                <strong> Assets &gt; LUDUS &gt; Tutorial</strong> e habilite
                                                <strong> Categorias</strong> e <strong>Eventos de fase</strong>.
                                                No jogo real, ligue esses mesmos métodos aos eventos verdadeiros
                                                do menu, controlador da fase ou regra de progressão — nunca a um
                                                botão criado apenas para o LUDUS.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Imagine um jogo com as categorias “Animais”, “Alimentos” e
                                                    “Objetos”. Ao escolher “Animais”, a Ponte registra essa
                                                    categoria. Dentro dela podem existir várias fases, como
                                                    “Animais domésticos” e “Animais aquáticos”. Ao abrir a
                                                    primeira atividade, o jogo registra o início de
                                                    <code> fase-animais-domesticos</code>; durante a fase envia
                                                    os resultados reais e, quando sua própria regra termina a
                                                    rodada, registra a conclusão. O dashboard passa a organizar
                                                    os resultados pelo contexto correto, em vez de apresentar
                                                    todos os acertos e erros como uma sequência sem divisão.
                                                </p>
                                            </details>
                                        </details>

                                        <details className="documentacao-resultado-opcao">
                                            <summary>Campo de texto, imagem clicável ou regra personalizada</summary>
                                            <p>
                                                O acompanhamento automático registra a interação com o campo,
                                                imagem ou objeto, mas não decide se ela está correta. Se uma
                                                imagem funcionar como um <code>Button</code>, o mesmo adaptador
                                                de resultado de botão pode ser usado. Em outras regras, conecte
                                                o evento que o jogo já utiliza à <strong>Ponte semântica do
                                                jogo</strong> ou à API C# do SDK. O conteúdo livre digitado em
                                                campos de texto não é enviado; somente conclusão, tamanho e
                                                estado vazio são registrados para preservar a privacidade.
                                            </p>
                                            <details className="documentacao-exemplo-pratico">
                                                <summary>Ver exemplo prático</summary>
                                                <p>
                                                    Abrir uma gaveta, escolher uma ferramenta em uma imagem ou
                                                    concluir um campo pode ser apenas observado automaticamente.
                                                    Se a ação também representa acerto ou erro, a regra que o
                                                    jogo já executa deve chamar a Ponte ou um adaptador adequado;
                                                    o SDK não deduz o resultado pela aparência do objeto.
                                                </p>
                                            </details>
                                        </details>
                                    </div>
                                    <div className="documentacao-ferramentas-semanticas">
                                        <details>
                                            <summary>Opcional — configurar em lote cenas reais com arraste por tag</summary>
                                            <p>
                                                <strong>LUDUS &gt; Configurar resultados da cena</strong>
                                                procura, na cena aberta, destinos que recebem <code>OnDrop</code>
                                                e usam uma tag explícita. Depois da sua confirmação, pode criar
                                                ou reutilizar o escopo da atividade, a Ponte semântica e os
                                                adaptadores de arraste selecionados. Também permite salvar e
                                                avançar para a próxima cena habilitada no Build Profile.
                                            </p>
                                            <p>
                                                Ele é útil quando um jogo real possui muitos quebra-cabeças ou
                                                atividades de associação baseadas em tags. No tutorial, você já
                                                configurou o destino manualmente, portanto não precisa aplicar o
                                                assistente novamente.
                                            </p>
                                        </details>
                                        <div className="documentacao-validacao-semantica">
                                            <h5>Verificação final — validar a integração semântica</h5>
                                            <p>
                                                <strong>LUDUS &gt; Validar integração semântica</strong> não
                                                modifica a cena. Ele procura problemas estruturais, como base
                                                LUDUS ausente ou duplicada, asset de configuração não atribuído
                                                e adaptadores que registram acertos, tentativas ou conclusão de
                                                fase enquanto a capacidade correspondente está desativada.
                                            </p>
                                            <p>
                                                Execute depois de configurar os cenários. Corrija os erros antes
                                                do Play; avisos podem indicar uma base persistente herdada da
                                                primeira cena ou uma Ponte manual que precisa ser revisada.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase" id="tutorial-conectar">
                                <span>8</span>
                                <div>
                                    <h4>Conecte o tutorial a uma coleta</h4>
                                    <p>
                                        Execute <strong>GameObject &gt; LUDUS &gt; Adicionar acesso por nome e
                                        código</strong>. Na <strong>Hierarchy</strong>, mantenha o objeto inteiro
                                        <code> LUDUS — Acesso à coleta</code> na cena inicial, de menu ou primeira
                                        cena do jogo. Neste tutorial, coloque-o dentro de
                                        <code> LUDUS — Exercício de interações</code>. O botão <strong>L</strong>
                                        é adicionado no canto superior direito, mas pode ser reposicionado
                                        livremente na cena.
                                    </p>
                                    <p>
                                        No <strong>site LUDUS Acompanha</strong>, abra
                                        <strong> Laboratório &gt; Coletas de teste</strong>. Informe um título,
                                        escolha a turma, defina a validade, mantenha
                                        <strong> Reconhecer jogos durante a atividade</strong> e gere a coleta.
                                        Copie o código temporário exibido.
                                    </p>
                                    <MidiaPreparada
                                        titulo="Print 3 — acesso por nome e código"
                                        descricao="Mostre o botão L no canto superior direito e o modal de conexão aberto."
                                    />
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>9</span>
                                <div>
                                    <h4>Execute no Play com nome e código</h4>
                                    <p>
                                        Pressione <strong>Play</strong> na Unity, clique no botão <strong>L</strong>,
                                        informe o nome do participante e cole o código da coleta. Confirme a
                                        conexão e percorra as seis atividades. Esse é o mesmo vínculo por nome e
                                        código que será usado no seu jogo integrado futuramente.
                                    </p>
                                    <p>
                                        Ao chegar a <strong>Tutorial concluído</strong>, não é necessário clicar
                                        em outro botão: a sessão conectada é encerrada e o envio ao site é iniciado
                                        automaticamente. No seu jogo integrado futuramente, o mesmo envio será
                                        ligado ao momento real em que a atividade terminar. Também não é necessário
                                        baixar ou importar JSON no fluxo principal.
                                    </p>
                                    <details className="documentacao-configuracao">
                                        <summary>Opcional — validar também no WebGL</summary>
                                        <p>
                                            Abra <strong>File &gt; Build Profiles</strong>, selecione
                                            <strong> Web</strong> e clique em <strong>Build And Run</strong>.
                                            Escolha ou crie uma pasta temporária, como
                                            <code> Builds/TutorialWebGL</code>. A primeira compilação costuma
                                            demorar mais; as seguintes reaproveitam parte desse trabalho. No
                                            navegador, repita a conexão pelo botão <strong>L</strong> e o tutorial.
                                        </p>
                                        <p>
                                            Se também quiser baixar o JSON, selecione antes
                                            <strong> Desenvolvimento: enviar e também baixar</strong> no asset
                                            <code> ConfiguracaoTutorialLudus</code>. No Editor, o Console informa
                                            o caminho da cópia salva; no WebGL, o navegador realiza o download.
                                        </p>
                                    </details>
                                    <div className="documentacao-atividades-tutorial">
                                        <details>
                                            <summary>Ver o roteiro resumido das seis atividades</summary>
                                            <p>
                                                Teste as interações automáticas; resolva as alternativas e a
                                                imagem; faça o arraste e o contato com uma tentativa incorreta e
                                                outra correta; atinja a meta por valor; e finalize o ciclo de
                                                categoria e fase na ordem liberada.
                                            </p>
                                        </details>
                                    </div>
                                </div>
                            </section>

                            <section className="documentacao-tutorial-fase">
                                <span>10</span>
                                <div>
                                    <h4>Confira o resultado recebido no dashboard</h4>
                                    <p>
                                        Volte a <strong>Coletas de teste</strong> e, no cartão da coleta, clique
                                        em <strong>Ver recebimentos</strong>. Como o nome informado no jogo ainda
                                        não foi confirmado no dashboard, ele aparece como pendente. Clique em
                                        <strong> Revisar aluno</strong>: associe o recebimento a um cadastro da
                                        turma ou use <strong>Criar “nome informado” nesta turma</strong>. Depois
                                        da confirmação, clique em <strong>Adicionar sessões ao histórico</strong>.
                                        A atividade ficará disponível em <strong>Meus alunos</strong>, onde você
                                        poderá conferir duração, cliques, trajetórias, resultados, sequência e
                                        captura visual, caso ela tenha sido habilitada.
                                    </p>
                                    <MidiaPreparada
                                        titulo="Print 4 — recebimento no dashboard"
                                        descricao="Enquadre Ver recebimentos, Revisar aluno e Adicionar sessões ao histórico."
                                    />
                                    <details className="documentacao-configuracao">
                                        <summary>Opcional — testar por arquivo JSON</summary>
                                        <p>
                                            Use o painel <strong>LUDUS — Tutorial de teste</strong> para iniciar
                                            uma sessão fictícia e gerar um JSON somente se quiser validar o modo
                                            offline, inspecionar o arquivo ou simular uma falha de rede. Depois,
                                            no site, abra <strong>Laboratório &gt; Alunos de teste</strong>, escolha
                                            um aluno e use <strong>Importar JSON</strong>. Esse caminho não é
                                            necessário no uso normal por nome e código de coleta.
                                        </p>
                                        <p>
                                            Para exibi-lo, selecione <code>LUDUS SDK — Tutorial</code> na
                                            <strong> Hierarchy</strong> e marque
                                            <strong> Exibir painel manual de JSON</strong> no componente
                                            <strong> Ludus Tutorial Test Panel</strong>.
                                        </p>
                                    </details>
                                    <div className="documentacao-restaurar-build">
                                        <strong>Ao terminar, restaure o Build Profile do seu jogo.</strong>
                                        <p>
                                            Volte a <strong>File &gt; Build Profiles &gt; Web &gt;
                                            Open Scene List</strong>, desmarque ou remova
                                            <code> TutorialLudus</code> e habilite novamente todas as
                                            cenas originais na ordem correta. Confirme que a cena
                                            inicial do seu jogo voltou ao índice 0 antes de gerar o
                                            build real.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="documentacao-tutorial-conclusao">
                            <strong>O tutorial termina no dashboard, não no Console.</strong>
                            <p>
                                Considere o laboratório concluído somente quando conseguir entender
                                de onde vieram os registros, por que cada capacidade foi habilitada e
                                como a sessão chegou ao aluno fictício. A partir daí, repita o mesmo
                                raciocínio no jogo real usando os passos seguintes.
                            </p>
                        </div>
                    </article>

                    <div className="documentacao-transicao-jogo-real" id="integrar-jogo-real">
                        <span>PRÓXIMA ETAPA</span>
                        <div>
                            <h3>Depois do tutorial: integre o jogo real</h3>
                            <p>
                                Agora você repetirá no projeto real apenas as decisões que fazem sentido
                                para a regra, as cenas e os eventos verdadeiros do seu jogo.
                            </p>
                        </div>
                    </div>

                    <div className="documentacao-passos">
                        <article className="documentacao-passo">
                            <span>1</span>
                            <div>
                                <h3>Prepare o laboratório no dashboard</h3>
                                <p>
                                    Abra <strong>Laboratório</strong> e prepare uma
                                    coleta que reconheça jogos durante a atividade.
                                    Use turmas, alunos e coletas de teste para
                                    exercitar o mesmo fluxo que será usado em uma
                                    escola, sem misturar dados reais. Quando a primeira
                                    sessão chegar, o jogo será cadastrado
                                    automaticamente e poderá ser revisado em{" "}
                                    <strong>Meus jogos</strong>.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>2</span>
                            <div>
                                <h3>Crie uma única base LUDUS</h3>
                                <p>
                                    Abra a primeira cena do jogo e execute
                                    <strong> GameObject &gt; LUDUS &gt; Adicionar coleta ao meu jogo</strong>.
                                    Na Hierarchy será criado o GameObject <code>LUDUS SDK</code>.
                                    Ele contém o controlador, o exportador e os coletores
                                    que permanecem ativos durante as trocas de cena.
                                </p>
                                <p>
                                    Execute esse comando apenas uma vez. Uma segunda base
                                    pode disputar o controle da sessão e gerar avisos ou
                                    dados incompletos.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>3</span>
                            <div>
                                <h3>Abra o asset ConfiguracaoLudus</h3>
                                <p>
                                    Selecione <code>LUDUS SDK</code> na Hierarchy. No
                                    Inspector, localize <strong>Configuração do jogo
                                    (asset)</strong>. Clique na referência
                                    <code> ConfiguracaoLudus</code> para destacá-la no
                                    painel Project e então selecione o asset em
                                    <code> Assets/LUDUS/ConfiguracaoLudus.asset</code>.
                                    É nesse asset — e não nos componentes da base — que
                                    ficam o nome do jogo, envio, cenas e capacidades.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>4</span>
                            <div>
                                <h3>Configure o que será coletado e para onde será enviado</h3>
                                <p>
                                    Preencha o nome e revise cada grupo abaixo. Comece
                                    apenas com interações automáticas; resultados e
                                    imagens devem ser ligados conscientemente depois.
                                </p>

                                <details className="documentacao-configuracao">
                                    <summary>Identificação e destino dos dados</summary>
                                    <ul>
                                        <li><strong>Nome do jogo:</strong> nome estável exibido no dashboard. O identificador técnico e a versão inicial são gerados pelo SDK.</li>
                                        <li><strong>Enviar automaticamente ao LUDUS Acompanha:</strong> recomendado para turmas. Envia ao encerrar, sem baixar JSON em cada computador; se falhar, mantém fallback local.</li>
                                        <li><strong>Exportar JSON manualmente:</strong> gera um arquivo JSON no computador para revisão ou importação manual autorizada no dashboard. No WebGL, o navegador solicita o download ao encerrar a sessão.</li>
                                        <li><strong>Desenvolvimento: enviar e também baixar:</strong> faz os dois fluxos. Use somente durante validação, porque gera um arquivo em cada encerramento.</li>
                                        <li><strong>Guardar também uma cópia de segurança local:</strong> preserva uma cópia no armazenamento interno do aplicativo mesmo quando o envio funciona. Ela é separada do JSON baixado manualmente e sua localização varia conforme a plataforma.</li>
                                        <li><strong>Salvar progresso parcial:</strong> no envio automático, atualiza um checkpoint em segundo plano para reduzir perdas se a aba fechar.</li>
                                        <li><strong>Rótulo do arquivo (opcional):</strong> aparece nos modos com download e ajuda a reconhecer o JSON. Use um rótulo da atividade, nunca o nome ou outro dado pessoal do participante.</li>
                                    </ul>
                                </details>

                                <details className="documentacao-configuracao">
                                    <summary>Conexão com ambiente LUDUS (avançado)</summary>
                                    <p>
                                        A origem oficial publicada já vem preenchida nos novos
                                        assets. Abra esta opção para conferi-la ou somente se precisar
                                        usar outro ambiente. Nesse caso, informe apenas a origem,
                                        sem <code>/api</code> no final. Não coloque JWT, senha,
                                        código de coleta ou token no projeto.
                                    </p>
                                </details>

                                <details className="documentacao-configuracao">
                                    <summary>Cenas acompanhadas</summary>
                                    <ul>
                                        <li><strong>Todas as cenas:</strong> cria um recorte para cada cena ativa, inclusive menus.</li>
                                        <li><strong>Somente cenas selecionadas:</strong> arraste do Project apenas as cenas de atividade. Nas outras, a sessão continua ativa, mas a captura de interação fica pausada.</li>
                                        <li>As cenas selecionadas também precisam estar habilitadas no Build Profile para existirem no jogo publicado.</li>
                                    </ul>
                                </details>

                                <details className="documentacao-configuracao">
                                    <summary>Coleta essencial</summary>
                                    <ul>
                                        <li><strong>Cliques:</strong> registra posição e instante de cliques ou toques.</li>
                                        <li><strong>Trajetória do mouse:</strong> amostra o caminho do ponteiro e aumenta o volume do JSON.</li>
                                        <li><strong>Trajetória de arraste:</strong> registra início, percurso e fim do gesto; não move a peça nem decide o destino.</li>
                                    </ul>
                                </details>

                                <details className="documentacao-configuracao">
                                    <summary>Resultados informados pelo jogo</summary>
                                    <p>
                                        <strong>Categorias</strong>, <strong>Eventos de fase</strong>,
                                        <strong> Acertos e erros</strong> e <strong>Eventos personalizados</strong>
                                        só devem ser habilitados depois de conectados pela
                                        Ponte semântica, pelos adaptadores ou pela API C#.
                                        Em termos práticos, o jogo precisa avisar ao SDK quando
                                        começou uma fase, mudou de categoria ou avaliou uma resposta;
                                        marcar a caixa não faz o SDK descobrir sozinho essas regras.
                                    </p>
                                </details>

                                <details className="documentacao-configuracao">
                                    <summary>Capturas visuais e desenvolvimento</summary>
                                    <p>
                                        <strong>Capturar imagem da tela</strong> fica desligado
                                        por padrão. Quando necessário e autorizado, escolha
                                        em <strong>Imagens automáticas nas cenas</strong> todas
                                        as cenas acompanhadas ou somente cenas marcadas. Prefira
                                        cenas principais de atividade e deixe menu, configurações,
                                        créditos e telas auxiliares sem imagem para reduzir o volume
                                        da sessão e manter o dashboard focado no momento de jogo.
                                        <strong> Capturar após a primeira interação</strong> evita
                                        usar uma tela de carregamento como referência; mantenha
                                        essa opção ligada salvo se o jogo exigir outro momento.
                                        A imagem usa JPEG reduzido e o SDK conserva no máximo
                                        quatro por sessão. Em <strong>Telas ou atividades dentro
                                        da cena</strong>, adicione áreas internas apenas quando
                                        uma mesma cena realmente tiver vários painéis ou atividades.
                                    </p>
                                    <p>
                                        Mantenha <strong>Exibir mensagens detalhadas no Console</strong>
                                        habilitado durante a integração. Depois da validação,
                                        ele pode ser desligado para reduzir ruído nos computadores da turma.
                                    </p>
                                </details>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>5</span>
                            <div>
                                <h3>Defina onde a sessão começa e termina</h3>
                                <p>
                                    Selecione um GameObject que permaneça ativo durante
                                    toda a atividade. No Inspector, clique em
                                    <strong> Add Component &gt; LUDUS &gt; Fluxo &gt; Sessão acompanhada</strong>.
                                    Por padrão, a sessão começa quando esse objeto é
                                    habilitado e termina quando ele é desabilitado ou a
                                    cena fecha. O menu superior <strong>LUDUS</strong> não
                                    contém esse item.
                                </p>
                                <p>
                                    Se você usar <strong>LUDUS &gt; Configurar resultados
                                    da cena</strong>, o assistente pode criar esse objeto
                                    automaticamente. Em atividades que começam ou terminam
                                    sem desativar o objeto, conecte os métodos
                                    <code> IniciarSessao</code> e <code> EncerrarSessao</code>
                                    aos eventos reais do jogo.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>6</span>
                            <div>
                                <h3>Marque interações e resultados que importam</h3>
                                <p>
                                    Use <strong>LUDUS &gt; Configurar interações desta cena</strong>
                                    para nomear botões, campos e objetos relevantes. Use
                                    <strong> LUDUS &gt; Configurar resultados da cena</strong>
                                    somente quando o jogo realmente conhece a categoria,
                                    fase, resposta correta, acerto ou erro. Finalize com
                                    <strong> LUDUS &gt; Validar integração semântica</strong>.
                                    O SDK observa; ele não muda a lógica, a movimentação
                                    nem a pontuação do jogo.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>7</span>
                            <div>
                                <h3>Adicione o acesso por nome e código</h3>
                                <p>
                                    Na cena de menu, execute
                                    <strong> GameObject &gt; LUDUS &gt; Adicionar acesso por nome e código</strong>.
                                    O objeto é adicionado à raiz da cena. Arraste
                                    <code> LUDUS — Acesso à coleta</code> para o Canvas
                                    visual escolhido e posicione somente o filho
                                    <code> Abrir acesso</code>. Preserve o objeto principal,
                                    o modal e suas referências; o layout se adapta ao Canvas.
                                </p>
                                <p>
                                    O participante informa nome e código antes de entrar
                                    na atividade. Escola, turma e professora vêm da coleta
                                    criada no dashboard. A conexão guarda a credencial
                                    temporária apenas em memória e permite que a sessão
                                    seja enviada ao participante correto.
                                </p>
                            </div>
                        </article>

                        <article className="documentacao-passo">
                            <span>8</span>
                            <div>
                                <h3>Valide primeiro no Editor e depois no WebGL</h3>
                                <p>
                                    Conecte um participante fictício, inicie e encerre uma
                                    sessão exatamente uma vez e confira Console, JSON,
                                    fallback e dashboard. Depois gere o WebGL e repita o
                                    mesmo roteiro, incluindo fechamento de aba e falha de
                                    rede. Só então use uma escola real.
                                </p>
                            </div>
                        </article>
                    </div>

                    <details className="documentacao-orientacoes-professor">
                        <summary>Checklist técnico — Editor, WebGL e desempenho</summary>
                        <div className="documentacao-tecnica-grid">
                        <article>
                            <h3>O que validar no Editor</h3>
                            <ul>
                                <li>Uma única base <code>LUDUS SDK</code>.</li>
                                <li>Identidade fictícia e coleta de laboratório.</li>
                                <li>Início e encerramento exatamente uma vez.</li>
                                <li>Ao menos um clique, movimento, arraste, erro e acerto quando disponíveis.</li>
                                <li>JSON compatível e fallback sem exceções no Console.</li>
                            </ul>
                        </article>

                        <article>
                            <h3>O que repetir no WebGL</h3>
                            <ul>
                                <li>Conexão pelo botão de nome e código.</li>
                                <li><code>platform: "WebGLPlayer"</code> no payload.</li>
                                <li>Checkpoint durante a atividade e sessão concluída ao final.</li>
                                <li>Recebimento no dashboard sem download inesperado.</li>
                                <li>Fallback quando a API estiver indisponível.</li>
                            </ul>
                        </article>

                        <article>
                            <h3>Desempenho em computadores modestos</h3>
                            <ul>
                                <li>Acompanhe somente as cenas necessárias.</li>
                                <li>Mantenha capturas desligadas quando não forem essenciais.</li>
                                <li>Se usar imagens, o SDK limita dimensão, compressão e quantidade.</li>
                                <li>Teste no equipamento mais fraco que será usado pela turma.</li>
                                <li>Faça teste de carga separado para vários envios simultâneos.</li>
                            </ul>
                        </article>
                        </div>
                    </details>

                    <div className="documentacao-checklist">
                        <h3>Pronto para uma escola real quando…</h3>
                        <ul>
                            <li>o build WebGL foi testado do início ao fim;</li>
                            <li>o jogo continua utilizável com a API temporariamente offline;</li>
                            <li>somente capacidades realmente integradas aparecem no dashboard;</li>
                            <li>as capturas estão desativadas ou têm finalidade e autorização definidas;</li>
                            <li>o professor sabe criar, revogar e revisar uma coleta;</li>
                            <li>a integração foi testada com vários clientes simultâneos.</li>
                        </ul>
                    </div>

                    <p className="documentacao-referencia">
                        Referência completa: {" "}
                        <a
                            href="https://github.com/RodrigoBichet/LUDUS-Unity-SDK/blob/main/Documentation~/GUIA_INTEGRACAO_END_TO_END.md"
                            target="_blank"
                            rel="noreferrer"
                        >
                            guia de integração do LUDUS Unity SDK
                        </a>.
                    </p>
                </section>
                )}
            </div>
        </div>
    );
}
