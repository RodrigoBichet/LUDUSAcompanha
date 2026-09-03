const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { gerarTokenOpaco, resumirToken, expiraEmMinutos } = require("../services/authTokens");
const { enviarEmail } = require("../services/emailService");

const URL_FRONTEND = () => process.env.FRONTEND_URL || "http://localhost:5173";
const normalizarEmail = (email) => String(email || "").trim().toLowerCase();
const senhaValida = (senha) => typeof senha === "string" && senha.length >= 8;
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const gerarToken = (usuario) => jwt.sign(
    { id: usuario._id, authVersion: Number(usuario.authVersion || 0) },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
);
const linkDeDesenvolvimento = (link) =>
    process.env.AUTH_EXPOSE_DEV_LINKS === "true" && process.env.NODE_ENV !== "production" ? link : undefined;

const enviarLink = async ({ usuario, tipo, token }) => {
    const confirmacao = tipo === "confirmacao";
    const caminho = confirmacao ? "confirmar-email" : "redefinir-senha";
    const link = `${URL_FRONTEND()}/${caminho}?token=${encodeURIComponent(token)}`;
    const assunto = confirmacao ? "Confirme seu email no LUDUS Acompanha" : "Redefina sua senha no LUDUS Acompanha";
    const orientacao = confirmacao ? "confirmar seu email" : "criar uma nova senha";
    await enviarEmail({
        para: usuario.email,
        assunto,
        texto: `Acesse o link para ${orientacao}: ${link}. Ele expira em 30 minutos.`,
        html: `<p>Acesse o link abaixo para ${orientacao}:</p><p><a href="${link}">${link}</a></p><p>O link expira em 30 minutos.</p>`,
    });
    return linkDeDesenvolvimento(link);
};

const registrar = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = normalizarEmail(req.body.email);
        const password = req.body.password;
        const institutionName = String(req.body.institutionName || "").trim();
        const institutionCity = String(req.body.institutionCity || "").trim();
        if (!name || !emailValido(email) || !senhaValida(password) || !institutionName) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe nome, email válido, instituição e senha com pelo menos 8 caracteres." });
        }
        if (name.length > 160 || institutionName.length > 160 || institutionCity.length > 120) {
            return res.status(400).json({ sucesso: false, mensagem: "Um dos campos informados ultrapassa o tamanho permitido." });
        }
        if (await User.exists({ email })) return res.status(409).json({ sucesso: false, mensagem: "Email já cadastrado." });

        const token = gerarTokenOpaco();
        const usuario = await User.create({
            name, email, password, role: "professor",
            institutionRequest: {
                name: institutionName,
                city: institutionCity || undefined,
                requestedAt: new Date(),
            },
            emailVerificationTokenHash: resumirToken(token),
            emailVerificationExpiresAt: expiraEmMinutos(30),
        });
        const linkDesenvolvimento = await enviarLink({ usuario, tipo: "confirmacao", token });
        return res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado. Confira seu email para ativar a conta.",
            usuario: {
                id: usuario._id,
                name: usuario.name,
                email: usuario.email,
                role: usuario.role,
                institutionRequest: usuario.institutionRequest,
            },
            ...(linkDesenvolvimento && { linkDesenvolvimento }),
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao registrar:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível concluir o cadastro." });
    }
};

const confirmarEmail = async (req, res) => {
    try {
        const usuario = await User.findOne({
            emailVerificationTokenHash: resumirToken(req.body.token || ""),
            emailVerificationExpiresAt: { $gt: new Date() },
        }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");
        if (!usuario) return res.status(400).json({ sucesso: false, mensagem: "Link inválido ou expirado." });
        usuario.emailVerifiedAt = new Date();
        usuario.emailVerificationTokenHash = undefined;
        usuario.emailVerificationExpiresAt = undefined;
        await usuario.save();
        return res.json({ sucesso: true, mensagem: "Email confirmado. Você já pode entrar." });
    } catch (erro) {
        console.error("[LUDUS] Erro ao confirmar email:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível confirmar o email." });
    }
};

const reenviarConfirmacao = async (req, res) => {
    const mensagem = "Se houver uma conta pendente para esse email, enviaremos uma nova confirmação.";
    try {
        const usuario = await User.findOne({ email: normalizarEmail(req.body.email), emailVerifiedAt: null })
            .select("+emailVerificationTokenHash +emailVerificationExpiresAt");
        let linkDesenvolvimento;
        if (usuario?.emailVerificationTokenHash) {
            const token = gerarTokenOpaco();
            usuario.emailVerificationTokenHash = resumirToken(token);
            usuario.emailVerificationExpiresAt = expiraEmMinutos(30);
            await usuario.save();
            linkDesenvolvimento = await enviarLink({ usuario, tipo: "confirmacao", token });
        }
        return res.json({ sucesso: true, mensagem, ...(linkDesenvolvimento && { linkDesenvolvimento }) });
    } catch (erro) {
        console.error("[LUDUS] Erro ao reenviar confirmação:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível processar a solicitação." });
    }
};

const login = async (req, res) => {
    try {
        const usuario = await User.findOne({ email: normalizarEmail(req.body.email) })
            .select("+emailVerificationTokenHash +authVersion");
        if (!usuario || !req.body.password || !(await usuario.compararSenha(req.body.password))) {
            return res.status(401).json({ sucesso: false, mensagem: "Email ou senha incorretos." });
        }
        if (!usuario.emailVerifiedAt && usuario.emailVerificationTokenHash) {
            return res.status(403).json({ sucesso: false, codigo: "EMAIL_NAO_CONFIRMADO", mensagem: "Confirme seu email antes de entrar." });
        }
        return res.json({
            sucesso: true, token: gerarToken(usuario),
            usuario: { id: usuario._id, name: usuario.name, email: usuario.email, role: usuario.role, institutionId: usuario.institutionId },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao fazer login:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao fazer login." });
    }
};

const solicitarRedefinicaoSenha = async (req, res) => {
    const mensagem = "Se o email estiver cadastrado, enviaremos as instruções para redefinir a senha.";
    try {
        const usuario = await User.findOne({ email: normalizarEmail(req.body.email) });
        let linkDesenvolvimento;
        if (usuario) {
            const token = gerarTokenOpaco();
            usuario.passwordResetTokenHash = resumirToken(token);
            usuario.passwordResetExpiresAt = expiraEmMinutos(30);
            await usuario.save();
            linkDesenvolvimento = await enviarLink({ usuario, tipo: "senha", token });
        }
        return res.json({ sucesso: true, mensagem, ...(linkDesenvolvimento && { linkDesenvolvimento }) });
    } catch (erro) {
        console.error("[LUDUS] Erro ao solicitar redefinição:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível processar a solicitação." });
    }
};

const redefinirSenha = async (req, res) => {
    try {
        if (!senhaValida(req.body.password)) return res.status(400).json({ sucesso: false, mensagem: "A nova senha deve ter pelo menos 8 caracteres." });
        const usuario = await User.findOne({
            passwordResetTokenHash: resumirToken(req.body.token || ""),
            passwordResetExpiresAt: { $gt: new Date() },
        }).select("+passwordResetTokenHash +passwordResetExpiresAt +authVersion");
        if (!usuario) return res.status(400).json({ sucesso: false, mensagem: "Link inválido ou expirado." });
        usuario.password = req.body.password;
        usuario.passwordResetTokenHash = undefined;
        usuario.passwordResetExpiresAt = undefined;
        usuario.authVersion = Number(usuario.authVersion || 0) + 1;
        await usuario.save();
        return res.json({ sucesso: true, mensagem: "Senha redefinida. Entre novamente com a nova senha." });
    } catch (erro) {
        console.error("[LUDUS] Erro ao redefinir senha:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível redefinir a senha." });
    }
};

const perfil = async (req, res) => {
    try {
        const usuario = await User.findById(req.usuarioId).select("-password").populate("institutionId", "name city");
        if (!usuario) return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        return res.json({ sucesso: true, usuario });
    } catch (erro) {
        console.error("[LUDUS] Erro ao buscar perfil:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao buscar perfil." });
    }
};

const atualizarPerfil = async (req, res) => {
    try {
        const { name, email, senhaAtual, novaSenha } = req.body;
        const usuario = await User.findById(req.usuarioId);
        if (!usuario) return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        if (name) usuario.name = String(name).trim();
        if (email && normalizarEmail(email) !== usuario.email) {
            return res.status(400).json({ sucesso: false, mensagem: "A alteração de email exige nova confirmação e ainda não está disponível." });
        }
        if (senhaAtual || novaSenha) {
            if (!senhaAtual || !senhaValida(novaSenha)) return res.status(400).json({ sucesso: false, mensagem: "Informe a senha atual e uma nova senha com pelo menos 8 caracteres." });
            if (!(await usuario.compararSenha(senhaAtual))) return res.status(401).json({ sucesso: false, mensagem: "Senha atual incorreta." });
            usuario.password = novaSenha;
        }
        await usuario.save();
        return res.json({
            sucesso: true, mensagem: "Perfil atualizado com sucesso.",
            usuario: { id: usuario._id, name: usuario.name, email: usuario.email, role: usuario.role, institutionId: usuario.institutionId },
        });
    } catch (erro) {
        console.error("[LUDUS] Erro ao atualizar perfil:", erro.message);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar perfil." });
    }
};

module.exports = { registrar, confirmarEmail, reenviarConfirmacao, login, solicitarRedefinicaoSenha, redefinirSenha, perfil, atualizarPerfil };
