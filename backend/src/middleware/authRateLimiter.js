const crypto = require("crypto");

const registros = new Map();

const resumir = (valor) =>
    crypto.createHash("sha256").update(String(valor)).digest("hex").slice(0, 16);

const criarLimitadorAuth = ({ nome, maximo, janelaMs, incluirEmail = false }) =>
    (req, res, next) => {
        const agora = Date.now();
        const email = incluirEmail ? String(req.body?.email || "").trim().toLowerCase() : "";
        const chave = `${nome}:${resumir(`${req.ip}:${email}`)}`;
        const atual = registros.get(chave);

        if (!atual || atual.expiraEm <= agora) {
            registros.set(chave, { tentativas: 1, expiraEm: agora + janelaMs });
            return next();
        }

        if (atual.tentativas >= maximo) {
            const segundos = Math.max(1, Math.ceil((atual.expiraEm - agora) / 1000));
            res.set("Retry-After", String(segundos));
            return res.status(429).json({
                sucesso: false,
                mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
            });
        }

        atual.tentativas += 1;
        return next();
    };

const limparLimitadoresAuth = () => registros.clear();

module.exports = { criarLimitadorAuth, limparLimitadoresAuth };
