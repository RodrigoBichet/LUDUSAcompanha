export const MODO_ANONIMO = import.meta.env.VITE_MODO_ANONIMO === "true";

export const textosAnonimos = {
    sidebarInstitucional: MODO_ANONIMO
        ? "Versao anonima para avaliacao"
        : "UFPel — 2026",

    sidebarVersao: MODO_ANONIMO ? "LUDUS Acompanha" : "LUDUS Acompanha v1.0",

    loginRodape: MODO_ANONIMO
        ? "LUDUS Acompanha — versao anonima"
        : "UFPel — LUDUS Acompanha v1.0",

    pdfSubtitulo: MODO_ANONIMO
        ? "Ferramenta de Monitoramento Educacional"
        : "Ferramenta de Monitoramento Educacional — UFPel",

    pdfProfessor: MODO_ANONIMO ? "Professor(a) demonstrativo(a)" : null,

    pdfRodape: MODO_ANONIMO
        ? `Documento gerado para demonstracao anonima | ${new Date().getFullYear()}`
        : `UFPel — Universidade Federal de Pelotas | ${new Date().getFullYear()}`,
};
