const fs = require("fs");
const path = require("path");
const Session = require("../models/Session");

const PASTA_SCREENSHOTS = path.join(__dirname, "../../uploads/screenshots");

const removerArquivoScreenshot = (caminhoPublico) => {
    if (!caminhoPublico) return false;

    const nomeArquivo = path.basename(caminhoPublico);
    const caminhoCompleto = path.resolve(PASTA_SCREENSHOTS, nomeArquivo);
    const pastaSegura = path.resolve(PASTA_SCREENSHOTS) + path.sep;

    if (!caminhoCompleto.startsWith(pastaSegura)) return false;
    if (!fs.existsSync(caminhoCompleto)) return false;

    try {
        fs.unlinkSync(caminhoCompleto);
        return true;
    } catch (erro) {
        console.warn(
            `[LUDUS] Não foi possível remover screenshot: ${nomeArquivo}`,
            erro.message,
        );
        return false;
    }
};

const removerSessoesPorFiltro = async (filtro) => {
    const sessoes = await Session.find(filtro).select("screenshots");

    let arquivosRemovidos = 0;

    for (const sessao of sessoes) {
        for (const screenshot of sessao.screenshots || []) {
            if (removerArquivoScreenshot(screenshot.caminho)) {
                arquivosRemovidos += 1;
            }
        }
    }

    const resultado = await Session.deleteMany(filtro);

    return {
        sessoesRemovidas: resultado.deletedCount,
        arquivosRemovidos,
    };
};

module.exports = { removerSessoesPorFiltro };
