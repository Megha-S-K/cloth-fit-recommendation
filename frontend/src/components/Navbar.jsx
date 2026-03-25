export default function Navbar({ user, onNavigate, onLogout, currentPage }) {
    const first = user?.name?.split(" ")[0] || "Account";
    return (
        <nav className="navbar">
        <div className="nav-logo" onClick={() => onNavigate("home")}>
            SmartFit<span className="nav-logo-dot">·</span>AI
            <span className="nav-logo-sub">Size Intelligence</span>
        </div>
        <div className="nav-spacer" />
        <button
            className={`nav-link ${currentPage === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
        >
            Recommend
        </button>
        <div className="nav-sep" />
        <button
            className={`nav-link ${currentPage === "profile" ? "active" : ""}`}
            onClick={() => onNavigate("profile")}
        >
            {first}
        </button>
        <div className="nav-sep" />
        <button className="nav-link" onClick={onLogout}>Sign out</button>
        </nav>
    );
}