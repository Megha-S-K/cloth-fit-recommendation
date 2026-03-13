import { useState } from "react";
import { login } from "../api";

export default function LoginPage({ onLogin, onNavigate }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
        const data = await login(email, password);
        onLogin(data);
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
        {/* Left visual panel */}
        <div className="auth-visual">
            <div className="auth-visual-bg" />
            <div className="auth-visual-content">
            <div className="auth-visual-tag">✦ AI-Powered Fit</div>
            <h1 className="auth-visual-headline">
                Find your <em>perfect fit</em>,<br />every single time.
            </h1>
            <p className="auth-visual-sub">
                SmartFit AI uses your body proportions to recommend the right size across 9 top brands — no measuring tape needed.
            </p>
            </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-side">
            <div className="auth-form-box">
            <div className="auth-form-logo">Smart<span>Fit</span> AI</div>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-sub">Sign in to get your personalized size recommendations.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                </div>

                <div className="form-group">
                <label className="form-label">Password</label>
                <input
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in…</> : "Sign In →"}
                </button>
            </form>

            <p className="auth-switch">
                Don't have an account?{" "}
                <button onClick={() => onNavigate("register")}>Create one free</button>
            </p>
            </div>
        </div>
    </div>
  );
}