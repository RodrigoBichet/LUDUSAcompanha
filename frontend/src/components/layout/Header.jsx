import "./Header.css";

export default function Header({ titulo, subtitulo }) {
    return (
        <header className="header">
            <div>
                <h1 className="header-titulo">{titulo}</h1>
                {subtitulo && <p className="header-subtitulo">{subtitulo}</p>}
            </div>
        </header>
    );
}
