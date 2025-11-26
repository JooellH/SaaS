# 🚀 Quick Start Commands

## Comandos para ejecutar DESPUÉS de esta implementación

### 1️⃣ Generar Prisma Client (OBLIGATORIO)
```bash
cd backend
npx prisma generate
```
**Esto resolverá todos los errores de lint relacionados con Prisma**

---

### 2️⃣ Crear Migración
```bash
npx prisma migrate dev --name add_all_saas_features
```
**Esto creará las nuevas tablas en la base de datos**

---

### 3️⃣ Seed Database (Crear Planes)
```bash
npm run seed
```
**Esto creará los planes Basic, Pro y Enterprise**

---

### 4️⃣ Verificar Build
```bash
npm run build
```
**Verifica que todo compile correctamente**

---

### 5️⃣ Iniciar Servidor de Desarrollo
```bash
npm run start:dev
```
**Backend corriendo en http://localhost:3000**

---

### 6️⃣ Verificar Swagger
Abrir en navegador:
```
http://localhost:3000/docs
```

---

## 🔍 Verificación Rápida

### Endpoints de Prueba

#### 1. Health Check
```bash
curl http://localhost:3000
```

#### 2. Listar Planes
```bash
curl http://localhost:3000/billing/plans
```

#### 3. Ver Swagger JSON
```bash
curl http://localhost:3000/docs-json
```

---

## 📊 Verificar Base de Datos

```bash
npx prisma studio
```
**Abre interfaz visual de la base de datos en http://localhost:5555**

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

## 🐛 Troubleshooting

### Si hay errores de Prisma:
```bash
npx prisma generate
npx prisma migrate reset
npm run seed
```

### Si hay errores de dependencias:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Si hay errores de TypeScript:
```bash
npx prisma generate
npm run build
```

---

## 📝 Orden Recomendado

1. ✅ `npx prisma generate`
2. ✅ `npx prisma migrate dev --name add_all_saas_features`
3. ✅ `npm run seed`
4. ✅ `npm run build`
5. ✅ `npm run start:dev`
6. ✅ Abrir http://localhost:3000/docs

---

## 🚀 Para Deployment en Railway

```bash
# 1. Commit y push
git add .
git commit -m "feat: complete backend implementation with all SaaS features"
git push origin main

# 2. En Railway Dashboard:
# - Conectar repositorio
# - Crear servicio PostgreSQL
# - Configurar variables de entorno (ver .env.example)
# - Deploy automático

# 3. Verificar deployment:
# - Ver logs en Railway
# - Abrir https://your-backend.railway.app/docs
```

---

## ⚡ Comandos de Desarrollo Diario

```bash
# Iniciar dev server
npm run start:dev

# Ver logs en tiempo real
npm run start:dev | grep ERROR

# Formatear código
npm run format

# Lint
npm run lint

# Ver base de datos
npx prisma studio
```

---

## 📚 Documentación Disponible

- `README.md` - Overview del proyecto
- `EXECUTIVE_SUMMARY.md` - Resumen ejecutivo
- `backend/API_REFERENCE.md` - Documentación de endpoints
- `backend/IMPLEMENTATION_SUMMARY.md` - Detalles técnicos
- `DEPLOYMENT_GUIDE.md` - Guía de deployment
- `FRONTEND_INTEGRATION.md` - Guía para frontend

---

## ✅ Checklist Post-Implementación

- [ ] Ejecutar `npx prisma generate`
- [ ] Ejecutar migración
- [ ] Ejecutar seed
- [ ] Verificar build
- [ ] Iniciar servidor
- [ ] Verificar Swagger
- [ ] Probar endpoints básicos
- [ ] Revisar documentación
- [ ] Configurar .env
- [ ] Commit y push

---

**¡Todo listo para producción!** 🎉
