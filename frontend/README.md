# Dashboard MQTT - TrackerTec

Dashboard web en tiempo real para visualizar eventos MQTT capturados por el backend.

## Características

- 📊 **Tabla de eventos** en tiempo real con actualización automática
- 🗺️ **Mapa interactivo** con Leaflet para visualizar ubicaciones
- 📈 **Gráficos analíticos**:
  - Eventos por tipo
  - Distribución por hora
  - Top cuentas
- 🔍 **Filtros avanzados**:
  - Por cuenta
  - Por tipo de evento
  - Por rango de fechas
- 💡 **Estadísticas en vivo**:
  - Total de eventos
  - Eventos hoy
  - Eventos por hora
  - Último evento

## Instalación

### Opción 1: Servir localmente con Python
```bash
cd frontend
python3 -m http.server 8000
```

Luego acceder a `http://localhost:8000`

### Opción 2: Servir con Node.js (http-server)
```bash
npm install -g http-server
cd frontend
http-server -p 8000
```

### Opción 3: Desplegar a Cloudflare Pages (recomendado)

El dashboard puede desplegarse fácilmente a Cloudflare Pages:

1. Conecta tu repositorio GitHub a Cloudflare Pages
2. Configura el build (no necesita compilación)
3. Deployment automático en cada push

## Configuración

### Variables de entorno

Edita `frontend/config.js` para cambiar:

```javascript
const CONFIG = {
    API_URL: 'https://tu-backend.workers.dev',  // URL de tu backend
    REFRESH_INTERVAL: 5000,  // Intervalo de actualización (ms)
    MAX_ROWS: 100  // Máximo de eventos a mostrar
};
```

### API Key

1. Ingresa tu API Key en el campo superior
2. Haz clic en "Conectar"
3. El dashboard comenzará a sincronizarse automáticamente

Las credenciales se guardan en localStorage para sesiones futuras.

## Estructura

```
frontend/
├── index.html       # Estructura HTML
├── styles.css       # Estilos y responsivo
├── config.js        # Configuración
└── dashboard.js     # Lógica principal
```

## Dependencias

- [Leaflet](https://leafletjs.com/) - Mapas interactivos
- [Chart.js](https://www.chartjs.org/) - Gráficos
- [OpenStreetMap](https://www.openstreetmap.org/) - Tiles de mapa

Todas las dependencias se cargan desde CDN.

## Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile (responsive)

## Seguridad

- Las API Keys se almacenan en localStorage (no en servidor)
- HTTPS recomendado para producción
- Sin almacenamiento de datos sensibles en cliente

## Desarrollo

Para actualizar el dashboard:

1. Edita los archivos HTML/CSS/JS
2. Los cambios se reflejan automáticamente (F5 para refrescar)
3. Haz commit y push

Para agregar nuevas características:
- Filtros: Modifica `applyFilters()` en `dashboard.js`
- Gráficos: Actualiza `updateCharts()` en `dashboard.js`
- Estilos: Edita `styles.css`

## Troubleshooting

### "API Key inválida"
- Verifica que tu API Key sea correcta
- Comprueba que el role no esté revocado
- Reinicia el dashboard

### "Error de conexión"
- Verifica que el backend esté corriendo
- Comprueba la URL en `config.js`
- Revisa la consola del navegador (F12) para más detalles

### Mapa no carga
- Verifica conexión a internet
- Comprueba que los eventos tengan coordenadas (lat/lng)
- Recarga la página

## Licencia

MIT
