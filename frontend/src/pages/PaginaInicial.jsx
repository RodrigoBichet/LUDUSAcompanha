import { Link } from "react-router-dom";
import LayoutPublico from "../components/layout/LayoutPublico";
import Icone from "../components/shared/Icone";
import MarcaLudus from "../components/shared/MarcaLudus";
import "./PaginaInicial.css";

const ferramentas = [
    {
        sigla: "01",
        icone: "unity",
        titulo: "SDK LUDUS para Unity",
        texto: "Um pacote adicionado ao projeto Unity para acompanhar cenas, interações e eventos que o próprio jogo conhece, como fases, acertos e erros.",
        detalhe:
            "Indicado para quem desenvolve ou tem acesso ao código do jogo.",
    },
    {
        sigla: "02",
        icone: "extensao",
        titulo: "LUDUS Observa",
        texto: "Uma extensão para navegador que acompanha jogos web compatíveis. Ela registra ações observáveis no navegador, como cliques e trajetórias, sem exigir alteração do código do jogo.",
        detalhe:
            "Indicado quando o jogo funciona no navegador e pode ser observado, mas não instrumentado.",
    },
    {
        sigla: "03",
        icone: "dashboard",
        titulo: "Dashboard LUDUS Acompanha",
        texto: "O site organiza jogos, turmas, alunos, coletas e sessões para apresentar duração, sequência, mapas e resultados informados pelo método de captura escolhido.",
        detalhe:
            "É nele que professores visualizam os dados capturados de forma organizada e melhor apresentada, enquanto desenvolvedores validam suas integrações.",
    },
];

const etapas = [
    {
        numero: "1",
        titulo: "Crie sua conta ou entre",
        texto: "Comece acessando o site como professor ou desenvolvedor. O perfil escolhido define as áreas e os recursos que aparecerão no dashboard.",
        detalhes: [
            {
                titulo: "Para professores",
                texto: "confirme o e-mail e aguarde o vínculo com a instituição antes de preparar turmas e coletas reais.",
            },
            {
                titulo: "Para desenvolvedores",
                texto: "confirme o e-mail para utilizar o laboratório com dados fictícios e preparar a integração.",
            },
        ],
    },
    {
        numero: "2",
        titulo: "Reconheça o jogo automaticamente",
        texto: (
            <>
                O usuário não precisa cadastrar o jogo manualmente. Quando a
                primeira sessão recebida pela coleta é adicionada ao histórico,
                o LUDUS Acompanha reconhece o jogo e o exibe em
                <strong> Meus jogos</strong> para conferência.
            </>
        ),
        detalhes: [
            {
                titulo: "Para professores",
                texto: "prepare a coleta e permita o reconhecimento do jogo usado na atividade. Depois que a sessão for adicionada ao histórico, confira as informações criadas automaticamente e ajuste-as se necessário.",
            },
            {
                titulo: "Para desenvolvedores",
                texto: "envie uma primeira sessão pelo laboratório para o jogo aparecer automaticamente. Use a área Meus jogos para revisar nome, descrição e endereços caso alguma informação precise ser corrigida.",
            },
        ],
    },
    {
        numero: "3",
        titulo: "Consulte a documentação",
        texto: "Antes de configurar ou capturar dados, escolha na documentação o guia correspondente ao seu perfil e conheça o fluxo que será utilizado.",
        detalhes: [
            {
                titulo: "Para professores",
                texto: "o guia apresenta a preparação da instituição, da turma, dos alunos e das coletas, além da leitura dos registros no dashboard.",
            },
            {
                titulo: "Para desenvolvedores",
                texto: "o guia do SDK começa por um tutorial isolado com dados fictícios e depois mostra como integrar o jogo real. A documentação do LUDUS Observa será adicionada futuramente.",
            },
        ],
    },
    {
        numero: "4",
        titulo: "Prepare o dashboard",
        texto: "Organize o ambiente que receberá as atividades: confirme a instituição, prepare a turma e cadastre somente os dados necessários dos participantes. O jogo pode ser reconhecido automaticamente durante a coleta.",
        detalhes: [
            {
                titulo: "Para professores",
                texto: "confirme a instituição, crie a turma e cadastre somente os dados necessários dos alunos.",
            },
            {
                titulo: "Para desenvolvedores",
                texto: "use o Laboratório LUDUS para criar esse cenário com dados fictícios e validar a integração sem afetar registros reais.",
            },
        ],
    },
    {
        numero: "5",
        titulo: "Escolha como capturar",
        texto: "Defina se a atividade será acompanhada pelo SDK Unity ou pela extensão LUDUS Observa. Cada ferramenta registra somente o que realmente consegue observar.",
        detalhes: [
            {
                titulo: "Para professores — LUDUS Observa",
                texto: "indicado para jogos web sem acesso ao código. A extensão exige pouca preparação e registra rapidamente ações observáveis, como cliques e trajetórias, mas não se aprofunda em dados como acertos, erros ou regras internas do jogo.",
            },
            {
                titulo: "Para desenvolvedores — SDK LUDUS",
                texto: "indicado quando há acesso ao projeto Unity. Exige mais configuração, mas pode receber fases, acertos, erros e eventos informados pelo próprio jogo, deixando a sessão mais detalhada e a captura bem mais personalizável.",
            },
        ],
        comparacao:
            "O LUDUS Observa prioriza simplicidade e rapidez, com registros mais gerais. O SDK exige integração no Unity, mas permite dados semânticos mais completos e maior controle sobre o que será capturado.",
    },
    {
        numero: "6",
        titulo: "Crie a coleta e conecte",
        texto: (
            <>
                No dashboard, abra <strong>Coletas</strong>, crie a coleta,
                escolha a turma e defina o período da atividade. Se o jogo ainda
                não estiver em <strong>Meus jogos</strong>, permita que ele seja
                reconhecido pela primeira sessão adicionada ao histórico. O
                código temporário conecta a ferramenta à coleta preparada.
            </>
        ),
        detalhes: [
            {
                titulo: "Durante a atividade",
                texto: "o participante informa o nome e o código na ferramenta utilizada. O código identifica a coleta e ajuda a relacionar a sessão à turma e ao participante autorizado.",
            },
        ],
    },
    {
        numero: "7",
        titulo: "Valide o recebimento",
        texto: "Faça uma atividade rápida de teste e confira na coleta do dashboard se o recebimento apareceu com duração, interações e capacidades disponíveis corretamente.",
    },
    {
        numero: "8",
        titulo: "Acompanhe as atividades",
        texto: "Com o fluxo validado, as crianças já podem realizar as atividades planejadas. O professor acompanha os registros recebidos, consulta o percurso dos alunos e combina os indicadores com sua observação, usando essas evidências parciais como apoio à mediação pedagógica.",
    },
];

export default function PaginaInicial({ incorporada = false }) {
    const irParaFerramentas = (evento) => {
        evento.preventDefault();
        document.getElementById("ferramentas")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const conteudo = (
        <>
            <section className="site-hero" id="projeto">
                <div className="site-hero-conteudo">
                    <div className="site-hero-marca">
                        <MarcaLudus />
                    </div>
                    <h1>
                        Registre atividades dos jogos e acompanhe o percurso dos
                        <span> seus alunos</span>
                    </h1>
                    <aside
                        className="site-hero-painel"
                        aria-label="Limite pedagógico do projeto"
                    >
                        <span>Importante sempre lembrar</span>
                        <h2>Apoio pedagógico, não diagnóstico</h2>
                        <p>
                            Os registros oferecem evidências parciais para apoiar a
                            observação e a mediação docente. O LUDUS Acompanha não
                            diagnostica, não classifica clinicamente e não mede
                            aprendizagem de forma conclusiva.
                        </p>
                        <Link to="/privacidade">
                            Conhecer os cuidados com os dados →
                        </Link>
                    </aside>
                    <div className="site-hero-acoes">
                        <a
                            className="site-botao site-botao-primario"
                            href="#ferramentas"
                            onClick={irParaFerramentas}
                        >
                            Começar agora <span aria-hidden="true">↓</span>
                        </a>
                        <Link
                            className="site-botao site-botao-secundario"
                            to="/documentacao"
                        >
                            Explorar a documentação
                        </Link>
                    </div>
                </div>
            </section>

            <section
                className="site-secao site-ferramentas"
                id="ferramentas"
                aria-labelledby="ferramentas-titulo"
            >
                <div className="site-secao-cabecalho">
                    <h2 id="ferramentas-titulo">
                        Como seu jogo será acompanhado
                    </h2>
                    <p>
                        Cada ferramenta cumpre uma parte diferente do caminho
                        entre o jogo, a captura autorizada e a leitura
                        pedagógica dos registros.
                    </p>
                </div>
                <div className="site-ferramentas-grid">
                    {ferramentas.map((ferramenta) => (
                        <article key={ferramenta.sigla}>
                            <div className="site-ferramenta-identidade">
                                <span>{ferramenta.sigla}</span>
                                <span
                                    className="site-ferramenta-icone"
                                    aria-hidden="true"
                                >
                                    <Icone
                                        nome={ferramenta.icone}
                                        tamanho={28}
                                    />
                                </span>
                            </div>
                            <h3>{ferramenta.titulo}</h3>
                            <p>{ferramenta.texto}</p>
                            <small>{ferramenta.detalhe}</small>
                        </article>
                    ))}
                </div>
                <div className="site-publicos" id="para-quem">
                    <div className="site-secao-cabecalho">
                        <h2>O que cada perfil encontra na plataforma</h2>
                        <p className="site-publicos-descricao">Caminhos disponíveis</p>
                    </div>
                    <div className="site-publicos-grid">
                        <article className="site-publico-card">
                            <Icone nome="pessoas" tamanho={25} />
                            <div>
                                <span>Para professores</span>
                                <h3>Prepare e acompanhe as atividades</h3>
                                <p>
                                    Organize turmas, alunos e coletas; depois
                                    acompanhe os registros recebidos como apoio
                                    à observação e à mediação pedagógica.
                                </p>
                            </div>
                        </article>
                        <article className="site-publico-card">
                            <Icone nome="configuracao" tamanho={25} />
                            <div>
                                <span>Para desenvolvedores</span>
                                <h3>Integre e valide os jogos</h3>
                                <p>
                                    Use o laboratório com dados fictícios,
                                    configure o SDK e confira no dashboard se as
                                    sessões foram recebidas como esperado.
                                </p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            <section
                className="site-secao site-como-funciona"
                id="como-funciona"
            >
                <div className="site-secao-cabecalho">
                    <h2>Da criação da conta ao acompanhamento da atividade</h2>
                    <p>
                        Siga o percurso completo para preparar o site, escolher
                        a ferramenta de captura, conectar uma atividade e
                        compreender como os registros chegam ao dashboard.
                    </p>
                </div>
                <ol className="site-fluxo">
                    {etapas.map((etapa) => (
                        <li key={etapa.numero}>
                            <span>{etapa.numero}</span>
                            <div>
                                <h3>{etapa.titulo}</h3>
                                <p>{etapa.texto}</p>
                                {(etapa.detalhes || etapa.comparacao) && (
                                    <div className="site-fluxo-acoes">
                                        {etapa.detalhes && (
                                            <details>
                                                <summary>Ver mais</summary>
                                                <div>
                                                    {etapa.detalhes.map(
                                                        (detalhe) => (
                                                            <p
                                                                key={
                                                                    detalhe.titulo
                                                                }
                                                            >
                                                                <strong>
                                                                    {
                                                                        detalhe.titulo
                                                                    }
                                                                    :
                                                                </strong>{" "}
                                                                {detalhe.texto}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                        {etapa.comparacao && (
                                            <details>
                                                <summary>
                                                    Comparar opções
                                                </summary>
                                                <div>
                                                    <p>{etapa.comparacao}</p>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
                <div className="site-principios" id="uso-responsavel">
                    <div className="site-principios-introducao">
                        <h3>Antes de seguir, três cuidados essenciais</h3>
                        <p>
                            Registros úteis começam com escolhas cuidadosas.
                            Cada aplicação precisa explicar o que será
                            acompanhado e utilizar apenas os dados necessários,
                            com finalidade, minimização e transparência.
                        </p>
                    </div>
                    <div className="site-principios-grid">
                        <article>
                            <Icone nome="alvo" tamanho={22} />
                            <h3>Uma finalidade clara</h3>
                            <p>
                                Cada capacidade responde a uma necessidade
                                pedagógica ou técnica definida.
                            </p>
                        </article>
                        <article>
                            <Icone nome="cadeado" tamanho={22} />
                            <h3>Somente o necessário</h3>
                            <p>
                                Capturas e dados pessoais são limitados e
                                dependem de finalidade e autorização.
                            </p>
                        </article>
                        <article>
                            <Icone nome="pessoas" tamanho={22} />
                            <h3>Leitura feita por pessoas</h3>
                            <p>
                                O professor combina os registros com o contexto
                                da turma e sua prática pedagógica.
                            </p>
                        </article>
                    </div>
                    <p className="site-base-etica">
                        O desenvolvimento está ligado ao ecossistema acadêmico
                        MaisLUDUS e à UFPel. Aplicações com participantes devem
                        respeitar as autorizações institucionais e o protocolo
                        ético aprovado aplicável à atividade.
                        <Link to="/privacidade"> Leia o aviso completo.</Link>
                    </p>
                </div>
            </section>

            <section
                className="site-secao site-documentacoes"
                id="documentacoes"
            >
                <div className="site-secao-cabecalho">
                    <h2>Para começar a colocar o projeto em prática</h2>
                    <p>
                        Crie sua conta com o perfil correspondente à sua
                        atuação. Depois, abra a documentação e escolha o guia de
                        professor ou de desenvolvedor para seguir o percurso
                        indicado.
                    </p>
                    <div className="site-inicio-acoes">
                        <Link to="/cadastro?perfil=professor">
                            Criar conta de professor
                        </Link>
                        <Link to="/cadastro?perfil=developer">
                            Criar conta de desenvolvedor
                        </Link>
                        <Link to="/login">Já tenho uma conta</Link>
                    </div>
                </div>
                <div
                    className="site-documentacoes-grid"
                    aria-label="Documentações das ferramentas"
                >
                    <article className="site-documentacao-card disponivel">
                        <Icone nome="documento" tamanho={26} />
                        <div>
                            <span>Disponível agora</span>
                            <h3>SDK LUDUS para Unity</h3>
                            <p>
                                Guia completo para instalar o pacote, executar o
                                tutorial, integrar seu jogo e conferir os
                                registros no dashboard.
                            </p>
                        </div>
                        <Link to="/documentacao">
                            Abrir documentação do SDK →
                        </Link>
                    </article>
                    <article
                        className="site-documentacao-card futura"
                        aria-disabled="true"
                    >
                        <Icone nome="documento" tamanho={26} />
                        <div>
                            <span>Em preparação</span>
                            <h3>LUDUS Observa</h3>
                            <p>
                                A documentação específica da extensão para
                                navegador será adicionada em uma etapa futura do
                                projeto.
                            </p>
                        </div>
                        <button type="button" disabled>
                            Disponível futuramente
                        </button>
                    </article>
                </div>
            </section>
        </>
    );

    if (incorporada) {
        return (
            <div className="site-publico site-publico-incorporado">
                {conteudo}
            </div>
        );
    }

    return <LayoutPublico>{conteudo}</LayoutPublico>;
}
