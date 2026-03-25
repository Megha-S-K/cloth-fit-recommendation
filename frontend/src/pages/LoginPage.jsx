import { useState } from "react";
import { login } from "../api";

export default function LoginPage({ onLogin, onNavigate }) {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
        const data = await login(email, password);
        onLogin(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-wrap">
        <header className="auth-header">
            <div className="auth-logo">
            SmartFit<span style={{ color: "var(--gold)" }}>·</span>AI
            </div>
        </header>

        <div className="auth-body">
            {/* Form panel */}
            <div className="auth-panel">
            <p className="section-eyebrow">Welcome back</p>
            <h1 className="auth-panel-title">Sign in</h1>
            <div className="gold-line" style={{ margin: "14px 0 28px" }} />

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <span>—</span><span>{error}</span>
                </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-field">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                    id="email" className="form-input" type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoComplete="email" autoFocus
                />
                </div>

                <div className="form-field">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                    id="password" className="form-input" type="password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                />
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" />Signing in…</> : "Continue"}
                </button>
            </form>

            <div className="divider" style={{ margin: "24px 0" }}>or</div>

            <button
                className="btn btn-outline btn-full"
                onClick={() => onNavigate("register")}
            >
                Create an account
            </button>
            </div>

            {/* Aside */}
            <div className="auth-aside">
            <div className="auth-aside-card">
                <div className="auth-aside-tag">✦ AI-Powered</div>
                <h2 className="auth-aside-title">
                Your perfect fit,<br /><em>every time</em>
                </h2>
                <p className="auth-aside-body">
                SmartFit AI reads your body proportions from a single photo and recommends the exact size across 9 major brands.
                </p>
                <div className="auth-aside-list">
                {[
                    ["✦", "No tape measure needed"],
                    ["✦", "9 brands, 474 size chart entries"],
                    ["✦", "Confidence score on every recommendation"],
                    ["✦", "Photo discarded immediately after analysis"],
                ].map(([icon, text]) => (
                    <div className="auth-aside-item" key={text}>
                    <div className="auth-aside-icon">{icon}</div>
                    <span>{text}</span>
                    </div>
                ))}
                </div>
            </div>
            </div>
        </div>

        <footer className="page-footer">
            SmartFit AI · Size Intelligence
        </footer>
        </div>
    );
}