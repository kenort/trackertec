// Configuración del Dashboard
const CONFIG = {
    // Cambiar esto según tu entorno
    API_URL: localStorage.getItem('api_url') || 'http://localhost:8787',
    
    // Colores por tipo de evento
    EVENT_COLORS: {
        movimiento: '#3b82f6',
        parada: '#f59e0b',
        alarma: '#ef4444',
        conexion: '#10b981',
        desconexion: '#6366f1',
        bateria: '#f97316',
        otro: '#6b7280'
    },

    // Iconos por tipo de evento
    EVENT_ICONS: {
        movimiento: '🚗',
        parada: '🛑',
        alarma: '🚨',
        conexion: '📡',
        desconexion: '⚠️',
        bateria: '🔋',
        otro: '📌'
    },

    // Límites de actualización
    REFRESH_INTERVAL: 5000, // 5 segundos
    MAX_ROWS: 100, // Máximo de eventos a mostrar
};

// Guardar API URL si cambia
function setApiUrl(url) {
    CONFIG.API_URL = url;
    localStorage.setItem('api_url', url);
}
