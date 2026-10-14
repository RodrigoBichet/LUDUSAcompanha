import "./MarcaLudus.css";

export default function MarcaLudus({ clara = false, compacta = false }) {
    return (
        <span
            className={`marca-ludus${clara ? " marca-ludus-clara" : ""}${
                compacta ? " marca-ludus-compacta" : ""
            }`}
            aria-label="LUDUS Acompanha"
        >
            <span className="marca-ludus-principal">LUDUS</span>
            <span className="marca-ludus-complemento">ACOMPANHA</span>
        </span>
    );
}
