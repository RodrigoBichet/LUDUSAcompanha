// =============================================================================
// collectionCode.js
// Gera e compara códigos temporários sem persistir o valor legível no banco.
// =============================================================================

const crypto = require("crypto");

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO_CODIGO = 6;

const normalizarCodigoColeta = (codigo) =>
    String(codigo || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .replace(/^LUDUS/, "");

const formatarCodigoColeta = (codigoNormalizado) =>
    `${codigoNormalizado.slice(0, 3)}-${codigoNormalizado.slice(3)}`;

const gerarCodigoNormalizado = () => {
    let codigo = "";
    while (codigo.length < TAMANHO_CODIGO) {
        const byte = crypto.randomBytes(1)[0];
        if (byte >= 224) continue;
        codigo += ALFABETO[byte % ALFABETO.length];
    }
    return codigo;
};

const obterSegredo = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET não configurado para proteger o código da coleta.");
    }
    return process.env.JWT_SECRET;
};

const calcularHashCodigoColeta = (codigo) =>
    crypto
        .createHmac("sha256", obterSegredo())
        .update(
            `collection-pairing-code:v1:${normalizarCodigoColeta(codigo)}`,
        )
        .digest("hex");

const gerarCredencialColeta = () => {
    const codigoNormalizado = gerarCodigoNormalizado();
    const codigo = formatarCodigoColeta(codigoNormalizado);
    return {
        codigo,
        hash: calcularHashCodigoColeta(codigoNormalizado),
    };
};

const codigoColetaTemFormatoValido = (codigo) => {
    const normalizado = normalizarCodigoColeta(codigo);
    return (
        normalizado.length === TAMANHO_CODIGO &&
        [...normalizado].every((caractere) => ALFABETO.includes(caractere))
    );
};

const compararCodigoColeta = (codigo, hashEsperado) => {
    if (!codigoColetaTemFormatoValido(codigo)) return false;
    if (!/^[a-f0-9]{64}$/.test(String(hashEsperado || ""))) return false;

    const hashRecebido = calcularHashCodigoColeta(codigo);
    return crypto.timingSafeEqual(
        Buffer.from(hashRecebido, "hex"),
        Buffer.from(hashEsperado, "hex"),
    );
};

module.exports = {
    calcularHashCodigoColeta,
    codigoColetaTemFormatoValido,
    compararCodigoColeta,
    gerarCredencialColeta,
    normalizarCodigoColeta,
};
