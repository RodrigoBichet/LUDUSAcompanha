const crypto = require("crypto");

const gerarTokenOpaco = () => crypto.randomBytes(32).toString("hex");
const resumirToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const expiraEmMinutos = (minutos) => new Date(Date.now() + minutos * 60 * 1000);

module.exports = { gerarTokenOpaco, resumirToken, expiraEmMinutos };
