# RESERVA PRO - Sistema de Reservas Multinegocio

Sistema SaaS completo de gestión de reservas con recordatorios automáticos vía WhatsApp.

## 🏗️ Arquitectura

El proyecto está dividido en 3 servicios independientes:

- **Backend** (NestJS + PostgreSQL + Prisma)
- **Frontend** (Next.js 14 + TypeScript + TailwindCSS)
- **Cron Job** (Node.js script para recordatorios)

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 14+
- Cuenta de Railway
- Meta WhatsApp Cloud API (opcional para producción)

## 🚀 Deploy en Railway

### 1. Crear Base de Datos PostgreSQL

```bash
# En Railway, crear un nuevo servicio PostgreSQL
# Copiar la DATABASE_URL generada
```

### 2. Deploy Backend

```bash
cd backend

# Configurar variables de entorno en Railway:
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secret_super_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro
WHATSAPP_API_TOKEN=tu_token (opcional)
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id (opcional)
PORT=3000

# Railway detectará automáticamente el Dockerfile
# El servicio se desplegará automáticamente
```

### 3. Deploy Frontend

```bash
cd frontend

# Configurar variables de entorno en Railway:
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app

# Railway detectará automáticamente el Dockerfile
```

### 4. Deploy Cron Job

```bash
cd cron

# Configurar variables de entorno en Railway:
BACKEND_URL=https://tu-backend.railway.app

# Railway ejecutará este servicio cada 15 minutos según railway.json
```

## 💻 Desarrollo Local

### Backend

```bash
cd backend
npm install

# Configurar .env
cp .env .env.local
# Editar DATABASE_URL y demás variables

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install

# Configurar .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Iniciar servidor
npm run dev
```

### Cron Job (Testing)

```bash
cd cron
npm install

# Configurar .env
echo "BACKEND_URL=http://localhost:3000" > .env

# Ejecutar manualmente
node index.js
```

## 📚 Endpoints Principales

### Auth
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Recuperar contraseña
- `POST /auth/reset-password` - Resetear contraseña

### Business
- `POST /business` - Crear negocio
- `GET /business` - Listar mis negocios
- `GET /business/:id` - Obtener negocio
- `PATCH /business/:id` - Actualizar negocio
- `GET /business/:slug/public` - Vista pública

### Services
- `POST /services` - Crear servicio
- `GET /services/:businessId` - Listar servicios
- `PATCH /services/:id` - Actualizar servicio
- `DELETE /services/:id` - Eliminar servicio

### Bookings
- `POST /bookings` - Crear reserva
- `GET /bookings/:businessId` - Listar reservas
- `GET /bookings/:businessId/availability` - Obtener disponibilidad
- `PATCH /bookings/:id/cancel` - Cancelar reserva
- `PATCH /bookings/:id/reschedule` - Reagendar reserva

### Schedule
- `POST /schedule` - Crear horario
- `GET /schedule/:businessId` - Listar horarios
- `PATCH /schedule/:id` - Actualizar horario
- `DELETE /schedule/:id` - Eliminar horario

### WhatsApp
- `POST /whatsapp/send-confirmation/:bookingId` - Enviar confirmación
- `POST /whatsapp/send-reminder/:bookingId` - Enviar recordatorio
- `POST /whatsapp/send-cancellation/:bookingId` - Enviar cancelación
- `GET /whatsapp/logs/:bookingId` - Ver logs de mensajes

### Cron
- `POST /cron/send-reminders` - Ejecutar envío de recordatorios

## 🔧 Configuración WhatsApp Cloud API

1. Crear una app en Meta for Developers
2. Configurar WhatsApp Business API
3. Obtener el token de acceso permanente
4. Obtener el Phone Number ID
5. Configurar las variables de entorno en el backend

## 📝 Modelo de Datos

Ver `backend/prisma/schema.prisma` para el esquema completo.

Entidades principales:
- **User**: Usuarios del sistema
- **Business**: Negocios (multinegocio)
- **Service**: Servicios ofrecidos
- **Booking**: Reservas
- **Schedule**: Horarios de atención
- **MessageLog**: Logs de mensajes WhatsApp

## 🎨 Frontend

El frontend incluye:
- ✅ Autenticación completa (login/register)
- ✅ Dashboard de negocios
- ✅ Gestión de servicios
- ✅ Gestión de horarios
- ✅ Gestión de reservas
- ✅ Vista pública por slug
- ✅ Diseño responsive con TailwindCSS
- ✅ Interceptores de API con refresh token automático

## 🔐 Seguridad

- JWT con refresh tokens
- Validación de datos con class-validator
- CORS configurado
- Passwords hasheados con bcrypt
- Guards de autenticación en rutas protegidas

## 📦 Estructura del Proyecto

```
entropic-apollo/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── business/
│   │   ├── booking/
│   │   ├── service/
│   │   ├── schedule/
│   │   ├── whatsapp/
│   │   ├── cron/
│   │   ├── public/
│   │   └── prisma/
│   ├── prisma/
│   ├── Dockerfile
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── lib/
│   ├── Dockerfile
│   └── railway.json
└── cron/
    ├── index.js
    ├── Dockerfile
    └── railway.json
```

## 🐛 Troubleshooting

### Error de conexión a base de datos
- Verificar que DATABASE_URL esté correctamente configurada
- Asegurarse de que las migraciones se ejecutaron

### Error de CORS
- Verificar que FRONTEND_URL esté configurada en el backend
- Revisar la configuración de CORS en main.ts

### Cron job no ejecuta
- Verificar que BACKEND_URL esté correctamente configurada
- Revisar logs en Railway
- Verificar que el endpoint /cron/send-reminders sea accesible

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado como proyecto SaaS completo end-to-end.
