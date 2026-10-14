import LayoutPublico from "../components/layout/LayoutPublico";
import BotaoContato from "../components/shared/BotaoContato";
import { Link } from "react-router-dom";
import "./Privacidade.css";

export default function Privacidade() {
    return (
        <LayoutPublico>
            <article className="privacidade-projeto">
                <header className="privacidade-projeto-hero">
                    <h1>Como o LUDUS Acompanha trata dados</h1>
                    <p>
                        Este aviso cobre o cadastro, o dashboard, o SDK LUDUS e o
                        capturador LUDUS Observa. Ele apresenta finalidades, limites
                        e cuidados que devem ser conhecidos antes de utilizar as
                        ferramentas com participantes reais.
                    </p>
                    <div className="privacidade-limite-principal">
                        <strong>Apoio pedagógico, não diagnóstico</strong>
                        <p>
                            Os registros são evidências parciais para apoiar a
                            observação e a mediação docente. O sistema não diagnostica,
                            não classifica clinicamente e não mede aprendizagem de
                            forma conclusiva.
                        </p>
                    </div>
                    <Link className="privacidade-documentacao-link" to="/documentacao">
                        Conhecer a documentação disponível do SDK →
                    </Link>
                </header>

                <section>
                    <h2>Dados, finalidade e minimização</h2>
                    <div className="privacidade-duas-colunas">
                        <div>
                            <h3>Cadastro e organização</h3>
                            <ul>
                                <li>nome, e-mail e perfil da conta;</li>
                                <li>instituição solicitada e vínculos autorizados;</li>
                                <li>turmas, participantes e coletas temporárias;</li>
                                <li>senha armazenada somente por hash.</li>
                            </ul>
                        </div>
                        <div>
                            <h3>Atividades acompanhadas</h3>
                            <ul>
                                <li>início, fim, duração e plataforma;</li>
                                <li>cliques, movimento e gestos de arraste;</li>
                                <li>eventos e resultados informados pelo jogo;</li>
                                <li>capturas visuais, somente quando habilitadas.</li>
                            </ul>
                        </div>
                    </div>
                    <p>
                        Cada aplicação deve definir previamente por que coleta cada
                        dado. Campos indisponíveis não podem ser inferidos pelo
                        dashboard, pelo professor ou pelas ferramentas de captura.
                    </p>
                </section>

                <section>
                    <h2>Uso com crianças, estudantes e pesquisa</h2>
                    <p>
                        Testes técnicos devem começar com dados fictícios. Aplicações
                        com participantes reais exigem definição de finalidade,
                        autorização institucional e os procedimentos de consentimento
                        ou assentimento aplicáveis. Capturas, nomes e informações
                        identificáveis merecem cuidado adicional.
                    </p>
                    <p>
                        O LUDUS Acompanha é um trabalho de mestrado da UFPel ligado ao
                        ecossistema de pesquisa MaisLUDUS. Quando os registros forem
                        utilizados em pesquisa, a aplicação deve respeitar o protocolo
                        ético aprovado que abrange aquela atividade. Este aviso público
                        não substitui o termo apresentado ao participante nem a análise
                        do Comitê de Ética em Pesquisa.
                    </p>
                </section>

                <section>
                    <h2>Acesso, segurança e retenção</h2>
                    <ul>
                        <li>resultados e perfis exigem autenticação e autorização;</li>
                        <li>códigos de coleta são temporários e têm escopo limitado;</li>
                        <li>desenvolvedores não recebem acesso automático a dados escolares;</li>
                        <li>capturas devem permanecer desativadas quando não forem necessárias;</li>
                        <li>prazos de retenção e descarte devem ser definidos com cada instituição antes do uso continuado.</li>
                    </ul>
                    <p>
                        O projeto ainda está em desenvolvimento acadêmico. Políticas de
                        retenção, storage persistente de imagens e rotinas institucionais
                        de atendimento precisam ser confirmadas antes de uma aplicação
                        real e não são apresentadas aqui como concluídas.
                    </p>
                </section>

                <section>
                    <h2>Direitos e contato</h2>
                    <p>
                        Dúvidas e solicitações de acesso, correção ou eliminação devem
                        ser encaminhadas ao projeto e, em uma aplicação institucional,
                        também à organização responsável pela coleta. A resposta poderá
                        exigir confirmação da identidade e análise das obrigações de
                        preservação da pesquisa.
                    </p>
                    <BotaoContato className="privacidade-contato" />
                </section>

                <section className="privacidade-referencias">
                    <h2>Referências e documentos</h2>
                    <ul>
                        <li>
                            <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noreferrer">
                                Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018
                            </a>
                        </li>
                        <li>
                            <a href="https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2016/resolucao-no-510.pdf/view" target="_blank" rel="noreferrer">
                                Resolução CNS nº 510/2016 — ética em pesquisas em Ciências Humanas e Sociais
                            </a>
                        </li>
                        <li>
                            <a href="https://maisludus.com.br/projeto" target="_blank" rel="noreferrer">
                                Projeto MaisLUDUS
                            </a>
                        </li>
                        <li>
                            Esta página consolida o documento técnico de privacidade, ética e governança do LUDUS Acompanha.
                        </li>
                        <li>
                            <a href="/privacidade/ludus-observa">
                                Política específica do LUDUS Observa
                            </a>
                        </li>
                    </ul>
                </section>
            </article>
        </LayoutPublico>
    );
}
