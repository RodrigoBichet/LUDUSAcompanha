import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./PrivacidadeLudusObserva.css";

const EMAIL_CONTATO = "rodrigobichet39@gmail.com";

export default function PrivacidadeLudusObserva() {
    useEffect(() => {
        const tituloAnterior = document.title;
        document.title = "Privacidade do LUDUS Observa — LUDUS Acompanha";

        return () => {
            document.title = tituloAnterior;
        };
    }, []);

    return (
        <main className="privacidade-observa">
            <header className="privacidade-observa-cabecalho">
                <div className="privacidade-observa-marca" aria-hidden="true">
                    L
                </div>
                <div>
                    <p className="privacidade-observa-projeto">LUDUS Acompanha</p>
                    <h1>Política de privacidade do LUDUS Observa</h1>
                    <p className="privacidade-observa-resumo">
                        Captura observacional local e consciente para jogos Web.
                    </p>
                </div>
            </header>

            <section className="privacidade-observa-destaque" aria-labelledby="resumo-politica">
                <div>
                    <p className="privacidade-observa-etiqueta">Resumo direto</p>
                    <h2 id="resumo-politica">A extensão não envia sua telemetria para servidores.</h2>
                </div>
                <p>
                    Os registros permanecem no navegador durante a captura. Somente a pessoa
                    usuária decide se deseja baixar o arquivo JSON ao encerrar a sessão.
                </p>
            </section>

            <div className="privacidade-observa-grade">
                <section className="privacidade-observa-card">
                    <h2>Finalidade</h2>
                    <p>
                        O LUDUS Observa registra evidências técnicas parciais de interação dentro
                        da área de um jogo Web escolhida conscientemente pela pessoa usuária. O
                        resultado é um JSON local compatível com o LUDUS Acompanha.
                    </p>
                    <p>
                        O recurso oferece apoio à observação e à mediação pedagógica. Ele não
                        realiza diagnóstico, classificação clínica ou avaliação conclusiva de
                        aprendizagem.
                    </p>
                </section>

                <section className="privacidade-observa-card">
                    <h2>Dados processados localmente</h2>
                    <ul>
                        <li>origem do site selecionado, sem conservar o caminho completo no JSON;</li>
                        <li>tamanho da área observada;</li>
                        <li>coordenadas e instantes de cliques;</li>
                        <li>amostras da trajetória do ponteiro;</li>
                        <li>amostras do ponteiro pressionado;</li>
                        <li>início, encerramento e duração da sessão;</li>
                        <li>nome técnico da atividade informado pela pessoa usuária.</li>
                    </ul>
                </section>

                <section className="privacidade-observa-card privacidade-observa-card-negativo">
                    <h2>O que não é coletado</h2>
                    <ul>
                        <li>conteúdo digitado ou eventos de teclado;</li>
                        <li>campos de texto, senhas ou elementos editáveis;</li>
                        <li>credenciais, cookies, tokens ou cabeçalhos;</li>
                        <li>histórico de navegação ou conteúdo de outras abas;</li>
                        <li>requisições ou respostas de rede;</li>
                        <li>áudio, vídeo ou screenshots;</li>
                        <li>regras internas, acertos, erros ou objetivos do jogo.</li>
                    </ul>
                </section>

                <section className="privacidade-observa-card">
                    <h2>Armazenamento e transmissão</h2>
                    <p>
                        A telemetria permanece em memória enquanto a sessão está ativa. O
                        armazenamento temporário da sessão do navegador é usado somente para o
                        estado técnico necessário à autorização de um jogo incorporado em outro
                        endereço. Cliques e trajetórias não são guardados nesse armazenamento.
                    </p>
                    <p>
                        A extensão não transmite telemetria, analytics ou identificadores ao
                        desenvolvedor, ao LUDUS Acompanha ou a terceiros. Cancelar descarta os
                        registros. Depois do download, o controle do arquivo pertence à pessoa que
                        o baixou.
                    </p>
                </section>

                <section className="privacidade-observa-card">
                    <h2>Permissões do navegador</h2>
                    <dl>
                        <div>
                            <dt>Aba ativa</dt>
                            <dd>Limita a ação à página escolhida pela pessoa usuária.</dd>
                        </div>
                        <div>
                            <dt>Execução local</dt>
                            <dd>Instala e consulta o observador somente na página escolhida.</dd>
                        </div>
                        <div>
                            <dt>Armazenamento da sessão</dt>
                            <dd>Mantém apenas o estado técnico temporário de jogos incorporados.</dd>
                        </div>
                        <div>
                            <dt>Navegação por frames</dt>
                            <dd>Localiza a área do jogo sem ler histórico ou tráfego de rede.</dd>
                        </div>
                        <div>
                            <dt>Acesso opcional ao endereço do jogo</dt>
                            <dd>É solicitado somente quando necessário e após confirmação explícita.</dd>
                        </div>
                    </dl>
                </section>

                <section className="privacidade-observa-card">
                    <h2>Controle da pessoa usuária</h2>
                    <p>
                        Nenhuma captura começa automaticamente. A pessoa precisa localizar o jogo,
                        informar a atividade e iniciar a sessão. Ela pode encerrar e baixar o JSON
                        ou cancelar e descartar os registros.
                    </p>
                    <p>
                        Sem informações fornecidas pelo próprio jogo, o LUDUS Observa não infere
                        atenção, aprendizagem, acertos, erros, fases ou objetivos pedagógicos.
                    </p>
                </section>
            </div>

            <section className="privacidade-observa-contato" aria-labelledby="contato-politica">
                <div>
                    <p className="privacidade-observa-etiqueta">Contato e vigência</p>
                    <h2 id="contato-politica">Dúvidas sobre privacidade</h2>
                    <p>
                        Responsável: Rodrigo Leitzke Bichet, projeto LUDUS Acompanha.
                        <br />
                        Vigência desta versão: 19 de agosto de 2026.
                    </p>
                </div>
                <a className="privacidade-observa-email" href={`mailto:${EMAIL_CONTATO}`}>
                    {EMAIL_CONTATO}
                </a>
            </section>

            <footer className="privacidade-observa-rodape">
                <p>Política aplicável ao LUDUS Observa 0.1.0.</p>
                <Link to="/login">Ir para o LUDUS Acompanha</Link>
            </footer>
        </main>
    );
}
