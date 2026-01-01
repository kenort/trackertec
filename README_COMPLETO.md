# MQTT Backend - Sistema de Recepción de Eventos en Tiempo Real

Sistema serverless en Cloudflare Workers para recibir, procesar y gestionar eventos MQTT en tiempo real con dashboard web interactivo.

## 🎯 Características Principales

### ✅ Implementadas

1. **Recepción de Eventos MQTT**
   - Integración con HiveMQ Cloud
   - Procesamiento en tiempo real
   - Normalización de eventos

2. **API REST Completa**
   - Endpoints protegidos con API Keys
   - Diferentes roles (admin, write, read)
   - Rate limiting automático

3. **Roles y Seguridad**
   - API Keys hasheadas con SHA-256
   - Control de acceso por role
   - Rate limiting según nivel de acceso
   - Revocación inmediata de claves

4. **Base de Datos Cloud**
   - Cloudflare D1 (SQLite)
   - Tablas optimizadas con índices
   - Versionado automático

5. **Dashboard Web Interactivo**
   - Tabla de eventos en tiempo real
   - Mapa interactivo con ubicaciones
   - Filtros avanzados
   - Actualización automática

6. **Sistema de Notificaciones**
   - Notificaciones por evento
   - Estados (info, warning, error, critical)
   - API para gestión de notificaciones
   - Contador de no leídas

7. **Analítica Avanzada**
   - Estadísticas por período
   - Series temporales
   - Distribución por tipo de evento
   - Top cuentas
   - Reportes automáticos

---

## 📋 Estructura del Proyecto

```
mqtt-backend/
├── src/
│   ├── index.js                 # Punto de entrada
│   ├── router.js               # Enrutador de requests
│   ├── handlers/               # Controladores por dominio
│   │   ├── eventos.js
│   │   ├── notificaciones.js
│   │   ├── analytics.js
│   │   ├── adminApiKeys.js
│   │   └── health.js
│   ├── middleware/             # Middlewares
│   │   ├── auth.js            # Autenticación
│   │   ├── rateLimit.js       # Rate limiting
│   │   └── roleValidator.js   # Validación de roles
│   ├── services/              # Lógica de negocio
│   │   └── eventosService.js
│   ├── lib/                   # Utilidades
│   └── utils/                 # Helpers
├── frontend/                   # Dashboard web
│   ├── index.html
│   ├── styles.css
│   ├── config.js
│   └── dashboard.js
├── schema.sql                 # Esquema de base de datos
├── wrangler.jsonc            # Configuración de Cloudflare
├── API.md                     # Documentación API
├── test-api-full.sh          # Script de pruebas
└── README.md                  # Este archivo
```

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- Cuenta de Cloudflare con Workers habilitados
- Cloudflare D1 (base de datos)
- HiveMQ Cloud (broker MQTT)

### 1. Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/kenort/trackertec.git
cd mqtt-backend

# Instalar dependencias
npm install
```

### 2. Configuración

Crear archivo `.dev.vars`:
```
DB=tu_base_datos_d1
MQTT_BROKER=tu.hivemq.cloud
MQTT_PORT=8883
MQTT_USER=tu_usuario
MQTT_PASSWORD=tu_contraseña
ADMIN_KEY=tu_clave_admin_secreta
```

### 3. Crear Base de Datos

```bash
# Crear tablas
wrangler d1 execute mqtt-db --file schema.sql

# Crear API Key de admin
curl -X POST http://localhost:8787/admin/api-keys \
  -H "x-admin-key: tu_clave_admin_secreta" \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_codigo": "ADMIN",
    "nombre": "Admin Key",
    "role": "admin"
  }'
```

### 4. Desarrollo Local

```bash
npm run dev
# API: http://localhost:8787
```

### 5. Dashboard

```bash
cd frontend
python3 -m http.server 8000
# Dashboard: http://localhost:8000
# Usa la API Key creada arriba
```

---

## 🔧 Configuración

### Variables de Entorno (wrangler.jsonc)

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production"
      },
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "mqtt-db",
          "database_id": "xxxxx"
        }
      ]
    }
  }
}
```

### Configuración del Dashboard (frontend/config.js)

```javascript
const CONFIG = {
    API_URL: 'https://tu-backend.workers.dev',
    REFRESH_INTERVAL: 5000,  // ms
    MAX_ROWS: 100
};
```

---

## 📚 API Documentation

Ver [API.md](./API.md) para documentación completa de todos los endpoints.

### Resumen Rápido

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/eventos` | Crear evento |
| GET | `/eventos` | Listar eventos |
| GET | `/notificaciones` | Obtener notificaciones |
| POST | `/notificaciones/marcar-leida` | Marcar leída |
| GET | `/analytics/estadisticas` | Estadísticas |
| GET | `/analytics/serie-temporal` | Serie temporal |
| POST | `/admin/api-keys` | Crear API Key |
| POST | `/admin/api-keys/revoke` | Revocar API Key |

---

## 🧪 Pruebas

### Prueba Rápida

```bash
# Hacer ejecutable el script
chmod +x test-api-full.sh

# Ejecutar pruebas
./test-api-full.sh http://localhost:8787 tu_api_key
```

### Pruebas Manuales

```bash
# Health check
curl http://localhost:8787/status

# Crear evento
curl -X POST http://localhost:8787/eventos \
  -H "x-api-key: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"movimiento","cuenta_codigo":"TEST001"}'

# Listar eventos
curl "http://localhost:8787/eventos" \
  -H "x-api-key: tu_api_key"
```

---

## 📊 Roles y Permisos

### admin
- Crear/revocar API Keys
- Acceso a analytics de todas las cuentas
- Todos los permisos de write

### write
- Crear eventos
- Listar eventos
- Acceso a notificaciones
- Rate limit: 500 req/min

### read
- Listar eventos
- Acceso a notificaciones
- Rate limit: 100 req/min

---

## 🔒 Seguridad

- ✅ API Keys hasheadas con SHA-256
- ✅ Middleware de autenticación en todos los endpoints
- ✅ Validación de roles
- ✅ Rate limiting automático
- ✅ HTTPS recomendado para producción
- ✅ Separación de claves admin/cliente

---

## 📈 Deployment

### Cloudflare Workers

```bash
# Deploy a producción
npm run deploy

# Verificar deployment
curl https://tu-proyecto.workers.dev/status
```

### Dashboard a Cloudflare Pages

1. Conectar repositorio a Cloudflare Pages
2. Build: (sin compilación necesaria)
3. Publicar carpeta `frontend/`

---

## 🛠️ Desarrollo

### Agregar nuevo endpoint

1. Crear handler en `src/handlers/`
2. Importar en `src/router.js`
3. Agregar ruta en `router()`
4. Documentar en `API.md`

### Agregar nueva tabla

1. Crear migración en `schema.sql`
2. Ejecutar: `wrangler d1 execute mqtt-db --file schema.sql`
3. Actualizar handlers según sea necesario

---

## 📝 Logs y Debugging

```bash
# Ver logs en tiempo real
wrangler tail

# Ejecutar con logs verbosos
wrangler dev --debug
```

---

## 🐛 Troubleshooting

### Error: "API Key inválida"
- Verificar que la clave esté activa (no revocada)
- Comprobar que tenga permiso para el endpoint

### Error: "Rate limit exceeded"
- Esperar un minuto o usar una API Key con role superior

### Error: "Base de datos no encontrada"
- Verificar configuración en `wrangler.jsonc`
- Ejecutar: `wrangler d1 create mqtt-db`

### Mapa no carga en dashboard
- Verificar conexión a internet
- Comprobar que los eventos tengan `lat` y `lng`

---

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en GitHub.

---

## 📄 Licencia

MIT

---

## 🎓 Aprendizajes

Este proyecto demuestra:

- ✅ Serverless en Cloudflare Workers
- ✅ Durable Objects para estado persistente
- ✅ D1 (SQLite en la nube)
- ✅ Arquitectura de microservicios
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Rate limiting
- ✅ Dashboard web interactivo
- ✅ API RESTful bien diseñada

---

**Versión**: 1.0.0  
**Última actualización**: 1 de enero de 2026

Crear eventos, gestionar notificaciones y obtener insights en tiempo real con TrackerTec MQTT Backend.
