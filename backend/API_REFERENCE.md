# API Reference - Reserva Pro Backend

## Base URL
```
Production: https://your-app.railway.app
Development: http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Staff Management

### Create Staff Member
**POST** `/business/:businessId/staff`

Creates a new staff member and generates an invite token.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "STAFF",
  "permissions": {
    "canManageServices": true,
    "canManageBookings": true
  }
}
```

**Response:**
```json
{
  "id": "staff_id",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "PENDING",
  "inviteToken": "uuid-token"
}
```

### Get All Staff
**GET** `/business/:businessId/staff`

### Accept Invite
**POST** `/staff/accept-invite`

**Request Body:**
```json
{
  "token": "invite-token-uuid"
}
```

### Update Staff
**PATCH** `/business/:businessId/staff/:id`

### Delete Staff
**DELETE** `/business/:businessId/staff/:id`

---

## 📅 Schedule Management

### Create/Update Schedule
**POST** `/business/:businessId/schedule`

**Request Body:**
```json
{
  "weekday": 1,
  "intervals": [
    { "start": "09:00", "end": "12:00" },
    { "start": "13:00", "end": "18:00" }
  ],
  "isActive": true
}
```

### Add Special Day
**POST** `/business/:businessId/schedule/special-days`

**Request Body:**
```json
{
  "date": "2025-12-25",
  "isClosed": true,
  "reason": "Christmas Day"
}
```

Or with custom intervals:
```json
{
  "date": "2025-12-24",
  "isClosed": false,
  "intervals": [
    { "start": "09:00", "end": "14:00" }
  ],
  "reason": "Christmas Eve - Half Day"
}
```

### Get Special Days
**GET** `/business/:businessId/schedule/special-days`

---

## 🎯 Availability

### Get Available Slots
**GET** `/availability/:businessId?serviceId=xxx&date=2025-12-01`

**Response:**
```json
[
  "09:00",
  "09:15",
  "09:30",
  "10:00",
  ...
]
```

This endpoint considers:
- Business schedule
- Special days/holidays
- Existing bookings
- Service duration + cleaning time

---

## 📊 Analytics

### Get Business Statistics
**GET** `/analytics/:businessId`

**Response:**
```json
{
  "totalBookings": 150,
  "popularServices": [
    { "name": "Haircut", "count": 45 },
    { "name": "Massage", "count": 30 }
  ],
  "cancellationRate": 5.2,
  "byStatus": [
    { "status": "CONFIRMED", "_count": { "status": 120 } },
    { "status": "CANCELLED", "_count": { "status": 8 } }
  ]
}
```

---

## 📥 Export Data

### Export Reservations
**GET** `/export/reservations/:businessId`

Returns CSV file with all reservations.

### Export Clients
**GET** `/export/clients/:businessId`

Returns CSV file with unique clients.

### Export Services
**GET** `/export/services/:businessId`

Returns CSV file with all services.

---

## 📝 Logs

### Get Business Logs
**GET** `/logs/:businessId`

**Response:**
```json
{
  "actions": [
    {
      "id": "log_id",
      "action": "UPDATE_SETTINGS",
      "entity": "Business",
      "entityId": "business_id",
      "details": { ... },
      "createdAt": "2025-11-26T10:00:00Z",
      "user": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "errors": [
    {
      "id": "error_id",
      "source": "CRON_REMINDER",
      "error": "WhatsApp API timeout",
      "createdAt": "2025-11-26T10:00:00Z"
    }
  ]
}
```

---

## ⏰ Cron Jobs

### Trigger Reminders Manually
**POST** `/cron/send-reminders`

**Response:**
```json
{
  "success": true,
  "processed": 15,
  "successCount": 14,
  "failCount": 1,
  "timestamp": "2025-11-26T10:00:00Z"
}
```

### Get Cron Logs
**GET** `/cron/logs`

Returns system-wide error logs from cron jobs.

---

## 💳 Billing (Preparation)

### Get Available Plans
**GET** `/billing/plans`

**Response:**
```json
[
  {
    "id": "plan_id",
    "name": "Basic",
    "price": 29.99,
    "currency": "USD",
    "limits": {
      "maxStaff": 5,
      "maxServices": 10,
      "maxBookingsPerMonth": 100
    }
  }
]
```

### Get Business Subscription
**GET** `/billing/subscription/:businessId`

**Response:**
```json
{
  "id": "sub_id",
  "status": "ACTIVE",
  "startDate": "2025-01-01T00:00:00Z",
  "plan": {
    "name": "Pro",
    "price": 79.99,
    "limits": { ... }
  }
}
```

---

## 🎨 Business Branding

### Update Business Branding
**PATCH** `/business/:id`

**Request Body:**
```json
{
  "logoUrl": "https://example.com/logo.png",
  "brandColor": "#FF5733",
  "bannerUrl": "https://example.com/banner.jpg"
}
```

---

## 🔒 Security Features

The backend includes:
- **Rate Limiting**: Global rate limiting on all endpoints
- **Input Sanitization**: Automatic sanitization of all inputs
- **CSRF Protection**: For public endpoints
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **Security Logging**: All unauthorized attempts are logged

---

## 📚 Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/docs
```

---

## Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:4200
PORT=3000
WHATSAPP_API_URL=https://api.whatsapp.com
```
