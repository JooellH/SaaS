# Deploy en Railway (Backend + Frontend + Postgres)

Este repo está preparado para deploy en Railway como **2 servicios**:

- **Backend**: NestJS + Prisma (Dockerfile en `backend/`)
- **Frontend**: Next.js (Dockerfile en `frontend/`)
- **DB**: Postgres (Railway plugin)

> Nota: el frontend tiene un **proxy** en `frontend/src/app/api/[...path]/route.ts` para que el browser siempre pegue a `/api/*` en el mismo dominio del frontend. El proxy reenvía al backend usando `BACKEND_URL`.

---

## 1) Crear proyecto + Postgres

1. Railway → New Project
2. Add → **PostgreSQL**
3. Copiá el `DATABASE_URL` (o usá el env que te crea Railway).

---

## 2) Backend (servicio)

1. Add → **GitHub Repo** → seleccioná tu repo.
2. En el servicio, configurá **Root Directory** = `backend`
3. Deploy (Railway va a usar `backend/railway.json` + `backend/Dockerfile`)

### Variables de entorno (Backend)

En el servicio backend → Variables:

- `DATABASE_URL` = el de Railway Postgres (si falla TLS, probá agregando `?sslmode=require`)
- `FRONTEND_URL` = `https://TU_FRONTEND_DOMAIN` (o varios separados por coma)
- `PUBLIC_FRONTEND_URL` = `https://TU_FRONTEND_DOMAIN`
- `JWT_ACCESS_SECRET` = string largo random
- `JWT_REFRESH_SECRET` = string largo random
- Stripe:
  - `STRIPE_SECRET_KEY` = `sk_test_...` o `sk_live_...`
  - `STRIPE_PRO_PRICE_ID` = `price_...` (mensual USD 14.99)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- WhatsApp (si usás recordatorios):
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_API_URL` = `https://graph.facebook.com/v17.0`

### Migraciones

El backend ejecuta `prisma migrate deploy` al iniciar (`backend/Dockerfile`), así que al primer deploy crea/actualiza tablas.

---

## 3) Frontend (servicio)

1. Add → **GitHub Repo** → seleccioná el mismo repo.
2. Configurá **Root Directory** = `frontend`
3. Deploy (Railway va a usar `frontend/railway.json` + `frontend/Dockerfile`)

### Variables de entorno (Frontend)

- `BACKEND_URL` = `https://TU_BACKEND_DOMAIN`

> No hace falta `NEXT_PUBLIC_API_URL` para deploy, porque el frontend usa `/api/*` y lo proxya.

---

## 4) Stripe webhooks (para que “Pro” se active solo)

En Stripe Dashboard → Developers → Webhooks:

- Endpoint URL: `https://TU_BACKEND_DOMAIN/api/billing/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copiá el “Signing secret” (`whsec_...`) a `STRIPE_WEBHOOK_SECRET` del backend.

---

## 5) Dominios

- Backend: Railway te da un dominio (usalo para Stripe webhook).
- Frontend: Railway te da un dominio (usalo para `PUBLIC_FRONTEND_URL` del backend).

---

## 6) Recordatorios (Cron)

El backend trae un cron interno (Nest Schedule) que busca reservas próximas y envía recordatorios por WhatsApp.

Recomendación:
- Dejá el backend con **1 instancia** para evitar duplicados si escalás horizontalmente.

