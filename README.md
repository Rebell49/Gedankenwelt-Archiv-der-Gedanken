# Gedankenwelt — V1 Production

> A 3D philosophical thought-collection platform. Users contribute thoughts to thematic planets in an interactive Three.js universe. An AI moderates submissions. Admins manage content via a protected panel.

**Status**: Production-ready | **Last Updated**: April 2026 | **v1.0.0**

---

## Prerequisites

- **Node.js**: v18+ (v20 LTS recommended)
- **npm**: v9+ or **pnpm** v8+ (preferred for monorepos)
- **PostgreSQL**: v14+ (local or managed)
- **OpenAI API Key**: For GPT-4o-mini moderation
- **Git**: v2.35+

---

## Stack

| Layer | Technology | Scaling Notes |
|-------|-----------|---|
| Frontend | React 18 + Vite + Tailwind CSS | Code-split lazy loading enabled |
| 3D Engine | Three.js (isolated lifecycle) | Instancing for 10k+ objects; LOD enabled |
| Animations | Framer Motion | GPU-accelerated; disable on mobile <2GB RAM |
| State | TanStack React Query v5 | Auto-invalidation; 5min cache default |
| Backend | Node.js + Express | Horizontal scaling with Redis queues |
| Auth | JWT (access + refresh tokens) | Short-lived tokens (15min); rotation in place |
| Database | PostgreSQL + Prisma ORM | Connection pooling (PgBouncer); read replicas |
| AI Moderation | OpenAI GPT-4o-mini | Batch processing; queue-based for scale |
| Validation | Zod | Runtime schema validation on all inputs |
| Caching | Redis (optional) | Recommended for >1000 concurrent users |

---

## Quick Start

### Option 1: Local Development (Recommended for <100 concurrent users)

#### 1. Clone & Install

```bash
git clone https://github.com/Rebell49/Gedankenwelt-Archiv-der-Gedanken.git
cd Gedankenwelt-Archiv-der-Gedanken/Codebase/backend

# Install all dependencies
npm install --workspace

# Or separately:
npm install              # Root dependencies
cd frontend && npm install
cd ../backend && npm install
```

#### 2. Setup Environment Variables

```bash
# backend/.env (required)
DATABASE_URL="postgresql://user:password@localhost:5432/gedankenwelt"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
MODERATION_TIMEOUT_MS=10000
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
LOG_LEVEL="info"
REDIS_URL="redis://localhost:6379"           # Optional; enable for scale

# frontend/.env (required)
VITE_API_URL="http://localhost:3001"
VITE_ENV="development"
```

**✓ Validate**: Run `npm run validate:env` to check all required vars exist.

#### 3. Database Setup

```bash
cd backend

# Create DB and run migrations
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed

# (Optional) View database schema
npx prisma studio
```

#### 4. Start Development Servers

```bash
# Terminal 1 — Backend (auto-reload with nodemon)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite dev server)
cd frontend && npm run dev
```

**Access**:
- Frontend: http://localhost:5173
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/health

#### 5. Health Check

```bash
curl http://localhost:3001/api/health
# Expected: { "status": "ok", "uptime": "...", "db": "connected" }
```

---

### Option 2: Docker (Recommended for >100 concurrent users / Production)

```bash
# Build and start all services
docker-compose up -d

# Verify health
curl http://localhost:3001/api/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access database shell
docker-compose exec postgres psql -U gedankenwelt
```

See [docker-compose.yml](./docker-compose.yml) for configuration details.

---

## Project Structure

```
Gedankenwelt-Archiv-der-Gedanken/
├── README.md                           # This file
├── docker-compose.yml                  # Multi-container orchestration
├── .env.example                        # Template for environment variables
└── Codebase/
    └── backend/
        ├── backend/                    # Express API
        │   ├── src/
        │   │   ├── routes/
        │   │   │   ├── auth.routes.js
        │   │   │   ├── anchors.routes.js
        │   │   │   ├── admin.routes.js
        │   │   │   └── health.routes.js
        │   │   ├── controllers/
        │   │   │   ├── auth.controller.js
        │   │   │   ├── anchors.controller.js
        │   │   │   └── admin.controller.js
        │   │   ├── services/
        │   │   │   ├── auth.service.js
        │   │   │   ├── anchors.service.js
        │   │   │   ├── moderation.service.js    # AI moderation with queue
        │   │   │   └── cache.service.js         # Redis caching layer
        │   │   ├── middleware/
        │   │   │   ├── auth.middleware.js
        │   │   │   ├── validate.middleware.js
        │   │   │   ├── rateLimit.middleware.js  # Rate limiting
        │   │   │   └── errorHandler.middleware.js
        │   │   ├── jobs/
        │   │   │   └── moderation.job.js        # Queue-based processing
        │   │   └── server.js
        │   ├── prisma/
        │   │   ├── schema.prisma
        │   │   ├── seed.js
        │   │   └── migrations/
        │   ├── tests/
        │   │   ├── auth.test.js
        │   │   ├── anchors.test.js
        │   │   └── moderation.test.js
        │   ├── .env
        │   ├── .env.example
        │   ├── package.json
        │   └── Dockerfile
        │
        └── frontend/                   # React + Vite app
            ├── src/
            │   ├── pages/
            │   │   ├── Home.jsx
            │   │   ├── Admin.jsx
            │   │   └── NotFound.jsx
            │   ├── components/
            │   │   ├── universe/
            │   │   │   ├── UniverseView.jsx     # Three.js scene (lazy-loaded)
            │   │   │   ├── PlanetView.jsx
            │   │   │   ├── ThoughtFormationIntro.jsx
            │   │   │   └── CreatePlanetForm.jsx
            │   │   ├── planet/
            │   │   │   └── CreateAnchorForm.jsx
            │   │   ├── common/
            │   │   │   ├── LoadingSpinner.jsx
            │   │   │   ├── ErrorBoundary.jsx
            │   │   │   └── Toast.jsx
            │   │   └── globe/
            │   │       ├── AnchorDetail.jsx
            │   │       └── IntentionDialog.jsx
            │   ├── hooks/
            │   │   ├── useAnchors.js
            │   │   ├── useAuth.js
            │   │   └── usePrefetch.js            # Prefetching for performance
            │   ├── services/
            │   │   ├── api.js                   # Axios with retry logic
            │   │   ├── cache.js
            │   │   └── analytics.js             # Optional telemetry
            │   ├── engine/
            │   │   └── universe.engine.js       # Isolated Three.js (LOD, instancing)
            │   ├── utils/
            │   │   ├── perf.js                  # Performance monitoring
            │   │   └── validators.js
            │   ├── App.jsx
            │   └── main.jsx
            ├── tests/
            │   ├── components.test.jsx
            │   ├── hooks.test.js
            │   └── e2e.spec.js                  # Cypress/Playwright
            ├── .env
            ├── .env.example
            ├── vite.config.js
            ├── tailwind.config.js
            ├── package.json
            └── Dockerfile
```

## Windows one-click archive builder

A helper script is included at the repository root:

```powershell
cd \path\to\Gedankenwelt-Archiv-der-Gedanken
powershell -ExecutionPolicy Bypass -File .\windows-package.ps1
```

If no destination path is provided, the script opens a folder picker and writes `Gedankenwelt-Ready.zip` into that folder.

The archive contains:
- project source files
- backend and frontend dependencies
- built frontend bundle
- helper `run-local.bat`
- `README-WINDOWS-PACKAGE.txt` with usage notes

Before running the app, update the env files in:
- `Codebase/backend/backend/.env`
- `Codebase/backend/frontend/.env`

For a full production or Docker setup, see the existing instructions earlier in this README.

---

## Scaling & Performance

### For 100–1K Concurrent Users
- ✓ Enable Redis caching (`REDIS_URL`)
- ✓ Use connection pooling in Prisma (`connection_limit: 20`)
- ✓ Enable query result caching (5min default)
- ✓ Defer non-urgent AI moderation to background queue
- ✓ Code-split frontend (Vite handles this; verify in Network tab)

### For 1K–10K Concurrent Users
- ✓ Database read replicas for queries; primary for writes
- ✓ Implement Three.js LOD (Level of Detail) for 3D rendering
- ✓ Move moderation queue to separate worker processes (Bull, RabbitMQ)
- ✓ Add CDN for static assets (Cloudflare, Vercel Edge)
- ✓ Monitor query performance: `npm run db:analyze` (generates slow query logs)
- ✓ Implement rate limiting per IP/user (default: 100 req/min)
- ✓ Add database connection pooling middleware (PgBouncer recommended)

### For 10K+ Concurrent Users
- ✓ Deploy backend on Kubernetes (horizontal scaling)
- ✓ Separate moderation workers into dedicated service
- ✓ Implement Redis cluster for caching
- ✓ Use PostgreSQL sharding for user data (by region)
- ✓ Stream 3D object data (avoid sending all planets to client)
- ✓ Implement API gateway with request batching
- ✓ Add distributed tracing (DataDog, Jaeger)
- ✓ Enable query result streaming (avoid large JSON payloads)

**Performance Monitoring**:
```bash
# Check slow queries
npm run db:analyze

# Frontend performance
npm run build && npm run preview
# Check bundle size: Vite dashboard shows gzip sizes

# Monitor backend requests
curl http://localhost:3001/metrics  # Prometheus format
```

---

## Running Tests

```bash
# Backend — Unit tests
cd backend
npm run test

# Backend — Integration tests (requires running DB)
npm run test:integration

# Backend — Coverage report
npm run test:coverage

# Frontend — Unit tests
cd frontend
npm run test

# E2E tests (requires both servers running)
npm run test:e2e
```

---

## Deployment

### Frontend → Vercel (Recommended for <50K monthly users)

```bash
cd frontend
vercel --prod
# Set VITE_API_URL in Vercel dashboard to production backend URL
# Automatic deployments on main branch
```

### Backend → Railway / Render / Heroku

```bash
cd backend

# Option A: Railway
railway login
railway init
railway up
# Configure env vars in Railway dashboard

# Option B: Docker (any cloud)
docker build -t gedankenwelt-backend .
# Push to registry and deploy
```

### Backend → Kubernetes (Recommended for >10K concurrent users)

```bash
# See k8s/ folder for manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Scale to 5 replicas
kubectl scale deployment backend --replicas=5
```

### Database → PostgreSQL Managed Service

```bash
# Recommended providers:
# — Supabase (PostgreSQL + realtime + auth)
# — Neon (serverless PostgreSQL)
# — AWS RDS (advanced features)
# — Railway PostgreSQL (simple)

DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Pre-Deployment Checklist**:
- [ ] All env vars set correctly in production
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Run health check: `curl https://api.yourdomain.com/api/health`
- [ ] Frontend env vars point to production API
- [ ] CORS properly configured (no `*`)
- [ ] JWT secrets are strong (use `openssl rand -base64 32`)
- [ ] Rate limiting enabled
- [ ] Error logging configured (optional: DataDog, Sentry)
- [ ] Database backups configured (daily minimum)
- [ ] Monitor first 24 hours for errors

---

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -d postgres -c "SELECT 1"

# Verify DATABASE_URL format
echo $DATABASE_URL
# Expected: postgresql://user:password@host:5432/gedankenwelt

# Reset Prisma client
rm node_modules/.prisma && npm install
```

### Port Already in Use
```bash
# Find process on port
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Frontend Won't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check VITE_API_URL in frontend/.env
cat frontend/.env

# Try with explicit origin header
curl -H "Origin: http://localhost:5173" http://localhost:3001/api/health
```

### AI Moderation Hanging
```bash
# Check OPENAI_API_KEY is correct
echo $OPENAI_API_KEY | head -c 10  # Should start with "sk-"

# Verify API is reachable
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'

# Increase timeout if network is slow
# Set MODERATION_TIMEOUT_MS=30000 in backend/.env
```

### 3D Rendering is Slow
```bash
# In frontend/.env, disable advanced effects:
VITE_DISABLE_SHADOWS=true
VITE_DISABLE_BLOOM=true

# Or reduce object count in UniverseView.jsx
// const MAX_PLANETS = 1000;  // Default
const MAX_PLANETS = 100;    // For low-end devices
```

---

## Monitoring & Logging

### Backend Logs
```bash
# View logs for the last 100 lines
docker-compose logs -f --tail=100 backend

# Or directly (if running locally)
tail -f backend/logs/app.log

# Log levels: debug, info, warn, error
# Set LOG_LEVEL=debug for verbose output during troubleshooting
```

### Database Monitoring
```bash
# Connect to database
psql $DATABASE_URL

# Slow queries
SELECT query, mean_exec_time, calls FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

# Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Optional: Error Tracking (Sentry / DataDog)
```bash
# backend/.env
SENTRY_DSN="https://examplePublicKey@o0.ingest.sentry.io/0"

# frontend/.env
VITE_SENTRY_DSN="..."
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Write tests for new functionality
3. Run linter: `npm run lint`
4. Commit with conventional messages: `feat(auth): add SSO support`
5. Push and open a PR against `main`

**Before submitting:**
```bash
npm run lint        # Fix linting issues
npm test            # Verify all tests pass
npm run build       # Check production build succeeds
```

---

## Security

- Rotate JWT secrets every 90 days
- Use HTTPS only in production
- Keep dependencies updated: `npm audit` weekly
- Report security issues privately to maintainers
- Database credentials in environment variables only (never hardcoded)
- Validate all user input with Zod schemas
- Use CORS whitelist (no wildcard `*` in production)
