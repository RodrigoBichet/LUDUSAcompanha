import RotaProtegida from "./RotaProtegida";

// O backend resolve se o contexto autenticado é escolar real ou laboratório.
// A interface precisa apenas garantir que exista uma sessão válida.
export default function RotaContextoAcompanhamento({ children }) {
    return <RotaProtegida>{children}</RotaProtegida>;
}
