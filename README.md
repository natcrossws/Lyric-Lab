# keServicios (Frontend & Backend)

Plantilla SaaS multitenant: React + Vite + Chakra (frontend) y Express + Prisma + PostgreSQL (backend).

El código vive en `/app` como monorepo **pnpm workspaces**.

```text
keServicios/app/
├── backend/            # Express, Node.js, Prisma (PostgreSQL)
├── frontend/           # React 18, Vite, Chakra UI
├── package.json        # Workspace root (scripts pnpm)
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## Requisitos

- Node.js 20+
- pnpm 9+ (recomendado 11.1.1 vía Corepack)
- PostgreSQL

```bash
corepack enable
corepack prepare pnpm@11.1.1 --activate
```

---

## Instalación

```bash
cd app
pnpm install
```

Configura `.env` (ver `.env.production.example` / `backend/.env.production.example`).

```bash
# Migraciones Prisma + seed de catálogos multitenant
pnpm run db:migrate
psql "$DATABASE_URL" -f backend/prisma/seed_multitenant_catalogs.sql
```

---

## Desarrollo

Desde `app/`:

```bash
pnpm run dev              # backend + frontend en paralelo
pnpm run dev:backend
pnpm run dev:frontend
```

- API: normalmente `http://localhost:3001` (o el puerto de tu `.env`)
- UI: `http://localhost:5173`

**No uses `npm install` / `yarn` en este repo** — el lockfile canónico es `pnpm-lock.yaml`.

---

## Build / producción

```bash
pnpm run build:frontend   # → frontend/dist
pnpm run build:backend    # → backend/dist (tsc)
pnpm run start:backend
```

PM2 (ejemplo):

```bash
cd backend
pm2 start dist/server.js --name "keservicios_api"
```

---

*keServicios | KeSoftware*
