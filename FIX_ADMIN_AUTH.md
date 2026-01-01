# 🐛 Fix: Autenticación de Endpoints Admin - Solución

## El Problema

Cuando intentabas usar el endpoint `/admin/api-keys` con tu `x-admin-key`, recibías este error:

```json
{"error":"Permiso denegado. Se requiere role: admin"}
```

Esto ocurría incluso pasando la `x-admin-key` correcta.

## ¿Por Qué Pasaba?

El problema estaba en el flujo de autenticación:

### ❌ Flujo Anterior (Incorrecto)

```
1. Router recibe request a /admin/api-keys
2. authMiddleware() se ejecuta
3. /admin/api-keys estaba en publicPaths
   → authMiddleware retorna sin validar API Key
   → request.role = undefined
4. requireRole("admin") se ejecuta
5. Como request.role es undefined
   → Error: "Permiso denegado"
```

El problema: La ruta estaba marcada como "pública" pero luego se validaba el role, causando un conflicto.

## ✅ Solución Implementada

Se reorganizó el flujo para manejar endpoints admin de forma separada:

### ✅ Flujo Nuevo (Correcto)

```
1. Router recibe request a /admin/api-keys
2. Se valida x-admin-key ANTES de authMiddleware
3. requireAdminKey() middleware:
   - Valida que exista x-admin-key
   - Valida que sea correcta
   - Asigna request.role = "admin"
   - Si falla: retorna error 401/403
4. Si pasa: continúa con el handler
5. Handler crea la API Key correctamente
```

## Cambios Realizados

### 1. Nuevo Middleware: `adminKeyValidator.js`

```javascript
export function requireAdminKey(request, env) {
    const adminKey = request.headers.get("x-admin-key");
    
    if (!adminKey) {
        return error("x-admin-key requerida", 401);
    }
    
    if (adminKey !== env.ADMIN_KEY) {
        return error("x-admin-key inválida", 403);
    }
    
    // Asignar role admin
    request.role = "admin";
    request.isAdminKeyAuth = true;
    
    return null;
}
```

### 2. Actualización: `auth.js`

Se removió `/admin/api-keys` de rutas públicas:

```javascript
// Antes:
const publicPaths = ["/status", "/admin/api-keys", "/admin/api-keys/revoke"];

// Después:
const publicPaths = ["/status"];
```

### 3. Actualización: `router.js`

Se validó `x-admin-key` ANTES de aplicar otros middlewares:

```javascript
// Admin endpoints (validar x-admin-key ANTES)
if ((pathname === "/admin/api-keys" || pathname === "/admin/api-keys/revoke") && method === "POST") {
    const adminKeyCheck = requireAdminKey(request, env);
    if (adminKeyCheck instanceof Response) {
        return adminKeyCheck;
    }

    if (pathname === "/admin/api-keys") {
        return crearApiKeyAdmin(request, env);
    }
    if (pathname === "/admin/api-keys/revoke") {
        return revocarApiKeyAdmin(request, env);
    }
}
```

## Ahora Funciona Correctamente

### Uso Correcto:

```bash
curl -X POST http://localhost:8787/admin/api-keys \
  -H "x-admin-key: tu_clave_admin_secreta" \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_codigo": "ADMIN",
    "nombre": "Admin Key",
    "role": "admin"
  }'

# Respuesta exitosa:
# {
#   "api_key": "evk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "cuenta_codigo": "ADMIN",
#   "nombre": "Admin Key",
#   "role": "admin"
# }
```

### Casos de Error:

```bash
# Sin x-admin-key
curl -X POST http://localhost:8787/admin/api-keys ...
# {"error":"x-admin-key requerida","status":401}

# Con x-admin-key incorrecta
curl -X POST http://localhost:8787/admin/api-keys \
  -H "x-admin-key: clave_incorrecta" ...
# {"error":"x-admin-key inválida","status":403}
```

## Probar el Fix

### 1. Inicia el servidor
```bash
npm run dev
```

### 2. Crea tu primer API Key (admin)
```bash
curl -X POST http://localhost:8787/admin/api-keys \
  -H "x-admin-key: tu_clave_admin_secreta" \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_codigo": "ADMIN",
    "nombre": "Admin Key",
    "role": "admin"
  }'
```

### 3. Guarda la respuesta
La API Key devuelta es: `evk_xxxxxxxx...`

### 4. Crea otra key con role 'write'
```bash
curl -X POST http://localhost:8787/admin/api-keys \
  -H "x-admin-key: tu_clave_admin_secreta" \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_codigo": "DEMO",
    "nombre": "Dashboard Key",
    "role": "write"
  }'
```

### 5. Usa esa key en el dashboard
En `http://localhost:8000`, pega la `evk_...` key en el campo de API Key.

## Seguridad

✅ La `x-admin-key` NUNCA se almacena en la BD  
✅ Solo se valida en tiempo de ejecución  
✅ Las API Keys que crea SÍ se almacenan (hasheadas)  
✅ Las API Keys creadas usan `x-api-key` para requests posteriores  

## Diferencia de Headers

| Header | Uso | Almacenamiento |
|--------|-----|-----------------|
| `x-admin-key` | Crear/revocar API Keys | NO (validación runtime) |
| `x-api-key` | Requests normales (eventos, etc) | SÍ (en tabla api_keys) |

## Commits

✅ Commit: `3df0fc3` - "fix: Corregir autenticación de endpoints admin"

## Status

✅ **SOLUCIONADO** - El endpoint `/admin/api-keys` funciona correctamente con `x-admin-key`
