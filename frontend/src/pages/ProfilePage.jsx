import { useState, useRef } from "react";
import { register } from "../api";

export default function RegisterPage({ onLogin, onNavigate }) {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleFile = (file) => {
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) { setError("Please upload a full-body photo."); return; }
        setError(""); setLoading(true);
        try {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("email", form.email);
        fd.append("password", form.password);
        fd.append("image", imageFile);
        const data = await register(fd);
        onLogin(data);
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-layout" style={{ gridTemplateColumns: "1fr 1.2fr" }}>
        {/* Left visual */}
        <div className="auth-visual">
            <div className="auth-visual-bg" />
            <div className="auth-visual-content">
            <div className="auth-visual-tag">✦ Privacy First</div>
            <h1 className="auth-visual-headline">
                Your photo is <em>never stored</em> — just your measurements.
            </h1>
            <p className="auth-visual-sub">
                We use MediaPipe BlazePose to extract body landmarks from your photo and compute proportions. The photo is discarded immediately — only your ratios are saved.
            </p>
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                {["📷 Full-body, front-facing photo", "🦺 Fitted clothing preferred", "💡 Good lighting, plain background", "📏 1.5–2 metres from camera"].map(t => (
                <div key={t} style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>{t}</div>
                ))}
            </div>
            </div>
        </div>

        {/* Right form */}
        <div className="auth-form-side">
            <div className="auth-form-box" style={{ maxWidth: 480 }}>
            <div className="auth-form-logo">Smart<span>Fit</span> AI</div>
            <h2 className="auth-title">Create account</h2>
            <p className="auth-sub">Upload a photo and we'll extract your measurements automatically.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Your name" value={form.name} onChange={set("name")} required />
                </div>

                <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email" />
                </div>

                <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" />
                </div>

                {/* Photo upload */}
                <div className="form-group">
                <label className="form-label">Body Photo</label>
                <div
                    className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    {preview
                    ? <img src={preview} alt="Preview" className="upload-preview" />
                    : <>
                        <div className="upload-zone-icon">🖼️</div>
                        <div className="upload-zone-title">Drop photo here or click to browse</div>
                        <div className="upload-zone-sub">JPG, PNG · Full body, front-facing</div>
                        </>
                    }
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                {preview && (
                    <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => { setImageFile(null); setPreview(null); }}>
                    ✕ Remove photo
                    </button>
                )}
                </div>

                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Analysing photo…</> : "Create Account →"}
                </button>
            </form>

            <p className="auth-switch">
                Already have an account?{" "}
                <button onClick={() => onNavigate("login")}>Sign in</button>
            </p>
            </div>
        </div>
        </div>
    );
}