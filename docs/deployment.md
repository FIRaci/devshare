# Deployment Documentation

## 1. Overview
DevShare is a full-stack community platform:
- **Frontend:** React 19 + Vite 8 (SPA)
- **Backend:** ElysiaJS + Bun 1.4 + Prisma ORM
- **Database:** PostgreSQL (Dockerized locally or Managed PostgreSQL on Render)

---

## 2. Local Deployment (Active)

### Services & Endpoints
| Component | Technology | Local URL | Port / Details | Status |
|---|---|---|---|---|
| **Database** | PostgreSQL 15 (Alpine) | `localhost:5433` | Docker container `devshare_postgres` | Running |
| **Backend API** | Bun + ElysiaJS + Prisma | `http://localhost:3001` | Health check: `GET /` | Running |
| **Frontend** | React 19 + Vite | `http://localhost:5173` | UI & Client SPA | Running |

### Local Start Commands
1. **Start Database:**
   ```bash
   npm run start-db
   ```
2. **Setup Backend Database:**
   ```bash
   cd reddit_backend
   bun install
   bun run db:generate
   bun run db:push
   bun run seed
   ```
3. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   Or individually:
   - Backend: `cd reddit_backend && bun run src/index.ts`
   - Frontend: `cd reddit_frontend && npm run dev`

---

## 3. Cloud Deployment (Render Blueprint)

- **Platform:** Render (Infrastructure as Code via `render.yaml`)
- **Repository:** `FIRaci/devshare`
- **Blueprint file:** [`render.yaml`](file:///d:/Test3/render.yaml)
- **Cloud URLs:**
  - Frontend: `https://devshare-frontend.onrender.com`
  - Backend API: `https://devshare-backend.onrender.com`
  - Managed DB: `devshare-db` (PostgreSQL 16)
