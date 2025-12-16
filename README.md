# 🎯 Reserva Pro - SaaS de Reservas Multi-Negocio

Sistema completo de gestión de reservas con recordatorios automáticos por WhatsApp, diseñado para múltiples negocios.

---

## 🏗️ Arquitectura del Proyecto

```
SaaS-project/
├── backend/          # NestJS + Prisma + PostgreSQL
├── frontend/         # (Gestionado por Codex - NO MODIFICAR)
├── cron/            # Trabajos programados
└── docs/            # Documentación
```

---

## ✨ Características Principales

### 🔐 Multi-Tenant
- Sistema multi-negocio completo
- Aislamiento de datos por negocio
- Gestión de staff con roles y permisos

### 📅 Gestión Avanzada de Horarios
- Múltiples intervalos por día
- Días especiales y feriados
- Bloqueo manual de slots
- Soporte de timezone

### 🤖 Automatización
- Recordatorios automáticos por WhatsApp
- Cron jobs robustos
- Logging completo de errores

### 📊 Analytics
- Servicios más reservados
- Tasa de cancelaciones
- Estadísticas por período
- Clientes recurrentes

### 💼 SaaS Features
- Sistema de planes (Basic, Pro, Enterprise)
- Límites configurables por plan
- Preparado para integración con Stripe

### 🎨 Branding
- Logo personalizado por negocio
- Colores de marca
- Banner personalizable

### 📥 Exportación
- Exportar reservas a CSV
- Exportar clientes a CSV
- Exportar servicios a CSV

### 🔒 Seguridad
- Rate limiting global
- Detección de patrones sospechosos
- Logging de seguridad
- JWT authentication
- CORS configurado

---

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`
Swagger docs en `http://localhost:3000/docs`

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reserva_pro"
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
FRONTEND_URL="http://localhost:4200"
```

---

## 📚 Documentación

- **[API Reference](./backend/API_REFERENCE.md)** - Documentación completa de endpoints
- **[Implementation Summary](./backend/IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Guía de despliegue en Railway

---

## 🛠️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Swagger** - Documentación API
- **date-fns** - Manejo de fechas

### Infraestructura
- **Railway** - Hosting y deployment
- **Docker** - Containerización

---

## 📋 Módulos Implementados

### Core Modules
- ✅ **Auth** - Autenticación y autorización
- ✅ **User** - Gestión de usuarios
- ✅ **Business** - Gestión de negocios
- ✅ **Service** - Servicios ofrecidos
- ✅ **Booking** - Reservas
- ✅ **Schedule** - Horarios avanzados
- ✅ **Staff** - Gestión de personal

### Advanced Modules
- ✅ **Availability** - Cálculo de disponibilidad
- ✅ **Analytics** - Estadísticas y métricas
- ✅ **Logs** - Auditoría y errores
- ✅ **Export** - Exportación de datos
- ✅ **Billing** - Planes y suscripciones
- ✅ **WhatsApp** - Integración con WhatsApp
- ✅ **Cron** - Trabajos programados

---

## 🔄 Flujo de Trabajo

### 1. Registro de Negocio
```
Usuario → Registro → Crear Negocio → Configurar Horarios → Agregar Servicios
```

### 2. Gestión de Staff
```
Owner → Invitar Staff → Staff acepta → Asignar permisos
```

### 3. Reserva
```
Cliente → Selecciona servicio → Ve disponibilidad → Reserva → Confirmación WhatsApp
```

### 4. Recordatorio
```
Cron (cada minuto) → Busca reservas próximas → Envía WhatsApp → Log resultado
```

---

## 🎯 Endpoints Principales

### Autenticación
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token

### Negocios
- `POST /business` - Crear negocio
- `GET /business` - Listar mis negocios
- `PATCH /business/:id` - Actualizar negocio

### Staff
- `POST /business/:id/staff` - Crear staff
- `POST /staff/accept-invite` - Aceptar invitación

### Reservas
- `POST /booking` - Crear reserva
- `GET /booking/:businessId` - Listar reservas

### Disponibilidad
- `GET /availability/:businessId?serviceId=xxx&date=2025-12-01`

### Analytics
- `GET /analytics/:businessId` - Estadísticas

### Export
- `GET /export/reservations/:businessId` - CSV de reservas

Ver [API_REFERENCE.md](./backend/API_REFERENCE.md) para documentación completa.

---

## 🔐 Seguridad

- **Rate Limiting**: 100 requests por 15 minutos
- **Input Validation**: Validación automática con class-validator
- **SQL Injection**: Protección vía Prisma ORM
- **XSS**: Sanitización de inputs
- **CORS**: Configurado para frontend específico
- **JWT**: Tokens con expiración
- **Password Hashing**: Bcrypt con salt

---

## 📊 Base de Datos

### Modelos Principales
- User
- Business
- Staff
- Service
- Booking
- Schedule
- SpecialDay
- Plan
- Subscription
- ActionLog
- ErrorLog
- SecurityLog

Ver [schema.prisma](./backend/prisma/schema.prisma) para detalles.

---

## 🚀 Deployment

### Railway (Recomendado)

1. Conectar repositorio GitHub
2. Crear servicio PostgreSQL
3. Configurar variables de entorno
4. Deploy automático

Ver [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) para instrucciones detalladas.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📝 Convenciones de Código

- **Idioma**: Código en inglés, comentarios en español
- **Formato**: Prettier + ESLint
- **Commits**: Conventional Commits
- **Branches**: feature/, bugfix/, hotfix/

---

## 🤝 Contribución

### Reglas Importantes

⚠️ **NO MODIFICAR** el directorio `/frontend` - Gestionado por Codex

Para contribuir al backend:
1. Fork del repositorio
2. Crear branch feature
3. Commit con mensaje descriptivo
4. Push y crear PR

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar documentación en `/backend/API_REFERENCE.md`
2. Revisar logs en Railway
3. Crear issue en GitHub

---

## 📄 Licencia

Propietario: Reserva Pro
Todos los derechos reservados.

---

## 🎉 Estado del Proyecto

**Backend**: ✅ Completo y en producción
**Frontend**: 🔄 En desarrollo (Codex)
**Deployment**: ✅ Listo para Railway

---

## 🔮 Roadmap

### Próximas Características
- [ ] App móvil (React Native)
- [ ] Integración con Google Calendar
- [ ] Multi-idioma

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
