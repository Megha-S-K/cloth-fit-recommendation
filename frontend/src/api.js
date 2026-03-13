const BASE = "http://localhost:8000";

async function req(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) {
        const msg = typeof data.detail === "string"
        ? data.detail
        : data.detail?.error || JSON.stringify(data.detail);
        throw new Error(msg || "Request failed");
    }
    return data;
    }

    // ── Auth ──────────────────────────────────────────────────────────────────────
    export async function register(formData) {
    return req("/auth/register", { method: "POST", body: formData });
    }

    export async function login(email, password) {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("password", password);
    return req("/auth/login", { method: "POST", body: fd });
    }

    export async function getMe(token) {
    return req("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    }

    export async function updateImage(token, imageFile) {
    const fd = new FormData();
    fd.append("image", imageFile);
    return req("/auth/update-image", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
    });
    }

    // ── Options cascade ────────────────────────────────────────────────────────────
    export async function getGenders() {
    return req("/options/genders");
    }

    export async function getBrands(gender) {
    return req(`/options/brands?gender=${encodeURIComponent(gender)}`);
    }

    export async function getCategories(gender, brand) {
    return req(`/options/categories?gender=${encodeURIComponent(gender)}&brand=${encodeURIComponent(brand)}`);
    }

    export async function getProductTypes(gender, brand, category) {
    return req(`/options/product-types?gender=${encodeURIComponent(gender)}&brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(category)}`);
    }

    export async function getGarmentTypes(gender, brand, category, productType) {
    return req(`/options/garment-types?gender=${encodeURIComponent(gender)}&brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(category)}&product_type=${encodeURIComponent(productType)}`);
    }

    // ── Recommend ─────────────────────────────────────────────────────────────────
    export async function recommendSize(token, body) {
    return req("/recommend/size", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}