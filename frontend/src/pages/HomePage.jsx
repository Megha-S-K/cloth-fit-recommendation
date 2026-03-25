import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
    getGenders, getBrands, getCategories,
    getProductTypes, getGarmentTypes, recommendSize
    } from "../api";

    const RISK_CLASS = { Low: "badge-green", Medium: "badge-amber", High: "badge-red" };

    function useOptions() {
    const [opts, setOpts] = useState({ genders: [], brands: [], categories: [], productTypes: [], garmentTypes: [] });
    const [sel, setSel]   = useState({ gender: "", brand: "", category: "", productType: "", garmentType: "" });

    const set = (k) => (v) => setSel(s => {
        const n = { ...s, [k]: v };
        if (k === "gender")      { n.brand = ""; n.category = ""; n.productType = ""; n.garmentType = ""; }
        if (k === "brand")       { n.category = ""; n.productType = ""; n.garmentType = ""; }
        if (k === "category")    { n.productType = ""; n.garmentType = ""; }
        if (k === "productType") { n.garmentType = ""; }
        return n;
    });

    useEffect(() => { getGenders().then(g => setOpts(o => ({ ...o, genders: g }))).catch(console.error); }, []);
    useEffect(() => {
        if (sel.gender) getBrands(sel.gender).then(b => setOpts(o => ({ ...o, brands: b }))).catch(console.error);
        else setOpts(o => ({ ...o, brands: [], categories: [], productTypes: [], garmentTypes: [] }));
    }, [sel.gender]);
    useEffect(() => {
        if (sel.brand) getCategories(sel.gender, sel.brand).then(c => setOpts(o => ({ ...o, categories: c }))).catch(console.error);
        else setOpts(o => ({ ...o, categories: [], productTypes: [], garmentTypes: [] }));
    }, [sel.brand]);
    useEffect(() => {
        if (sel.category) getProductTypes(sel.gender, sel.brand, sel.category).then(p => setOpts(o => ({ ...o, productTypes: p }))).catch(console.error);
        else setOpts(o => ({ ...o, productTypes: [], garmentTypes: [] }));
    }, [sel.category]);
    useEffect(() => {
        if (sel.productType) getGarmentTypes(sel.gender, sel.brand, sel.category, sel.productType).then(g => setOpts(o => ({ ...o, garmentTypes: g }))).catch(console.error);
        else setOpts(o => ({ ...o, garmentTypes: [] }));
    }, [sel.productType]);

    return { opts, sel, set };
    }

    export default function HomePage({ user, token, onNavigate, onLogout }) {
    const { opts, sel, set } = useOptions();
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [result, setResult]   = useState(null);
    const [history, setHistory] = useState([]);

    const steps = [
        { key: "gender",      label: "Gender",       list: opts.genders,      dep: true },
        { key: "brand",       label: "Brand",        list: opts.brands,       dep: !!sel.gender },
        { key: "category",    label: "Category",     list: opts.categories,   dep: !!sel.brand },
        { key: "productType", label: "Product type", list: opts.productTypes, dep: !!sel.category },
        { key: "garmentType", label: "Garment type", list: opts.garmentTypes, dep: !!sel.productType },
    ];

    const ready = steps.every(s => !!sel[s.key]);

    const handleRecommend = async () => {
        if (!ready) return;
        setError(""); setLoading(true); setResult(null);
        try {
        const res = await recommendSize(token, {
            gender: sel.gender, brand: sel.brand,
            category: sel.category, product_type: sel.productType, garment_type: sel.garmentType,
        });
        setResult(res);
        setHistory(h => [res, ...h].slice(0, 10));
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const confPct = result ? Math.round(result.confidence * 100) : 0;
    const confColor = confPct >= 70 ? "#3d7a5e" : confPct >= 50 ? "#b8963e" : "#8a3030";

    return (
        <div className="page">
        <Navbar user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="home" />

        {/* Hero bar */}
        <div className="hero-bar">
            <div className="hero-bar-inner">
            <div>
                <div className="hero-greeting">Welcome back, {user.name?.split(" ")[0]}</div>
                <h1 className="hero-title">Find your <em>perfect size</em></h1>
            </div>
            <div className="hero-stats">
                {[
                { val: user.body_shape || "—", label: "Body Shape" },
                { val: user.measurement_confidence ? `${Math.round(user.measurement_confidence * 100)}%` : "—", label: "Confidence" },
                { val: "9", label: "Brands" },
                ].map(s => (
                <div key={s.label}>
                    <div className="hero-stat-val">{s.val}</div>
                    <div className="hero-stat-label">{s.label}</div>
                </div>
                ))}
            </div>
            </div>
        </div>

        <div className="page-inner">
            {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><span>—</span><span>{error}</span></div>}

            <div className="two-col">
            {/* Left: filter panel */}
            <div>
                <div className="card card-padded">
                <p className="section-eyebrow">Step by step</p>
                <h2 className="section-title">Get a recommendation</h2>
                <div className="gold-line" style={{ margin: "10px 0 20px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {steps.map((s, i) => (
                    <div key={s.key}>
                        <div className="step-row">
                        <div className={`step-num ${sel[s.key] ? "done" : s.dep && (i === 0 || sel[steps[i-1]?.key]) ? "active" : ""}`}>
                            {sel[s.key] ? "✓" : i + 1}
                        </div>
                        <span className={`step-label ${!sel[s.key] && s.dep ? "active" : ""}`}>{s.label}</span>
                        </div>
                        <div className="form-select-wrap">
                        <select
                            className="form-select"
                            value={sel[s.key]}
                            onChange={e => set(s.key)(e.target.value)}
                            disabled={!s.dep}
                        >
                            <option value="">— Select —</option>
                            {s.list.map(o => <option key={o}>{o}</option>)}
                        </select>
                        </div>
                    </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 24 }}
                    onClick={handleRecommend}
                    disabled={!ready || loading}
                >
                    {loading
                    ? <><span className="spinner" />Finding your size…</>
                    : "Get recommendation"
                    }
                </button>

                {!ready && (
                    <p style={{ marginTop: 12, textAlign: "center", fontSize: "0.78rem", color: "var(--slate-400)" }}>
                    Complete all 5 selections above
                    </p>
                )}
                </div>

                {/* How it works */}
                <div className="card" style={{ marginTop: 16, padding: "20px 22px" }}>
                <p className="section-eyebrow" style={{ marginBottom: 12 }}>How it works</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                    "Your photo was analysed using MediaPipe BlazePose",
                    "R1 (chest/hip) and R2 (torso/leg) ratios were extracted",
                    "Your ratios are matched against our brand size database",
                    "The closest size is returned with a confidence score",
                    ].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.83rem", color: "var(--slate-500)", textAlign: "left" }}>
                        <span style={{ color: "var(--gold)", fontWeight: 700, flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>
                        <span style={{ lineHeight: 1.5 }}>{t}</span>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            {/* Right: result + history */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {result ? (
                <div className="result-card">
                    <div className="result-eyebrow">{result.brand} · {result.gender} · {result.garment_type}</div>
                    <div className="result-size">{result.recommended_size}</div>
                    <div className="result-brand">Recommended size</div>

                    <div className="result-meta">
                    <span className={`badge ${RISK_CLASS[result.return_risk]}`}>{result.return_risk} return risk</span>
                    <span className="badge badge-slate">{result.product_type}</span>
                    <span className="badge badge-slate">{result.category}</span>
                    </div>

                    <div className="conf-row">
                    <span className="conf-label">Fit confidence</span>
                    <div className="conf-track">
                        <div className="conf-fill" style={{ width: `${confPct}%`, background: confColor }} />
                    </div>
                    <span className="conf-pct" style={{ color: confColor }}>{confPct}%</span>
                    </div>

                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                        ["Matched on", result.matched_on],
                        ["Deviation", `Δ ${result.delta?.toFixed(4)}`],
                    ].map(([k, v]) => (
                        <div key={k}>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{v}</div>
                        </div>
                    ))}
                    </div>

                    {confPct < 50 && (
                    <div style={{ marginTop: 18, padding: "10px 14px", background: "rgba(184,150,62,0.12)", border: "1px solid rgba(184,150,62,0.2)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                        Low confidence — consider updating your photo in Profile for better accuracy.
                    </div>
                    )}
                </div>
                ) : (
                <div className="card">
                    <div className="empty-state">
                    <div className="empty-icon">◈</div>
                    <div className="empty-title">Your recommendation appears here</div>
                    <div className="empty-sub">Select all five options on the left and click "Get recommendation"</div>
                    </div>
                </div>
                )}

                {/* History */}
                {history.length > 0 && (
                <div className="card">
                    <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--slate-100)" }}>
                    <p className="section-eyebrow">Session history</p>
                    </div>
                    <table className="hist-table" style={{ padding: "0 8px" }}>
                    <thead>
                        <tr>
                        <th>Brand</th>
                        <th>Garment</th>
                        <th>Size</th>
                        <th>Confidence</th>
                        <th>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((h, i) => (
                        <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{h.brand}</td>
                            <td>{h.garment_type}</td>
                            <td><span className="hist-size">{h.recommended_size}</span></td>
                            <td>{Math.round(h.confidence * 100)}%</td>
                            <td><span className={`badge ${RISK_CLASS[h.return_risk]}`}>{h.return_risk}</span></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
            </div>
        </div>

        <footer className="page-footer">SmartFit AI · Size Intelligence</footer>
        </div>
    );
}