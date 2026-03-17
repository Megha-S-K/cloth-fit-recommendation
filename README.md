# SmartFit AI 👗

> AI-powered clothing size recommendation system — no tape measure required.

SmartFit AI uses **MediaPipe BlazePose** to extract body proportions from a single full-body photo and recommends the best-fit clothing size across 9 major brands with a confidence score and return-risk rating.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| AI / Pose | MediaPipe BlazePose (world landmarks) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Image Processing | OpenCV headless |
| Data Import | Pandas + openpyxl |

---

## How It Works

1. User registers and uploads a **full-body front-facing photo**
2. **MediaPipe BlazePose** extracts 3D world landmarks (in metres)
3. Four measurements are derived from key landmark pairs:

| Symbol | Measurement | Landmarks | Scale Factor |
|--------|-------------|-----------|-------------|
| SW | Shoulder width | 11 → 12 | × 2.84 |
| HW | Hip width | 23 → 24 | × 4.32 |
| TL | Torso length | mean(11→23, 12→24) | × 1.00 |
| LL | Leg length | mean(23→27, 24→28) | × 0.67 |

4. Two body-proportion ratios are computed:
```
R1 = SW / HW   →  chest-to-hip ratio  (used for tops & full garments)
R2 = TL / LL   →  torso-to-leg ratio  (used for bottom garments)
```
5. Ratios are matched against the brand size database using **argmin(|user_ratio − brand_ratio|)**
6. Confidence and return risk are returned alongside the recommended size:
```
Confidence = max(0,  1 − Δ / 0.2)
```

---

## Project Structure

```
smartfit-ai/
│
├── backend/
│   ├── main.py                              # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                    # Env vars (DATABASE_URL, JWT settings)
│   │   │   ├── database.py                  # SQLAlchemy engine + get_db()
│   │   │   ├── security.py                  # bcrypt + JWT helpers
│   │   │   └── dependencies.py              # get_current_user_id() dependency
│   │   │
│   │   ├── models/
│   │   │   ├── user.py                      # User ORM model
│   │   │   └── brand_size.py                # BrandSize ORM model
│   │   │
│   │   ├── api/
│   │   │   ├── auth_routes.py               # /auth/register, /login, /me, /update-image
│   │   │   ├── options_routes.py            # 5-step cascade dropdowns
│   │   │   ├── recommendation_routes.py     # /recommend/size
│   │   │   └── debug_routes.py              # ⚠️ Remove before production
│   │   │
│   │   └── services/
│   │       ├── pose_service.py              # MediaPipe landmark extraction
│   │       ├── measurement_service.py       # SW, HW, TL, LL + validate_ratios()
│   │       ├── body_shape_service.py        # compute_ratios(), classify_body_shape()
│   │       ├── recommendation_service.py    # Size matching engine
│   │       └── image_preprocess_service.py  # Resize + normalise for MediaPipe
│   │
│   └── scripts/
│       └── import_brand_data.py             # Load .xlsx into brand_sizes table
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js                       # Proxy → localhost:8000
    └── src/
        ├── main.jsx
        ├── App.jsx                          # Client-side router
        ├── App.css                          # Full design system
        ├── api.js                           # All fetch() calls to FastAPI
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx             # With drag-and-drop photo upload
            ├── HomePage.jsx                 # 5-step recommendation form + results
            └── ProfilePage.jsx              # Body stats + update photo
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET_KEY

# 4. Create the database
createdb smartfit_db

# 5. Start the server (tables are auto-created on first run)
uvicorn main:app --reload

# 6. Import brand size data
python scripts/import_brand_data.py SmartFit_AI_DB_v2_2.xlsx
```

### Frontend Setup

```bash
# 1. Scaffold with Vite
npm create vite@latest smartfit-frontend -- --template react
cd smartfit-frontend

# 2. Install dependencies
npm install

# 3. Replace src/ contents with the provided frontend files
#    Also replace vite.config.js

# 4. Start dev server
npm run dev
# Opens at http://localhost:3000
```

> The Vite dev proxy forwards all `/auth`, `/options`, and `/recommend` requests to `http://localhost:8000` automatically — no CORS configuration needed during development.

---

## Environment Variables

Create a `.env` file in the backend folder:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartfit_db
JWT_SECRET_KEY=replace-this-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Multipart form: `name`, `email`, `password`, `image` |
| POST | `/auth/login` | No | Form: `email`, `password` → returns JWT token |
| GET | `/auth/me` | Bearer | Returns authenticated user profile + measurements |
| PUT | `/auth/update-image` | Bearer | Upload new photo — recalculates all measurements |

### Options Cascade

| Endpoint | Query Params |
|----------|-------------|
| `/options/genders` | — |
| `/options/brands` | `gender` |
| `/options/categories` | `gender`, `brand` |
| `/options/product-types` | `gender`, `brand`, `category` |
| `/options/garment-types` | `gender`, `brand`, `category`, `product_type` |

### Recommendation

```
POST /recommend/size
Authorization: Bearer <token>
Content-Type: application/json

{
  "gender": "Women",
  "brand": "Zara",
  "category": "top",
  "product_type": "regular",
  "garment_type": "shirt"
}
```

**Response:**
```json
{
  "recommended_size": "M",
  "brand": "Zara",
  "confidence": 0.84,
  "return_risk": "Low",
  "matched_on": "brand_r1 (chest/hip)",
  "delta": 0.032
}
```

---

## Brand Database

| Property | Value |
|----------|-------|
| File | `SmartFit_AI_DB_v2_2.xlsx` |
| Total rows | 474 |
| Brands | Adidas, Forever21, H&M, Levis, Mango, Max Fashion, Nike, Puma, Zara |
| Data split | 71% real / 29% synthetic |
| R1 range (Women) | 0.89 – 0.99 |
| R1 range (Men) | 1.00 – 1.08 |
| R2 range | 0.74 – 1.04 |

---

## Body Shape Classification

| R1 Value | Body Shape |
|----------|-----------|
| ≥ 1.08 | Inverted Triangle |
| 1.05 – 1.08 | Rectangle |
| 0.95 – 1.05 | Hourglass |
| 0.92 – 0.95 | Apple |
| < 0.92 | Pear |

---

## Security & Privacy

- **Photos are never stored** — images are discarded immediately after landmark extraction
- Passwords hashed with **bcrypt**
- Stateless **JWT** authentication (24-hour expiry)
- Only R1, R2 ratios and body shape label are persisted — not raw measurements
- All DB queries use SQLAlchemy ORM (parameterised — no SQL injection risk)
- ⚠️ Remove `debug_routes.py` and configure CORS before production deployment

---

## Known Limitations

- H&M Men full sizes (numeric 26–38) have `NULL` brand_r1 — 11 rows are skipped during matching
- H&M Women bottoms share identical R2 values — low confidence scores may be returned
- Pose detection may fail if the photo has loose clothing, poor lighting, or a cluttered background

---

## License

This project was developed as a B.Tech final year project. All rights reserved.
