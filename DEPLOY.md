# DEPLOY GUIDE - RESERVA PRO

## 📦 Estructura del Proyecto

```
entropic-apollo/
├── backend/          # NestJS API
├── frontend/         # Next.js 14 App
├── cron/            # Cron Job Service
└── README.md
```

## 🚀 Deploy en Railway - Paso a Paso

### 1. Crear Cuenta en Railway

1. Ir a [railway.app](https://railway.app)
2. Crear cuenta con GitHub
3. Crear un nuevo proyecto

### 2. Deploy PostgreSQL Database

1. En Railway, click "New" → "Database" → "PostgreSQL"
2. Esperar a que se provisione
3. Copiar la `DATABASE_URL` desde las variables de entorno

### 3. Deploy Backend

1. En Railway, click "New" → "GitHub Repo"
2. Seleccionar el repositorio y la carpeta `backend`
3. Railway detectará automáticamente el `Dockerfile`
4. Configurar variables de entorno:

```env
DATABASE_URL=postgresql://... (copiar de la base de datos)
JWT_SECRET=tu_secret_super_seguro_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_aqui
WHATSAPP_API_TOKEN=tu_token_whatsapp (opcional)
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id (opcional)
PORT=3000
FRONTEND_URL=https://tu-frontend.railway.app
```

5. Click "Deploy"
6. Esperar a que termine el deploy
7. Copiar la URL pública del backend (ej: `https://backend-production-xxxx.up.railway.app`)

### 4. Ejecutar Migraciones

Una vez desplegado el backend, las migraciones se ejecutan automáticamente en el Dockerfile.

Si necesitas ejecutar el seed manualmente:

1. Ir a la terminal del servicio backend en Railway
2. Ejecutar: `npm run prisma:seed`

### 5. Deploy Frontend

1. En Railway, click "New" → "GitHub Repo"
2. Seleccionar el repositorio y la carpeta `frontend`
3. Railway detectará automáticamente el `Dockerfile`
4. Configurar variables de entorno:

```env
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
```

5. Click "Deploy"
6. Esperar a que termine el deploy
7. Copiar la URL pública del frontend

### 6. Deploy Cron Job

1. En Railway, click "New" → "GitHub Repo"
2. Seleccionar el repositorio y la carpeta `cron`
3. Railway detectará automáticamente el `Dockerfile` y `railway.json`
4. Configurar variables de entorno:

```env
BACKEND_URL=https://backend-production-xxxx.up.railway.app
```

5. Click "Deploy"
6. El cron job se ejecutará automáticamente cada 15 minutos

### 7. Actualizar CORS en Backend

1. Volver al servicio backend en Railway
2. Actualizar la variable `FRONTEND_URL` con la URL real del frontend
3. Redeploy automático

## 🔐 Configurar WhatsApp Cloud API (Opcional)

### Paso 1: Crear App en Meta for Developers

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear una nueva app
3. Agregar el producto "WhatsApp"

### Paso 2: Obtener Credenciales

1. En WhatsApp → Getting Started
2. Copiar el `Phone Number ID`
3. Generar un `Access Token` permanente
4. Guardar ambos valores

### Paso 3: Configurar en Railway

1. Ir al servicio backend
2. Agregar variables de entorno:
   - `WHATSAPP_API_TOKEN=tu_token`
   - `WHATSAPP_PHONE_NUMBER_ID=tu_phone_id`
3. Redeploy

## 🧪 Testing Local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
npm run dev
```

### Cron Job

```bash
cd cron
npm install
echo "BACKEND_URL=http://localhost:3000" > .env
node index.js
```

## 📝 Credenciales Demo

Después de ejecutar el seed:

```
Email: demo@reservapro.com
Password: demo123
Business URL: /demo-salon
```

## 🔧 Troubleshooting

### Error: Cannot connect to database

- Verificar que `DATABASE_URL` esté correctamente configurada
- Verificar que las migraciones se ejecutaron

### Error: CORS

- Verificar que `FRONTEND_URL` esté configurada en el backend
- Verificar que apunte a la URL correcta del frontend

### Cron job no ejecuta

- Verificar que `BACKEND_URL` esté configurada
- Verificar que el endpoint `/cron/send-reminders` sea accesible
- Revisar logs en Railway

### WhatsApp no envía mensajes

- Verificar que `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` estén configurados
- Verificar que el token sea válido
- Revisar logs de mensajes en la base de datos (tabla `MessageLog`)

## 📊 Monitoreo

En Railway puedes:

- Ver logs en tiempo real
- Ver métricas de uso
- Configurar alertas
- Ver historial de deploys

## 🔄 Actualizar el Proyecto

1. Hacer push a GitHub
2. Railway detectará automáticamente los cambios
3. Se ejecutará un nuevo deploy automáticamente

## 💰 Costos Estimados

Railway ofrece:

- $5 USD de crédito gratis mensual
- Después: ~$5-10 USD/mes para este proyecto (dependiendo del uso)

## 📚 Recursos Adicionales

- [Documentación de Railway](https://docs.railway.app)
- [Documentación de NestJS](https://docs.nestjs.com)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

## ✅ Checklist de Deploy

- [ ] Base de datos PostgreSQL creada
- [ ] Backend desplegado y funcionando
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (opcional)
- [ ] Frontend desplegado
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Cron job desplegado
- [ ] WhatsApp configurado (opcional)
- [ ] Prueba de login funcionando
- [ ] Prueba de creación de negocio funcionando

## 🎉 ¡Listo!

Tu aplicación RESERVA PRO está ahora en producción y lista para usar.
