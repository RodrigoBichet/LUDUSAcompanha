// =============================================================================
// pairingAttemptLimiter.js
// Limite local de falhas de pareamento sem conservar endereço IP legível.
// Adequado ao piloto em uma única instância; escala horizontal exigirá store
// compartilhado, como Redis.
// =============================================================================

const crypto = require("crypto");
const { normalizarCodigoColeta } = require("./collectionCode");

const JANELA_MS = 10 * 60 * 1000;
const LIMITE_POR_IP_E_CODIGO = 20;
const LIMITE_GLOBAL_POR_IP = 60;
const tentativas = new Map();

const assinarChave = (valor) =>
    crypto
        .createHmac("sha256", process.env.JWT_SECRET)
        .update(`collection-pairing-attempt:v1:${valor}`)
        .digest("hex");

const obterIdentificadorIp = (ip) => String(ip || "ip-indisponivel").slice(0, 128);

const obterCodigoLimitado = (codigo) => {
    const bruto = String(codigo || "");
    if (bruto.length > 32) return "formato-invalido";
    return normalizarCodigoColeta(bruto) || "vazio";
};

const obterChaves = (ip, codigo) => {
    const ipAssinado = assinarChave(obterIdentificadorIp(ip));
    return {
        global: `ip:${ipAssinado}`,
        codigo: `codigo:${ipAssinado}:${assinarChave(obterCodigoLimitado(codigo))}`,
    };
};

const obterContagemAtual = (chave, agora) => {
    const estado = tentativas.get(chave);
    if (!estado || agora - estado.inicio >= JANELA_MS) {
        tentativas.delete(chave);
        return 0;
    }
    return estado.quantidade;
};

const pareamentoEstaLimitado = (ip, codigo, agora = Date.now()) => {
    const chaves = obterChaves(ip, codigo);
    return (
        obterContagemAtual(chaves.global, agora) >= LIMITE_GLOBAL_POR_IP ||
        obterContagemAtual(chaves.codigo, agora) >= LIMITE_POR_IP_E_CODIGO
    );
};

const incrementar = (chave, agora) => {
    const estado = tentativas.get(chave);
    if (!estado || agora - estado.inicio >= JANELA_MS) {
        tentativas.set(chave, { inicio: agora, quantidade: 1 });
        return;
    }
    estado.quantidade += 1;
};

const registrarFalhaPareamento = (ip, codigo, agora = Date.now()) => {
    const chaves = obterChaves(ip, codigo);
    incrementar(chaves.global, agora);
    incrementar(chaves.codigo, agora);
};

const limparTentativasPareamento = () => tentativas.clear();

module.exports = {
    limparTentativasPareamento,
    pareamentoEstaLimitado,
    registrarFalhaPareamento,
};
