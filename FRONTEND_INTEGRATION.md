# Frontend Integration Guide

## 📡 Endpoints para el Frontend

Este documento lista todos los endpoints del backend que el frontend necesitará consumir.

---

## 🔐 Autenticación

### Base URL
```
Development: http://localhost:3000
Production: https://your-backend.railway.app
```

### Headers Requeridos
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <jwt_token>' // Para endpoints protegidos
}
```

---

## 📋 Endpoints Disponibles

### 1. Autenticación

#### Registro
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: {
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: {
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

---

### 2. Negocios

#### Crear Negocio
```http
POST /business
Authorization: Bearer <token>

{
  "name": "Mi Barbería",
  "slug": "mi-barberia",
  "phoneNumber": "+1234567890",
  "timezone": "America/Argentina/Buenos_Aires",
  "logoUrl": "https://...",
  "brandColor": "#FF5733",
  "bannerUrl": "https://..."
}
```

#### Listar Mis Negocios
```http
GET /business
Authorization: Bearer <token>

Response: [
  {
    "id": "...",
    "name": "Mi Barbería",
    "slug": "mi-barberia",
    ...
  }
]
```

#### Obtener Negocio por Slug (Público)
```http
GET /business/:slug/public

Response: {
  "id": "...",
  "name": "Mi Barbería",
  "logoUrl": "...",
  "brandColor": "#FF5733",
  "services": [...],
  "schedule": [...]
}
```

#### Actualizar Negocio
```http
PATCH /business/:id
Authorization: Bearer <token>

{
  "name": "Nuevo Nombre",
  "logoUrl": "https://..."
}
```

---

### 3. Staff

#### Crear Staff
```http
POST /business/:businessId/staff
Authorization: Bearer <token>

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "role": "STAFF",
  "permissions": {
    "canManageServices": true,
    "canManageBookings": true
  }
}

Response: {
  "id": "...",
  "inviteToken": "uuid-token",
  "status": "PENDING"
}
```

#### Listar Staff
```http
GET /business/:businessId/staff
Authorization: Bearer <token>

Response: [
  {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "STAFF",
    "status": "ACTIVE"
  }
]
```

#### Aceptar Invitación (Público)
```http
POST /staff/accept-invite

{
  "token": "invite-token-uuid"
}
```

---

### 4. Servicios

#### Crear Servicio
```http
POST /business/:businessId/service
Authorization: Bearer <token>

{
  "name": "Corte de Cabello",
  "description": "Corte clásico",
  "durationMinutes": 30,
  "cleaningTimeMinutes": 10,
  "price": 25.00,
  "isActive": true
}
```

#### Listar Servicios
```http
GET /business/:businessId/service
Authorization: Bearer <token>

Response: [
  {
    "id": "...",
    "name": "Corte de Cabello",
    "price": 25.00,
    "durationMinutes": 30
  }
]
```

---

### 5. Horarios

#### Configurar Horario
```http
POST /business/:businessId/schedule
Authorization: Bearer <token>

{
  "weekday": 1, // 0=Domingo, 1=Lunes, etc.
  "intervals": [
    { "start": "09:00", "end": "12:00" },
    { "start": "13:00", "end": "18:00" }
  ],
  "isActive": true
}
```

#### Agregar Día Especial
```http
POST /business/:businessId/schedule/special-days
Authorization: Bearer <token>

{
  "date": "2025-12-25",
  "isClosed": true,
  "reason": "Navidad"
}
```

---

### 6. Disponibilidad

#### Obtener Slots Disponibles
```http
GET /availability/:businessId?serviceId=xxx&date=2025-12-01

Response: [
  "09:00",
  "09:15",
  "09:30",
  "10:00",
  ...
]
```

**Uso en Frontend:**
```javascript
const getAvailability = async (businessId, serviceId, date) => {
  const response = await fetch(
    `${API_URL}/availability/${businessId}?serviceId=${serviceId}&date=${date}`
  );
  return response.json();
};
```

---

### 7. Reservas

#### Crear Reserva (Público)
```http
POST /public/booking/:businessId

{
  "serviceId": "service-id",
  "date": "2025-12-01",
  "startTime": "10:00",
  "clientName": "Cliente Nombre",
  "clientPhone": "+1234567890",
  "clientEmail": "cliente@example.com"
}
```

#### Listar Reservas
```http
GET /booking/:businessId
Authorization: Bearer <token>

Response: [
  {
    "id": "...",
    "date": "2025-12-01T00:00:00Z",
    "startTime": "10:00",
    "endTime": "10:30",
    "clientName": "Cliente",
    "status": "CONFIRMED",
    "service": { "name": "Corte" }
  }
]
```

#### Cancelar Reserva
```http
PATCH /booking/:id/cancel
Authorization: Bearer <token>
```

---

### 8. Analytics

#### Obtener Estadísticas
```http
GET /analytics/:businessId
Authorization: Bearer <token>

Response: {
  "totalBookings": 150,
  "popularServices": [
    { "name": "Corte", "count": 45 }
  ],
  "cancellationRate": 5.2,
  "byStatus": [...]
}
```

---

### 9. Exportación

#### Exportar Reservas
```http
GET /export/reservations/:businessId
Authorization: Bearer <token>

Response: CSV file download
```

**Uso en Frontend:**
```javascript
const exportReservations = (businessId) => {
  window.location.href = `${API_URL}/export/reservations/${businessId}`;
};
```

---

### 10. Logs

#### Obtener Logs
```http
GET /logs/:businessId
Authorization: Bearer <token>

Response: {
  "actions": [...],
  "errors": [...]
}
```

---

### 11. Billing

#### Listar Planes
```http
GET /billing/plans

Response: [
  {
    "id": "plan_basic",
    "name": "Basic",
    "price": 29.99,
    "limits": {
      "maxStaff": 3,
      "maxServices": 5
    }
  }
]
```

#### Obtener Suscripción
```http
GET /billing/subscription/:businessId
Authorization: Bearer <token>

Response: {
  "status": "ACTIVE",
  "plan": {
    "name": "Pro",
    "price": 79.99
  }
}
```

---

## 🎨 Props Sugeridos para Componentes

### BusinessCard
```typescript
interface BusinessCardProps {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor?: string;
  servicesCount: number;
  bookingsCount: number;
}
```

### ServiceCard
```typescript
interface ServiceCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}
```

### BookingCard
```typescript
interface BookingCardProps {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
}
```

### AvailabilityPicker
```typescript
interface AvailabilityPickerProps {
  businessId: string;
  serviceId: string;
  selectedDate: Date;
  onSlotSelect: (time: string) => void;
}
```

---

## 🔄 Flujos de Usuario

### Flujo de Reserva Pública
```
1. GET /business/:slug/public → Obtener info del negocio
2. Usuario selecciona servicio
3. Usuario selecciona fecha
4. GET /availability/:businessId?serviceId=xxx&date=xxx → Obtener slots
5. Usuario selecciona hora
6. POST /public/booking/:businessId → Crear reserva
7. Confirmación + WhatsApp automático
```

### Flujo de Dashboard Owner
```
1. POST /auth/login → Login
2. GET /business → Listar negocios
3. GET /analytics/:businessId → Ver estadísticas
4. GET /booking/:businessId → Ver reservas
5. GET /logs/:businessId → Ver logs
```

---

## ⚠️ Manejo de Errores

Todos los endpoints devuelven errores en formato estándar:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**Códigos comunes:**
- `400` - Bad Request (validación)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🔒 Autenticación en Frontend

### Guardar Token
```javascript
localStorage.setItem('access_token', token);
```

### Interceptor Axios (Ejemplo)
```javascript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Refresh Token
```javascript
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  const response = await axios.post('/auth/refresh', { refresh_token: refresh });
  localStorage.setItem('access_token', response.data.access_token);
};
```

---

## 📱 Responsive Considerations

- Todos los endpoints soportan JSON
- CORS configurado para frontend
- Rate limiting: 100 req/15min
- Tamaño máximo de payload: 10MB

---

## 🧪 Testing Endpoints

### Swagger UI
```
http://localhost:3000/docs
```

### Postman Collection
Importar desde Swagger: `http://localhost:3000/docs-json`

---

## 📞 Soporte

Para dudas sobre integración:
1. Revisar [API_REFERENCE.md](./API_REFERENCE.md)
2. Revisar ejemplos en este documento
3. Consultar Swagger docs

---

**Última actualización**: Noviembre 2025
