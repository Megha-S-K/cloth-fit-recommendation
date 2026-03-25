import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import LiveCaptureInline from "../components/LiveCaptureInline";
import { updateImage } from "../api";

const SHAPE_DESC = {
    "Hourglass":         "Balanced shoulders and hips with defined waist.",
    "Pear":              "Hips notably wider than shoulders.",
    "Inverted Triangle": "Shoulders broader than hips.",
    "Rectangle":         "Shoulders and hips roughly equal — minimal waist definition.",
    "Apple":             "Fuller midsection relative to shoulders and hips.",
    };

    export default function ProfilePage({ user, token, onNavigate, onLogout, onUserUpdate }) {
    const [captureMode, setCaptureMode] = useState("upload");
    const [imageFile, setImageFile]     = useState(null);
    const [preview, setPreview]         = useState(null);
    const [dragOver, setDragOver]       = useState(false);
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState("");
    const [error, setError]             = useState("");
    const fileRef = useRef();

    const initials = user.name
        ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const confPct = user.measurement_confidence
        ? Math.round(user.measurement_confidence * 100) : null;
    const confColor = confPct >= 70 ? "#3d7a5e" : confPct >= 50 ? "#b8963e" : "#8a3030";

    const handleFile = (file) => {
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
        setSuccess(""); setError("");
    };

    const handleWebcamCapture = (file, previewUrl) => {
        setImageFile(file);
        setPreview(previewUrl);
        setCaptureMode("upload");
    };

    const clearPhoto = () => { setImageFile(null); setPreview(null); };

    const handleUpdate = async () => {
        if (!imageFile) return;
        setError(""); setSuccess(""); setLoading(true);
        try {
        const res = await updateImage(token, imageFile);
        onUserUpdate(res.user);
        setSuccess("Measurements updated successfully.");
        clearPhoto();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="page">
        <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="profile" />

        <div className="page-inner">
            {/* Identity */}
            <div className="card card-padded" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500, marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--slate-400)" }}>{user.email}</div>
            </div>
            {user.body_shape && (
                <span className="badge badge-gold" style={{ fontSize: "0.78rem" }}>{user.body_shape}</span>
            )}
            </div>

            <div className="profile-grid">
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Body profile */}
                <div className="card card-padded">
                <p className="section-eyebrow">Measurements</p>
                <h2 className="section-title" style={{ marginBottom: 16 }}>Your body profile</h2>

                <div className="stat-tiles" style={{ marginBottom: 16 }}>
                    {[
                    { val: user.body_shape || "—", label: "Body Shape" },
                    { val: user.r1 ? user.r1.toFixed(4) : "—", label: "R1 (Chest/Hip)" },
                    { val: user.r2 ? user.r2.toFixed(4) : "—", label: "R2 (Torso/Leg)" },
                    { val: confPct !== null ? `${confPct}%` : "—", label: "Confidence" },
                    ].map(s => (
                    <div className="stat-tile" key={s.label}>
                        <div className="stat-tile-val">{s.val}</div>
                        <div className="stat-tile-label">{s.label}</div>
                    </div>
                    ))}
                </div>

                {/* Confidence bar */}
                {confPct !== null && (
                    <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--slate-400)", marginBottom: 4 }}>
                        <span>Measurement confidence</span>
                        <span style={{ fontWeight: 600, color: confColor }}>{confPct}%</span>
                    </div>
                    <div className="conf-bar-wrap">
                        <div className="conf-bar-fill" style={{ width: `${confPct}%`, background: confColor }} />
                    </div>
                    {confPct < 70 && (
                        <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--slate-400)", lineHeight: 1.5 }}>
                        Confidence below 70% — re-uploading a better photo may improve recommendations.
                        </p>
                    )}
                    </>
                )}

                {user.body_shape && SHAPE_DESC[user.body_shape] && (
                    <div className="alert alert-info" style={{ marginTop: 14 }}>
                    <span>◈</span>
                    <span><strong>{user.body_shape} —</strong> {SHAPE_DESC[user.body_shape]}</span>
                    </div>
                )}
                </div>

                {/* Sign out */}
                <div className="card card-padded">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>Sign out</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--slate-400)" }}>You'll need to sign in again to access recommendations.</div>
                    </div>
                    <button className="btn btn-outline" onClick={onLogout}>Sign out</button>
                </div>
                </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Update photo */}
                <div className="card card-padded">
                <p className="section-eyebrow">Re-analyse</p>
                <h2 className="section-title" style={{ marginBottom: 6 }}>Update body photo</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--slate-400)", marginBottom: 20, lineHeight: 1.6 }}>
                    Upload a new photo to recalculate your measurements. Previous measurements are replaced immediately. Your photo is never stored.
                </p>

                {error   && <div className="alert alert-error"   style={{ marginBottom: 14 }}><span>—</span><span>{error}</span></div>}
                {success && <div className="alert alert-success" style={{ marginBottom: 14 }}><span>✓</span><span>{success}</span></div>}

                {/* Tab toggle */}
                <div className="capture-tabs">
                    <button
                    type="button"
                    className={`capture-tab ${captureMode === "upload" ? "active" : ""}`}
                    onClick={() => setCaptureMode("upload")}
                    >Upload photo</button>
                    <button
                    type="button"
                    className={`capture-tab ${captureMode === "webcam" ? "active" : ""}`}
                    onClick={() => { setCaptureMode("webcam"); clearPhoto(); }}
                    >Use webcam</button>
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

                {imageFile && (
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="btn btn-gold" onClick={handleUpdate} disabled={loading}>
                        {loading ? <><span className="spinner" />Analysing…</> : "Update measurements"}
                    </button>
                    <button className="btn btn-outline" onClick={clearPhoto}>Cancel</button>
                    </div>
                )}
                </div>

                {/* Guidelines */}
                <div className="card card-padded">
                <p className="section-eyebrow">Photo tips</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    {[
                    ["✓", "green", "Full body in frame"],
                    ["✓", "green", "Face the camera"],
                    ["✓", "green", "Fitted clothing"],
                    ["✓", "green", "Good lighting"],
                    ["✗", "red",   "Side-facing pose"],
                    ["✗", "red",   "Loose clothing"],
                    ].map(([icon, col, text]) => (
                    <div key={text} style={{ display: "flex", gap: 8, fontSize: "0.82rem", color: "var(--slate-500)" }}>
                        <span style={{ color: col === "green" ? "var(--green)" : "var(--red)", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                        <span>{text}</span>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </div>

        <footer className="page-footer">SmartFit AI · Size Intelligence</footer>
        </div>
    );
}