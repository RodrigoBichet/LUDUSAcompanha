const NOMES_CONHECIDOS = {
    "para-que-serve": "Para Que Serve?",
    "historietas-divertidas": "Historietas Divertidas",
};

export const humanizarGameId = (gameId) =>
    String(gameId || "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\p{L}/gu, (letra) => letra.toLocaleUpperCase("pt-BR"))
        .trim();

export const criarMapaNomesJogos = (jogos = []) => {
    const nomes = new Map(Object.entries(NOMES_CONHECIDOS));

    for (const jogo of jogos) {
        if (!jogo?.gameId) continue;
        const nomeRegistrado = String(jogo.name || "").trim();
        nomes.set(
            jogo.gameId,
            nomeRegistrado && nomeRegistrado !== jogo.gameId
                ? nomeRegistrado
                : humanizarGameId(jogo.gameId),
        );
    }

    return nomes;
};

export const obterNomeJogo = (gameId, nomesJogos) =>
    nomesJogos?.get(gameId) ||
    NOMES_CONHECIDOS[gameId] ||
    humanizarGameId(gameId) ||
    "Jogo não identificado";
