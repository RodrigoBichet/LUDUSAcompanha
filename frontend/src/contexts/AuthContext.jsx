// =============================================================================
// AuthContext.jsx
// LUDUS Acompanha — UFPel (2026)
// Autor: Rodrigo Leitzke Bichet
//
// Contexto compartilhado e hook de autenticação.
// =============================================================================

import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}
