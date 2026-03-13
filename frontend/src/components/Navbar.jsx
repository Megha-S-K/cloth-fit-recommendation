export default function Navbar({ onNavigate, onLogout, currentPage }) {
    return (
        <nav className="navbar">
        <a className="navbar-logo" onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
            Smart<span>Fit</span> AI
        </a>
        <div className="navbar-actions">
            <button
            className={`btn btn-ghost ${currentPage === "home" ? "btn-secondary" : ""}`}
            onClick={() => onNavigate("home")}
            style={currentPage === "home" ? { background: "var(--off)", color: "var(--ink)", fontSize: "0.88rem" } : { fontSize: "0.88rem" }}
            >
            🔍 Recommend
            </button>
            <button
            className={`btn btn-ghost`}
            onClick={() => onNavigate("profile")}
            style={{ fontSize: "0.88rem" }}
            >
            👤 Profile
            </button>
            <button className="btn btn-outline" onClick={onLogout} style={{ fontSize: "0.85rem", padding: "10px 20px" }}>
            Sign Out
            </button>
        </div>
        </nav>
    );
}