import { useState, useRef } from "react";
import LiveCaptureInline from "../components/LiveCaptureInline";
import { register } from "../api";

export default function RegisterPage({ onLogin, onNavigate }) {
    const [form, setForm]           = useState({ name: "", email: "", password: "" });
    const [captureMode, setCaptureMode] = useState("upload"); // "upload" | "webcam"
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview]     = useState(null);
    const [dragOver, setDragOver]   = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const fileRef = useRef();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleFile = (file) => {
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
        setError("");
    };

    // Called by LiveCaptureInline when auto-capture succeeds
    const handleWebcamCapture = (file, previewUrl) => {
        setImageFile(file);
        setPreview(previewUrl);
        setCaptureMode("upload"); // show preview in upload view
    };

    const clearPhoto = () => { setImageFile(null); setPreview(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) { setError("Please provide a body photo to continue."); return; }
        setError(""); setLoading(true);
        try {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("email", form.email);
        fd.append("password", form.password);
        fd.append("image", imageFile);
        const data = await register(fd);
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

        <div className="auth-body" style={{ alignItems: "flex-start", paddingTop: 40 }}>
            {/* Form panel */}
            <div className="auth-panel" style={{ maxWidth: 460 }}>
            <p className="section-eyebrow">Get started</p>
            <h1 className="auth-panel-title">Create account</h1>
            <div className="gold-line" style={{ margin: "14px 0 28px" }} />

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <span>—</span><span>{error}</span>
                </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-field">
                <label className="form-label" htmlFor="name">Full name</label>
                <input
                    id="name" className="form-input" type="text"
                    value={form.name} onChange={set("name")}
                    placeholder="Your name" required autoFocus
                />
                </div>

                <div className="form-field">
                <label className="form-label" htmlFor="reg-email">Email address</label>
                <input
                    id="reg-email" className="form-input" type="email"
                    value={form.email} onChange={set("email")}
                    placeholder="you@example.com" required autoComplete="email"
                />
                </div>

                <div className="form-field">
                <label className="form-label" htmlFor="reg-pass">Password</label>
                <input
                    id="reg-pass" className="form-input" type="password"
                    value={form.password} onChange={set("password")}
                    placeholder="Minimum 8 characters" required minLength={8}
                    autoComplete="new-password"
                />
                </div>

                {/* Photo capture section */}
                <div className="form-field">
                <label className="form-label">Body photo</label>

                {/* Tab toggle */}
                <div className="capture-tabs">
                    <button
                    type="button"
                    className={`capture-tab ${captureMode === "upload" ? "active" : ""}`}
                    onClick={() => setCaptureMode("upload")}
                    >
                    Upload photo
                    </button>
                    <button
                    type="button"
                    className={`capture-tab ${captureMode === "webcam" ? "active" : ""}`}
                    onClick={() => { setCaptureMode("webcam"); clearPhoto(); }}
                    >
                    Use webcam
                    </button>
                </div>

                {captureMode === "upload" && (
                    <>
                    {preview ? (
                        <div style={{ position: "relative" }}>
                        <img src={preview} alt="Preview" className="upload-preview" />
                        <button
                            type="button"
                            className="btn-ghost"
                            style={{ marginTop: 6, padding: "4px 0", fontSize: "0.78rem" }}
                            onClick={clearPhoto}
                        >
                            Remove photo
                        </button>
                        </div>
                    ) : (
                        <div
                        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                        onClick={() => fileRef.current.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        >
                        <div className="upload-zone-icon">↑</div>
                        <div className="upload-zone-title">Drop photo or click to browse</div>
                        <div className="upload-zone-sub">Full body · Front-facing · Fitted clothing</div>
                        </div>
                    )}
                    <input
                        ref={fileRef} type="file" accept="image/*"
                        style={{ display: "none" }}
                        onChange={e => handleFile(e.target.files[0])}
                    />
                    </>
                )}

                {captureMode === "webcam" && (
                    <LiveCaptureInline
                    onCapture={handleWebcamCapture}
                    onCancel={() => setCaptureMode("upload")}
                    />
                )}

                <div className="alert alert-info" style={{ marginTop: 8 }}>
                    <span>ℹ</span>
                    <span>Your photo is never stored. Only body proportion ratios are saved.</span>
                </div>
                </div>

                <button
                className="btn btn-gold btn-full"
                type="submit"
                disabled={loading}
                style={{ marginTop: 4 }}
                >
                {loading
                    ? <><span className="spinner" />Analysing photo…</>
                    : "Create account"
                }
                </button>
            </form>

            <div className="divider" style={{ margin: "20px 0" }}>already have an account</div>
            <button className="btn btn-outline btn-full" onClick={() => onNavigate("login")}>
                Sign in
            </button>
            </div>

            {/* Aside — photo guidelines */}
            <div className="auth-aside">
            <div className="auth-aside-card">
                <div className="auth-aside-tag">✦ Photo guidelines</div>
                <h2 className="auth-aside-title">
                For the best<br /><em>measurement accuracy</em>
                </h2>
                <div className="auth-aside-list">
                {[
                    ["✓", "Full body visible head to feet"],
                    ["✓", "Standing straight, facing camera directly"],
                    ["✓", "Arms relaxed at sides"],
                    ["✓", "Fitted clothing — not baggy"],
                    ["✓", "Plain background, good lighting"],
                    ["✓", "1.5 – 2 metres from the camera"],
                    ["✗", "Side or back-facing poses"],
                    ["✗", "Loose or oversized clothing"],
                ].map(([icon, text]) => (
                    <div className="auth-aside-item" key={text}>
                    <div
                        className="auth-aside-icon"
                        style={{
                        background: icon === "✓" ? "rgba(61,122,94,0.2)" : "rgba(138,48,48,0.2)",
                        color: icon === "✓" ? "#7dd3ae" : "#d08080",
                        }}
                    >
                        {icon}
                    </div>
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