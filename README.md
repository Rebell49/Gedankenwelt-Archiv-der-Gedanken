# Gedankenwelt — V1 Production

> A 3D philosophical thought-collection platform. Users contribute thoughts to thematic planets in an interactive Three.js universe. An AI moderates submissions. Admins manage content via a protected panel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| 3D Engine | Three.js (isolated lifecycle) |
| Animations | Framer Motion |
| State | TanStack React Query v5 |
| Backend | Node.js + Express |
| Auth | JWT (access + refresh tokens) |
| Database | PostgreSQL + Prisma ORM |
| AI Moderation | OpenAI GPT-4o-mini |
| Validation | Zod |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/gedankenwelt.git
cd gedankenwelt

# Install all deps
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/gedankenwelt"
JWT_SECRET="your-256-bit-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
OPENAI_API_KEY="sk-..."
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# frontend/.env
VITE_API_URL="http://localhost:3001"
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App: http://localhost:5173
API: http://localhost:3001

---

## Project Structure

```
gedankenwelt/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Admin.jsx
│   │   ├── components/
│   │   │   ├── universe/
│   │   │   │   ├── UniverseView.jsx     # Three.js scene
│   │   │   │   ├── PlanetView.jsx
│   │   │   │   ├── ThoughtFormationIntro.jsx
│   │   │   │   └── CreatePlanetForm.jsx
│   │   │   ├── planet/
│   │   │   │   └── CreateAnchorForm.jsx
│   │   │   └── globe/
│   │   │       ├── AnchorDetail.jsx
│   │   │       └── IntentionDialog.jsx
│   │   ├── hooks/
│   │   │   ├── useAnchors.js
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   └── api.js                  # Axios client
│   │   ├── engine/
│   │   │   └── universe.engine.js      # Isolated Three.js
│   │   └── App.jsx
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── anchors.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── anchors.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── anchors.service.js
│   │   │   └── moderation.service.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── validate.middleware.js
│   │   └── server.js
└── backend/
    └── prisma/
        ├── schema.prisma
        └── seed.js
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
vercel --prod
# Set VITE_API_URL to your Railway backend URL
```

### Backend → Railway

```bash
cd backend
railway login
railway init
railway up
# Set all env vars in Railway dashboard
```

### Database → Supabase / Railway PostgreSQL

```bash
# After provisioning DB, run:
DATABASE_URL="your-db-url" npx prisma migrate deploy
