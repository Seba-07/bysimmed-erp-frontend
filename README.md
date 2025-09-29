# bySIMMED Hello PWA - Frontend

Frontend PWA de validación para bySIMMED. Aplicación Next.js con capacidades de Progressive Web App instalable en iPad, iPhone, Android y PC.

## 🚀 Desarrollo Local

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
npm install
```

### Variables de Entorno
Crear archivo `.env.local` basado en `.env.example`:

```bash
cp .env.example .env.local
```

Configurar la URL del backend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Scripts Disponibles
- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar para producción
- `npm run start` - Ejecutar versión compilada
- `npm run lint` - Linter ESLint
- `npm run type-check` - Verificar tipos TypeScript

## 📱 Características PWA

### Service Worker
- Cache de archivos estáticos (HTML, iconos, manifest)
- Estrategia network-first para páginas
- Estrategia cache-first para assets estáticos
- Limpieza automática de cachés obsoletos

### Manifest Web App
- **Nombre:** bySIMMED Hello PWA
- **Display:** standalone (pantalla completa sin navegador)
- **Orientación:** portrait-primary
- **Tema:** #0f172a (azul oscuro)
- **Iconos:** 192x192, 512x512, 512x512 maskable

### Metadatos iOS
- Soporte para "Añadir a pantalla de inicio"
- Apple touch icon optimizado
- Status bar configurado para iOS

## 🌐 Funcionalidades

### Página Principal
- **Título:** bySIMMED — Hello PWA
- **Botón "Probar API":** Hace llamada GET a `/api/hello` del backend
- **Mostrar respuesta:** JSON formateado del backend
- **Instrucciones de instalación:** Para iPad, Android y PC

### Componentes
- **SWRegister:** Registra el service worker automáticamente
- **Responsive design:** Optimizado para mobile y desktop

## 🚀 Despliegue en Vercel

### Pasos para Desplegar

1. **Crear cuenta en Vercel** → https://vercel.com

2. **Conectar repositorio:**
   - "New Project" → "Import Git Repository"
   - Seleccionar tu repositorio de GitHub

3. **Configurar variables de entorno en Vercel:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://tu-backend.railway.app
   ```
   ⚠️ **IMPORTANTE:** Reemplazar con la URL real de Railway

4. **Vercel detectará automáticamente:**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Desplegar:**
   - Click "Deploy"
   - Vercel proporcionará una URL como `https://tu-app.vercel.app`

### Verificaciones Post-Despliegue

✅ **PWA funcional**
```bash
# Verificar manifest accesible
curl https://tu-app.vercel.app/manifest.json

# Verificar service worker accesible
curl https://tu-app.vercel.app/service-worker.js
```

✅ **Lighthouse PWA Score ≥ 90**
- Abrir Chrome DevTools → Lighthouse → Progressive Web App
- Verificar que marca "Installable"

✅ **Conectividad con backend**
- Botón "Probar API" debe mostrar respuesta del backend Railway

## 📱 Instalación en Dispositivos

### 🍎 iPad/iPhone (Safari)
1. Abrir la URL en Safari
2. Tocar el botón "Compartir" (cuadrado con flecha hacia arriba)
3. Seleccionar "Añadir a pantalla de inicio"
4. Confirmar el nombre y tocar "Añadir"

### 🤖 Android (Chrome)
1. Abrir la URL en Chrome
2. Tocar el menú (⋮) en la esquina superior derecha
3. Seleccionar "Añadir a pantalla de inicio"
4. Confirmar el nombre y tocar "Añadir"

### 💻 PC (Chrome/Edge)
1. Abrir la URL en Chrome o Edge
2. Buscar el icono "Instalar" en la barra de direcciones
3. Click en "Instalar"
4. Confirmar en el popup

## 🧪 Pruebas de Validación

### Test Local
```bash
# 1. Ejecutar backend
cd ../bysimmed_hello_pwa_backend
npm run dev

# 2. En otra terminal, ejecutar frontend
cd ../bysimmed_hello_pwa_frontend
npm run dev

# 3. Abrir http://localhost:3000
# 4. Click "Probar API" → debe mostrar JSON del backend
```

### Test en Producción
1. Desplegar backend en Railway
2. Configurar `NEXT_PUBLIC_API_BASE_URL` en Vercel
3. Desplegar frontend en Vercel
4. Probar instalación PWA desde dispositivo móvil

## 🔧 Configuración

### Variables de Entorno

#### Desarrollo (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

#### Producción (Vercel Dashboard)
```env
NEXT_PUBLIC_API_BASE_URL=https://tu-backend.railway.app
```

### Service Worker
- Solo se registra en **producción** (`NODE_ENV=production`)
- En desarrollo se saltea para evitar problemas de cache
- Cache se actualiza automáticamente en cada deploy

## 🛠️ Tecnologías

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** CSS Global + Variables CSS
- **PWA:** Service Worker nativo + Web App Manifest
- **Iconos:** PNG placeholders (192px, 512px, 512px maskable)

## 📁 Estructura del Proyecto

```
bysimmed_hello_pwa_frontend/
├── app/
│   ├── components/
│   │   └── SWRegister.tsx    # Registro del service worker
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx           # Layout principal + metadatos PWA
│   └── page.tsx             # Página principal
├── public/
│   ├── icons/
│   │   ├── icon-192.png     # Icono 192x192
│   │   ├── icon-512.png     # Icono 512x512
│   │   └── icon-512-maskable.png # Icono maskable
│   ├── manifest.json        # Manifest PWA
│   └── service-worker.js    # Service worker
├── .env.example             # Template variables de entorno
├── next.config.js           # Configuración Next.js
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración TypeScript
└── README.md               # Esta documentación
```

## 🔍 Solución de Problemas

### Service Worker no se registra
- Verificar que esté en producción (`NODE_ENV=production`)
- Confirmar que `/service-worker.js` sea accesible
- Revisar consola del navegador para errores

### Error de conexión con API
- Verificar `NEXT_PUBLIC_API_BASE_URL` en variables de entorno
- Confirmar que el backend esté desplegado y funcionando
- Revicar configuración CORS en el backend

### PWA no se puede instalar
- Verificar Lighthouse PWA score
- Confirmar que manifest.json sea válido
- Verificar que iconos estén accesibles
- Asegurar que esté sirviendo HTTPS (requerido para PWA)

### Error de build en Vercel
- Verificar que no haya errores de TypeScript (`npm run type-check`)
- Confirmar que todas las dependencias estén en `package.json`
- Revisar logs de build en Vercel Dashboard

## 📝 Próximos Pasos

Una vez validado este MVP:

1. **Autenticación:** Implementar login/registro
2. **Base de datos:** Conectar PostgreSQL o MongoDB
3. **ERP Modules:** Pacientes, citas, historiales médicos
4. **Offline-first:** Mejorar service worker para funcionalidad offline
5. **Push notifications:** Notificaciones para citas y recordatorios

## ✅ Criterios de Aceptación

- [ ] Frontend desplegado en Vercel y accesible
- [ ] PWA instalable en iPad (Safari → Compartir → Añadir a pantalla)
- [ ] PWA instalable en Android/PC (Chrome → Instalar)
- [ ] Botón "Probar API" conecta con backend Railway
- [ ] Lighthouse PWA score ≥ 90
- [ ] manifest.json y service-worker.js accesibles en producción