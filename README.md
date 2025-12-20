# Reserva Pro (SaaS de reservas multi-negocio)

Monorepo con un sistema de gestión de reservas multi-tenant: panel para negocios/staff, página pública por `slug`, horarios con intervalos, disponibilidad, recordatorios por WhatsApp, analíticas, exportación CSV y suscripciones (Stripe / Mercado Pago).

## Estructura

```text
SaaS-project/
  backend/   NestJS + Prisma + PostgreSQL (API en /api/*)
  frontend/  Next.js (App Router) + Tailwind (panel + sitio público)
  cron/      Worker opcional (Railway Cron) para disparar recordatorios
  DEPLOYMENT_GUIDE.md
  README.md
```

## Stack

- Backend: NestJS 11, Prisma 5, PostgreSQL, Swagger (`/api/docs`), JWT, Zod/class-validator, Nest Schedule
- Frontend: Next.js 16 (App Router), React 19, TailwindCSS 4
- Infra: Dockerfiles listos y guía de deploy en Railway

## URLs importantes (local)

- Frontend: `http://localhost:4200`
- Backend base: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`

## Quick start (local)

Requisitos: Node 20.9+ (por Next.js 16), npm, y una DB Postgres.

### 1) Backend (API)

```bash
cd backend
npm install

# 1) variables de entorno
# macOS/Linux:
#   cp .env.example .env
# Windows (PowerShell):
#   Copy-Item .env.example .env

# 2) migraciones
npx prisma migrate dev

# 3) (opcional) seed de planes + exchange rates
#    Nota: el seed actual está en prisma/seed.ts
npx ts-node prisma/seed.ts

# 4) correr API
npm run start:dev
```

### 2) Frontend (panel + público)

```bash
cd frontend
npm install
# macOS/Linux:
#   cp .env.example .env
# Windows (PowerShell):
#   Copy-Item .env.example .env
npm run dev
```

El frontend incluye un proxy `frontend/src/app/api/[...path]/route.ts` para que el browser pegue siempre a `/api/*` en el mismo dominio, y el servidor de Next reenvíe al backend.

### 3) (Opcional) Worker `cron/`

El backend ya trae un cron interno (Nest Schedule) que corre cada 15 minutos y también expone un endpoint para dispararlo manualmente. Si preferís un scheduler externo (ej: Railway Cron), podés usar `cron/`.

Nota de seguridad: si usás el disparo manual (`POST /api/cron/send-reminders`) en producción, protegelo (IP allowlist, auth, o un secret) para evitar abuso.

```bash
cd cron
npm install
# macOS/Linux:
#   cp .env.example .env
# Windows (PowerShell):
#   Copy-Item .env.example .env
node index.js
```

## Variables de entorno

### Backend (`backend/.env`)

Mínimas para arrancar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reserva_pro"
FRONTEND_URL="http://localhost:4200"
JWT_ACCESS_SECRET="min-32-chars"
JWT_REFRESH_SECRET="min-32-chars"
PORT=3000
```

Integraciones (opcionales, pero habilitan funcionalidades):

```env
# WhatsApp Cloud API (se aceptan varios nombres; se usa el primero disponible)
WHATSAPP_ACCESS_TOKEN="..."
WHATSAPP_CLOUD_API_TOKEN="..."
WHATSAPP_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_PHONE_NUMBER="..."

# Stripe (suscripción Pro)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
PUBLIC_FRONTEND_URL="http://localhost:4200"

# Mercado Pago (suscripción Pro en MP)
MP_ACCESS_TOKEN="..."
MP_WEBHOOK_SECRET="..."

# Exchange rates (fallback con API key; si no se setea, usa ExchangeRate-API sin key)
FREECURRENCYAPI_KEY="..."
```

Notas:
- Todos los endpoints están bajo `/api/*` (por `app.setGlobalPrefix('api')`).
- Webhooks: Stripe en `/api/billing/webhook`, Mercado Pago en `/api/billing/webhook/mercadopago`.
- El backend lee primero `backend/.env.local` y luego `backend/.env`.

### Frontend (`frontend/.env`)

```env
# Backend base URL (sin /api). Usado por el proxy de Next.js.
BACKEND_URL="http://localhost:3000"

# Opcional: si se setea, el browser llama al backend directo (saltea el proxy).
# NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### Cron (`cron/.env`)

```env
# Debe apuntar al backend con /api incluido
CRON_BACKEND_URL="http://localhost:3000/api"
```

## Módulos principales (backend)

- Auth (JWT access/refresh), Users, Businesses (multi-tenant)
- Staff (invitaciones y permisos), Services, Bookings
- Schedule (intervalos por día) + Special Days
- Availability (slots disponibles), Public API por `slug` (sitio público + autogestión con `clientKey` en metadata)
- WhatsApp (confirmación, recordatorio, cancelación + logs)
- Logs (acción, error, seguridad), Export CSV, Analytics
- Billing (Planes + suscripción por negocio) con Stripe y Mercado Pago
- Exchange rates (actualización diaria, usada para Mercado Pago)

## Scripts útiles

- Backend: `npm run start:dev`, `npm run start:prod`, `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run format`
- Frontend: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`

## API (resumen)

- Base: `/api/*` (ej: `http://localhost:3000/api`)
- Auth: `/api/auth/*` (register/login/refresh)
- Negocios: `/api/business/*` (incluye branding y staff)
- Servicios: `/api/service/*`
- Reservas: `/api/booking/*`
- Disponibilidad: `/api/availability/:businessId?serviceId=...&date=YYYY-MM-DD`
- Público (por slug): `/api/public/:slug/*`
- Billing: `/api/billing/*` (checkout/portal + webhooks)
- Cron manual: `POST /api/cron/send-reminders`

## Deploy

Ver `DEPLOYMENT_GUIDE.md` para Railway (backend + frontend + Postgres) y configuración de webhooks.

## Docs

- Swagger (source of truth): `/api/docs`
- Backend: `backend/API_REFERENCE.md`, `backend/IMPLEMENTATION_SUMMARY.md`

## Licencia

Licencia propietaria (todos los derechos reservados). Ver `LICENSE`.
