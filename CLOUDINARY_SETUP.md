# Configuración de Cloudinary para Subida de Imágenes

Este documento explica cómo configurar Cloudinary para permitir la subida de imágenes de productos en la aplicación bySIMMED ERP.

## 1. Crear Cuenta en Cloudinary

1. Ve a https://cloudinary.com/users/register/free
2. Regístrate con tu correo electrónico
3. Verifica tu cuenta por email

## 2. Obtener Cloud Name

1. Una vez dentro, ve al **Dashboard**
2. En la parte superior verás tu **Cloud Name** (ejemplo: `dxxxxxxx`)
3. Copia este valor, lo necesitarás más adelante

## 3. Crear Upload Preset (Importante)

Para permitir subidas desde el cliente sin autenticación del servidor, necesitas crear un "Upload Preset":

1. En el Dashboard, ve a **Settings** (⚙️ en la esquina superior derecha)
2. Haz clic en la pestaña **Upload**
3. Scroll hacia abajo hasta la sección **Upload presets**
4. Haz clic en **Add upload preset**
5. Configura los siguientes campos:

### Configuración del Upload Preset:

- **Preset name**: `bysimmed_erp` (puedes usar otro nombre si prefieres)
- **Signing Mode**: ⚠️ **IMPORTANTE**: Selecciona **Unsigned**
  - Esto permite subidas directamente desde el navegador
- **Folder**: `erp_products` (opcional, ayuda a organizar las imágenes)
- **Access Mode**: `public`
- **Unique filename**: `true` (recomendado)
- **Overwrite**: `false`
- **Resource type**: `image`
- **Allowed formats**: `jpg, jpeg, png, webp, gif`

6. Haz clic en **Save**
7. **Copia el nombre del preset** (lo que pusiste en "Preset name")

## 4. Configurar Variables de Entorno

### En Desarrollo Local:

1. Abre el archivo `.env.local` en la raíz del proyecto frontend
2. Agrega las siguientes líneas (reemplaza con tus valores):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=bysimmed_erp
```

3. Guarda el archivo
4. Reinicia el servidor de desarrollo (`npm run dev`)

### En Producción (Vercel):

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **Environment Variables**
3. Agrega las dos variables:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = tu cloud name
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = tu preset name
4. Haz click en **Save**
5. Redespliega la aplicación

## 5. Verificar la Configuración

1. Abre la aplicación
2. Ve a Inventario
3. Haz clic en cualquier producto para editarlo
4. En el campo "Imagen" deberías ver el botón "📷 Subir Imagen"
5. Haz clic y verifica que se abra el widget de Cloudinary
6. Sube una imagen de prueba
7. La imagen debería guardarse automáticamente

## Límites del Plan Gratuito

- **Almacenamiento**: 25 GB
- **Ancho de banda**: 25 GB/mes
- **Transformaciones**: 25,000 créditos/mes

Esto es más que suficiente para una aplicación ERP de tamaño mediano.

## Solución de Problemas

### Error: "Cloudinary no está cargado"
- Verifica que el script de Cloudinary esté cargado en `app/layout.tsx`
- Recarga la página

### Error: "Falta configurar las credenciales"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que empiecen con `NEXT_PUBLIC_`
- Reinicia el servidor después de agregar las variables

### El widget no se abre
- Verifica que el Upload Preset esté configurado como **Unsigned**
- Verifica que el nombre del preset sea correcto
- Revisa la consola del navegador para ver errores

### La imagen no se guarda
- Verifica que el formato de la imagen sea permitido (jpg, png, webp, gif)
- Verifica que la imagen no supere los 5MB
- Revisa la consola del navegador para ver errores

## Seguridad

- El preset está configurado como "unsigned" para permitir subidas desde el cliente
- Se limita el tamaño máximo de archivo a 5MB
- Solo se permiten formatos de imagen
- Todas las imágenes se almacenan en la carpeta `erp_products`

## Ventajas de Usar Cloudinary

✅ No sobrecarga la base de datos MongoDB
✅ URLs permanentes y confiables
✅ Optimización automática de imágenes
✅ CDN global para carga rápida
✅ Plan gratuito generoso
✅ Redimensionamiento automático
✅ Soporte para móviles y cámara

---

**¿Necesitas ayuda?** Contacta al administrador del sistema.
