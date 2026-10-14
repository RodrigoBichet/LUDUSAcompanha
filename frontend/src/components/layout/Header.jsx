import "./Header.css";

export default function Header({ titulo }) {
    return (
        <header className="header">
            <div>
                <h1 className="header-titulo">{titulo}</h1>
            </div>
        </header>
    );
}
