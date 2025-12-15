# Deployment en Railway (Backend + Frontend)

Este repo es un monorepo con:

- `backend/` (NestJS + Prisma)
- `frontend/` (Next.js)
- `cron/` (opcional; el backend ya tiene scheduler con `@nestjs/schedule`)

## 1) Subir el repo

1. Subí el proyecto a GitHub (o tu proveedor Git).
2. En Railway: **New Project → Deploy from GitHub Repo** y elegí el repo.

## 2) Crear el servicio `backend`

1. En Railway: **Create → Service → GitHub Repo** (mismo repo).
2. En el servicio, Settings:
   - **Root Directory**: `backend`
   - Builder: Dockerfile (ya está configurado con `backend/railway.json` y `backend/Dockerfile`)

### Variables de entorno (Backend)

Configuralas en **Variables** del servicio:

- `DATABASE_URL` (tu Postgres de producción)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (URL pública del frontend; podés separar múltiples con comas)

Opcionales (si usás Billing/Stripe):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `PUBLIC_FRONTEND_URL` (fallback para links públicos si no querés usar `FRONTEND_URL`)

El backend ejecuta `npx prisma migrate deploy` al arrancar (incluido en el `startCommand`), así que no necesitás correr migraciones a mano.

### Seed (opcional)

Si querés cargar datos demo una sola vez, podés ejecutar en el servicio `backend`:

- `npm run seed`

## 3) Crear el servicio `frontend`

1. En Railway: **Create → Service → GitHub Repo** (mismo repo).
2. En el servicio, Settings:
   - **Root Directory**: `frontend`
   - Builder: Dockerfile (usa `frontend/Dockerfile`)

### Variables de entorno (Frontend)

- `BACKEND_URL` = URL base del backend **sin** `/api` (por ejemplo `https://<tu-backend>.railway.app`)

El frontend usa un proxy interno (`frontend/src/app/api/[...path]/route.ts`) para que el browser llame a `/api/*` en el mismo dominio del frontend y Next reenvíe al backend.

## 4) Conectar dominios

1. Asigná un dominio al `frontend` (Railway → Settings → Domains).
2. Copiá esa URL y seteala como `FRONTEND_URL` en el `backend`.

## 5) (Opcional) Cron service

El backend ya corre recordatorios cada 15 minutos con `@nestjs/schedule`.

Si igual querés un job separado:

- Deploy `cron/` como servicio aparte (Root Directory `cron`) y seteá:
  - `CRON_BACKEND_URL` = `https://<tu-backend>.railway.app/api`
  - Programalo desde Railway como Job/Cron (según tu plan/configuración).

## Checklist rápido

- Backend online y respondiendo en `/api/docs`
- Frontend online (login / UI)
- `DATABASE_URL` configurado en backend
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` configurados en backend
- `BACKEND_URL` configurado en frontend
