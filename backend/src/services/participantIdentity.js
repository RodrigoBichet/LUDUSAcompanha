// =============================================================================
// participantIdentity.js
// Normalização mínima do nome informado conscientemente no pareamento.
// =============================================================================

const normalizarIdentidadeParticipante = (valor) => {
    const displayName = String(valor || "")
        .normalize("NFC")
        .replace(/\s+/g, " ")
        .trim();

    if (
        displayName.length < 2 ||
        displayName.length > 120 ||
        /[\u0000-\u001F\u007F]/.test(displayName)
    ) {
        throw new Error("Informe um nome válido de 2 a 120 caracteres.");
    }

    const normalizedName = displayName
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLocaleLowerCase("pt-BR");

    return { displayName, normalizedName };
};

module.exports = { normalizarIdentidadeParticipante };
