import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
    getGenders, getBrands, getCategories,
    getProductTypes, getGarmentTypes, recommendSize
} from "../api";

function useOptions(token) {
    const [genders, setGenders] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [garmentTypes, setGarmentTypes] = useState([]);

    const [sel, setSel] = useState({ gender: "", brand: "", category: "", productType: "", garmentType: "" });
    const set = (k) => (v) => setSel(s => {
        const next = { ...s, [k]: v };
        // Reset downstream
        if (k === "gender") { next.brand = ""; next.category = ""; next.productType = ""; next.garmentType = ""; }
        if (k === "brand") { next.category = ""; next.productType = ""; next.garmentType = ""; }
        if (k === "category") { next.productType = ""; next.garmentType = ""; }
        if (k === "productType") { next.garmentType = ""; }
        return next;
    });

    useEffect(() => { getGenders().then(setGenders).catch(console.error); }, []);
    useEffect(() => { if (sel.gender) getBrands(sel.gender).then(setBrands).catch(console.error); else setBrands([]); }, [sel.gender]);
    useEffect(() => { if (sel.brand) getCategories(sel.gender, sel.brand).then(setCategories).catch(console.error); else setCategories([]); }, [sel.brand]);
    useEffect(() => { if (sel.category) getProductTypes(sel.gender, sel.brand, sel.category).then(setProductTypes).catch(console.error); else setProductTypes([]); }, [sel.category]);
    useEffect(() => { if (sel.productType) getGarmentTypes(sel.gender, sel.brand, sel.category, sel.productType).then(setGarmentTypes).catch(console.error); else setGarmentTypes([]); }, [sel.productType]);

    return { genders, brands, categories, productTypes, garmentTypes, sel, set };
    }

    const RISK_BADGE = { Low: "badge-green", Medium: "badge-yellow", High: "badge-red" };

    export default function HomePage({ user, token, onNavigate, onLogout }) {
    const { genders, brands, categories, productTypes, garmentTypes, sel, set } = useOptions(token);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);

    const ready = sel.gender && sel.brand && sel.category && sel.productType && sel.garmentType;

    const handleRecommend = async () => {
        if (!ready) return;
        setError(""); setLoading(true); setResult(null);
        try {
        const res = await recommendSize(token, {
            gender: sel.gender,
            brand: sel.brand,
            category: sel.category,
            product_type: sel.productType,
            garment_type: sel.garmentType,
        });
        setResult(res);
        setHistory(h => [res, ...h].slice(0, 5));
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    const confPct = result ? Math.round(result.confidence * 100) : 0;

    return (
        <div className="home-layout">
        <Navbar onNavigate={onNavigate} onLogout={onLogout} currentPage="home" />

        {/* Hero */}
        <div className="home-hero">
            <div className="home-hero-bg" />
            <div className="home-hero-inner">
            <div className="home-hero-greeting">Hello, {user.name?.split(" ")[0]} 👋</div>
            <h1 className="home-hero-title">
                Find your <em>perfect size</em><br />across any brand.
            </h1>
            <div className="home-hero-stats">
                <div className="home-hero-stat">
                <span className="home-hero-stat-val">{user.body_shape || "—"}</span>
                <span className="home-hero-stat-label">Body Shape</span>
                </div>
                <div className="home-hero-stat">
                <span className="home-hero-stat-val">{user.measurement_confidence ? `${Math.round(user.measurement_confidence * 100)}%` : "—"}</span>
                <span className="home-hero-stat-label">Measurement Confidence</span>
                </div>
                <div className="home-hero-stat">
                <span className="home-hero-stat-val">9</span>
                <span className="home-hero-stat-label">Supported Brands</span>
                </div>
            </div>
            </div>
        </div>

        {/* Main */}
        <div className="home-main">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}
                className="recommend-main-grid">

            {/* Form */}
            <div>
                <h2 className="section-title">Get a Size Recommendation</h2>
                <p className="section-sub">Select your options step-by-step to get your personalised size.</p>

                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Gender */}
                <div className="form-group">
                    <label className="form-label">Gender</label>
                    <div className="form-select-wrap">
                    <select className="form-select" value={sel.gender} onChange={e => set("gender")(e.target.value)}>
                        <option value="">Select gender</option>
                        {genders.map(g => <option key={g}>{g}</option>)}
                    </select>
                    </div>
                </div>

                {/* Brand */}
                <div className="form-group">
                    <label className="form-label">Brand</label>
                    <div className="form-select-wrap">
                    <select className="form-select" value={sel.brand} onChange={e => set("brand")(e.target.value)} disabled={!sel.gender}>
                        <option value="">Select brand</option>
                        {brands.map(b => <option key={b}>{b}</option>)}
                    </select>
                    </div>
                </div>

                {/* Category */}
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="form-select-wrap">
                    <select className="form-select" value={sel.category} onChange={e => set("category")(e.target.value)} disabled={!sel.brand}>
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    </div>
                </div>

                {/* Product type */}
                <div className="form-group">
                    <label className="form-label">Product Type</label>
                    <div className="form-select-wrap">
                    <select className="form-select" value={sel.productType} onChange={e => set("productType")(e.target.value)} disabled={!sel.category}>
                        <option value="">Select product type</option>
                        {productTypes.map(p => <option key={p}>{p}</option>)}
                    </select>
                    </div>
                </div>

                {/* Garment type */}
                <div className="form-group">
                    <label className="form-label">Garment Type</label>
                    <div className="form-select-wrap">
                    <select className="form-select" value={sel.garmentType} onChange={e => set("garmentType")(e.target.value)} disabled={!sel.productType}>
                        <option value="">Select garment type</option>
                        {garmentTypes.map(g => <option key={g}>{g}</option>)}
                    </select>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleRecommend}
                    disabled={!ready || loading}
                    style={{ marginTop: 8 }}
                >
                    {loading ? <><span className="spinner" /> Calculating…</> : "Get My Size →"}
                </button>
                </div>
            </div>

            {/* Result + history */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {result ? (
                <div className="result-card">
                    <div className="result-card-bg" />
                    <div className="result-card-inner">
                    <div className="result-size-label">Recommended Size · {result.brand}</div>
                    <div className="result-size-val">{result.recommended_size}</div>

                    <div className="result-meta">
                        <span className="badge badge-ink">{result.gender}</span>
                        <span className="badge badge-ink">{result.category}</span>
                        <span className="badge badge-ink">{result.garment_type}</span>
                        <span className={`badge ${RISK_BADGE[result.return_risk] || "badge-yellow"}`}>
                        {result.return_risk} Return Risk
                        </span>
                    </div>

                    <div style={{ marginBottom: 8, color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Fit Confidence
                    </div>
                    <div className="result-confidence">
                        <div className="confidence-bar-wrap">
                        <div className="confidence-bar-fill" style={{ width: `${confPct}%` }} />
                        </div>
                        <span className="confidence-pct">{confPct}%</span>
                    </div>

                    <div style={{ marginTop: 16, color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                        Matched on {result.matched_on} · Δ {result.delta}
                    </div>
                    </div>
                </div>
                ) : (
                <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>👗</div>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "1rem", marginBottom: 4, color: "var(--ink)" }}>
                    Your result will appear here
                    </div>
                    <div style={{ fontSize: "0.88rem" }}>Select all options and click "Get My Size"</div>
                </div>
                )}

                {/* Recent history */}
                {history.length > 1 && (
                <div>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 10 }}>
                    Recent Results
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {history.slice(1).map((h, i) => (
                        <div key={i} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "1.2rem", marginRight: 10 }}>{h.recommended_size}</span>
                            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{h.brand} · {h.garment_type}</span>
                        </div>
                        <span className={`badge ${RISK_BADGE[h.return_risk]}`}>{Math.round(h.confidence * 100)}%</span>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </div>
            </div>

            {/* Low confidence tip */}
            {result && result.confidence < 0.5 && (
            <div className="alert alert-warn" style={{ marginTop: 24 }}>
                ⚠️ Low confidence ({confPct}%) — your body proportions differ significantly from standard sizing for this brand. Consider updating your photo in Profile for more accurate measurements.
            </div>
            )}
        </div>

        <style>{`
            @media (max-width: 768px) {
            .recommend-main-grid { grid-template-columns: 1fr !important; }
            }
        `}</style>
        </div>
    );
}