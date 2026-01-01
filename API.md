# API Documentation - MQTT Backend

## Base URL
```
https://tu-backend.workers.dev
```

## Autenticación

Todas las solicitudes (excepto `/status`) requieren el header:
```
x-api-key: tu_api_key
```

## Roles

Las API Keys tienen tres niveles de permiso:

| Role | Permisos |
|------|----------|
| `admin` | Crear/revocar API Keys, acceso a analytics de todas las cuentas |
| `write` | Crear eventos, listar eventos, acceso a notificaciones |
| `read` | Solo listar eventos, acceso a notificaciones |

## Rate Limiting

Límites por minuto según role:

| Role | Límite |
|------|--------|
| `admin` | 1000 req/min |
| `write` | 500 req/min |
| `read` | 100 req/min |

Respuesta cuando se excede: HTTP 429 Too Many Requests

---

## Endpoints

### 1. Health Check ✅

**GET** `/status`

Sin autenticación.

```bash
curl https://tu-backend.workers.dev/status
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T12:00:00Z"
}
```

---

### 2. Eventos

#### Crear Evento
**POST** `/eventos`

Requiere role: `write` o `admin`

```bash
curl -X POST https://tu-backend.workers.dev/eventos \
  -H "x-api-key: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "movimiento",
    "cuenta_codigo": "CUENTA001",
    "origen": "gps_device",
    "lat": 40.7128,
    "lng": -74.0060,
    "fecha_evento": "2026-01-01T12:30:00Z",
    "payload": { "velocidad": 85, "direccion": "N" }
  }'
```

**Request Fields:**
- `tipo` (string, required): Tipo de evento
- `cuenta_codigo` (string, required): Código de la cuenta
- `origen` (string, optional): Origen del evento
- `lat` (number, optional): Latitud
- `lng` (number, optional): Longitud
- `fecha_evento` (string, optional): ISO 8601 timestamp
- `payload` (object, optional): Datos adicionales

**Response:**
```json
{
  "ok": true
}
```

#### Listar Eventos
**GET** `/eventos`

Requiere role: `read`, `write` o `admin`

```bash
curl https://tu-backend.workers.dev/eventos?cuenta=CUENTA001&tipo=movimiento&limit=50&offset=0 \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `cuenta` (string, optional): Filtrar por cuenta
- `tipo` (string, optional): Filtrar por tipo de evento
- `limit` (number, default 50): Máximo de resultados
- `offset` (number, default 0): Offset para paginación

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "event_id": "evt_123",
      "tipo": "movimiento",
      "cuenta_codigo": "CUENTA001",
      "origen": "gps_device",
      "lat": 40.7128,
      "lng": -74.0060,
      "fecha_evento": "2026-01-01T12:30:00Z",
      "payload": "{}",
      "created_at": "2026-01-01T12:30:01Z"
    }
  ],
  "total": 150
}
```

---

### 3. Notificaciones

#### Obtener Notificaciones
**GET** `/notificaciones`

Requiere autenticación

```bash
curl "https://tu-backend.workers.dev/notificaciones?leidas=false&limite=50" \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `leidas` (boolean, default any): Filtrar por estado (true/false)
- `limite` (number, default 50): Máximo de resultados

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Alarma detectada",
      "mensaje": "Se detectó una alarma en el evento 123",
      "tipo": "critical",
      "evento_id": "evt_123",
      "leida": 0,
      "created_at": "2026-01-01T12:30:00Z"
    }
  ],
  "count": 1
}
```

#### Marcar Notificación como Leída
**POST** `/notificaciones/marcar-leida`

Requiere autenticación

```bash
curl -X POST https://tu-backend.workers.dev/notificaciones/marcar-leida \
  -H "x-api-key: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{ "notificacion_id": 1 }'
```

**Response:**
```json
{
  "success": true
}
```

#### Marcar Todas como Leídas
**POST** `/notificaciones/marcar-todas-leidas`

Requiere autenticación

```bash
curl -X POST https://tu-backend.workers.dev/notificaciones/marcar-todas-leidas \
  -H "x-api-key: tu_api_key"
```

**Response:**
```json
{
  "success": true,
  "updated": 5
}
```

#### Contador de No Leídas
**GET** `/notificaciones/contador`

Requiere autenticación

```bash
curl https://tu-backend.workers.dev/notificaciones/contador \
  -H "x-api-key: tu_api_key"
```

**Response:**
```json
{
  "unread_count": 3
}
```

---

### 4. Analytics

#### Resumen por Tipo
**GET** `/analytics/resumen-por-tipo`

Requiere autenticación

```bash
curl "https://tu-backend.workers.dev/analytics/resumen-por-tipo?dias=7" \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `dias` (number, default 7): Período en días

**Response:**
```json
{
  "periodo_dias": 7,
  "data": [
    {
      "tipo": "movimiento",
      "total": 245
    },
    {
      "tipo": "parada",
      "total": 128
    }
  ]
}
```

#### Serie Temporal
**GET** `/analytics/serie-temporal`

Requiere autenticación

```bash
curl "https://tu-backend.workers.dev/analytics/serie-temporal?dias=7&tipo=movimiento" \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `dias` (number, default 7): Período en días
- `tipo` (string, optional): Filtrar por tipo de evento

**Response:**
```json
{
  "periodo_dias": 7,
  "tipo_filtro": "movimiento",
  "data": [
    {
      "hora": "2026-01-01 12:00:00",
      "tipo": "movimiento",
      "cantidad": 42
    }
  ]
}
```

#### Top Cuentas
**GET** `/analytics/top-cuentas`

Requiere role: `admin`

```bash
curl "https://tu-backend.workers.dev/analytics/top-cuentas?dias=7&limite=10" \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `dias` (number, default 7): Período en días
- `limite` (number, default 10): Número de cuentas a retornar

**Response:**
```json
{
  "periodo_dias": 7,
  "data": [
    {
      "cuenta_codigo": "CUENTA001",
      "total_eventos": 450
    }
  ]
}
```

#### Estadísticas Generales
**GET** `/analytics/estadisticas`

Requiere autenticación

```bash
curl "https://tu-backend.workers.dev/analytics/estadisticas?dias=30" \
  -H "x-api-key: tu_api_key"
```

**Query Parameters:**
- `dias` (number, default 7): Período en días

**Response:**
```json
{
  "periodo_dias": 30,
  "estadisticas": {
    "total_eventos": 12450,
    "evento_mas_frecuente": "movimiento",
    "eventos_tipo_frecuente": 6200,
    "promedio_eventos_por_dia": 415
  }
}
```

---

### 5. Admin - API Keys

#### Crear API Key
**POST** `/admin/api-keys`

Requiere role: `admin`

```bash
curl -X POST https://tu-backend.workers.dev/admin/api-keys \
  -H "x-api-key: tu_api_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_codigo": "CUENTA001",
    "nombre": "Mi API Key",
    "role": "write"
  }'
```

**Request Fields:**
- `cuenta_codigo` (string, required): Código de la cuenta
- `nombre` (string, optional): Nombre descriptivo
- `role` (string, default "read"): "admin", "write", o "read"

**Response:**
```json
{
  "api_key": "evk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "cuenta_codigo": "CUENTA001",
  "nombre": "Mi API Key",
  "role": "write"
}
```

⚠️ **Importante**: La API Key se devuelve solo una vez. Guárdala en un lugar seguro.

#### Revocar API Key
**POST** `/admin/api-keys/revoke`

Requiere role: `admin`

```bash
curl -X POST https://tu-backend.workers.dev/admin/api-keys/revoke \
  -H "x-api-key: tu_api_admin" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "evk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }'
```

**Response:**
```json
{
  "revoked": true
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Solicitud inválida (campos faltantes) |
| 401 | No autenticado (API Key faltante) |
| 403 | No autorizado (permiso insuficiente) |
| 404 | Recurso no encontrado |
| 429 | Rate limit excedido |
| 500 | Error del servidor |

**Error Response:**
```json
{
  "error": "Descripción del error",
  "status": 400
}
```

---

## Ejemplos Completos

### Ejemplo: Crear evento y verificar Analytics

```bash
# 1. Crear evento
curl -X POST https://tu-backend.workers.dev/eventos \
  -H "x-api-key: evk_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "movimiento",
    "cuenta_codigo": "CUENTA001",
    "lat": 40.7128,
    "lng": -74.0060
  }'

# 2. Verificar estadísticas
curl "https://tu-backend.workers.dev/analytics/estadisticas" \
  -H "x-api-key: evk_xxxxxxxx"
```

### Ejemplo: Dashboard

El frontend incluye ejemplos de integración con todos estos endpoints. Ver `frontend/dashboard.js`.

---

## Ambiente de Pruebas

Para probar localmente:

```bash
# Iniciar servidor de desarrollo
npm run dev

# El API estará en http://localhost:8787
```

---

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.
