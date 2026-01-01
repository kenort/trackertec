// Variables globales
let currentApiKey = null;
let isConnected = false;
let refreshInterval = null;
let map = null;
let markers = {};
let eventos = [];
let filteredEventos = [];

// Charts
let tipoChart = null;
let horaChart = null;
let cuentasChart = null;

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const connectBtn = document.getElementById('connectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const eventosTableBody = document.getElementById('eventosTableBody');
const cuentaFilter = document.getElementById('cuentaFilter');
const tipoFilter = document.getElementById('tipoFilter');
const fechaDesdeFilter = document.getElementById('fechaDesdeFilter');
const fechaHastaFilter = document.getElementById('fechaHastaFilter');
const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
const limpiarFiltrosBtn = document.getElementById('limpiarFiltrosBtn');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    loadSavedApiKey();
});

// Inicializar mapa
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Setup Event Listeners
function setupEventListeners() {
    connectBtn.addEventListener('click', handleConnect);
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConnect();
    });
    aplicarFiltrosBtn.addEventListener('click', applyFilters);
    limpiarFiltrosBtn.addEventListener('click', clearFilters);
    cuentaFilter.addEventListener('input', updateTipoFilter);
}

// Cargar API Key guardada
function loadSavedApiKey() {
    const saved = localStorage.getItem('api_key');
    if (saved) {
        apiKeyInput.value = saved;
    }
}

// Conectar a la API
async function handleConnect() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert('Por favor ingresa una API Key');
        return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = 'Conectando...';

    try {
        // Probar conexión
        const response = await fetch(`${CONFIG.API_URL}/status`, {
            headers: { 'x-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        currentApiKey = apiKey;
        localStorage.setItem('api_key', apiKey);
        
        setConnected(true);
        startRefreshing();
        
    } catch (error) {
        alert(`Error de conexión: ${error.message}`);
        setConnected(false);
    } finally {
        connectBtn.disabled = false;
        connectBtn.textContent = 'Conectar';
    }
}

// Establecer estado de conexión
function setConnected(connected) {
    isConnected = connected;
    connectionStatus.classList.toggle('connected', connected);
    connectionStatus.classList.toggle('disconnected', !connected);
    connectionStatus.textContent = connected ? '✓ Conectado' : '✗ Desconectado';
    
    // Habilitar/deshabilitar controles
    apiKeyInput.disabled = connected;
    connectBtn.textContent = connected ? 'Desconectar' : 'Conectar';
    cuentaFilter.disabled = !connected;
    tipoFilter.disabled = !connected;
    fechaDesdeFilter.disabled = !connected;
    fechaHastaFilter.disabled = !connected;
    aplicarFiltrosBtn.disabled = !connected;
    limpiarFiltrosBtn.disabled = !connected;

    if (connected) {
        connectBtn.onclick = handleDisconnect;
    } else {
        connectBtn.onclick = handleConnect;
        if (refreshInterval) clearInterval(refreshInterval);
    }
}

// Desconectar
function handleDisconnect() {
    currentApiKey = null;
    localStorage.removeItem('api_key');
    setConnected(false);
    eventos = [];
    filteredEventos = [];
    eventosTableBody.innerHTML = '<tr class="placeholder"><td colspan="6">Conecta con tu API Key para ver eventos</td></tr>';
    clearMarkers();
}

// Iniciar actualización automática
function startRefreshing() {
    fetchEventos();
    refreshInterval = setInterval(fetchEventos, CONFIG.REFRESH_INTERVAL);
}

// Obtener eventos
async function fetchEventos() {
    if (!isConnected || !currentApiKey) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/eventos`, {
            headers: { 'x-api-key': currentApiKey }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                setConnected(false);
                alert('API Key inválida o expirada');
            }
            return;
        }

        const data = await response.json();
        eventos = data.data || [];
        filteredEventos = [...eventos];

        updateTable();
        updateStats();
        updateCharts();
        updateMap();
        updateEventTypes();

    } catch (error) {
        console.error('Error fetching eventos:', error);
    }
}

// Actualizar tabla de eventos
function updateTable() {
    if (filteredEventos.length === 0) {
        eventosTableBody.innerHTML = '<tr class="placeholder"><td colspan="6">No hay eventos</td></tr>';
        return;
    }

    const rows = filteredEventos.slice(0, CONFIG.MAX_ROWS).map(evento => {
        const fecha = new Date(evento.fecha_evento).toLocaleString('es-ES');
        const ubicacion = evento.lat && evento.lng ? 
            `${evento.lat.toFixed(4)}, ${evento.lng.toFixed(4)}` : 
            'N/A';
        
        const icon = CONFIG.EVENT_ICONS[evento.tipo] || '📌';
        
        return `
            <tr>
                <td>
                    <span class="event-type ${evento.tipo}">
                        ${icon} ${evento.tipo}
                    </span>
                </td>
                <td>${evento.cuenta_codigo}</td>
                <td>${evento.origen || '-'}</td>
                <td>${fecha}</td>
                <td>${ubicacion}</td>
                <td><span class="event-type ${evento.tipo}">Registrado</span></td>
            </tr>
        `;
    }).join('');

    eventosTableBody.innerHTML = rows;
}

// Actualizar estadísticas
function updateStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const totalEventos = eventos.length;
    const eventosHoy = eventos.filter(e => new Date(e.fecha_evento) >= today).length;
    const eventosUltimaHora = eventos.filter(e => new Date(e.fecha_evento) >= oneHourAgo).length;
    const ultimoEvento = eventos.length > 0 ? 
        new Date(eventos[0].fecha_evento).toLocaleTimeString('es-ES') : 
        '--:--';

    document.getElementById('totalEventos').textContent = totalEventos;
    document.getElementById('eventosHoy').textContent = eventosHoy;
    document.getElementById('eventosHora').textContent = eventosUltimaHora;
    document.getElementById('ultimoEvento').textContent = ultimoEvento;
}

// Actualizar mapa
function updateMap() {
    clearMarkers();

    const eventosConUbicacion = eventos.filter(e => e.lat && e.lng);
    
    if (eventosConUbicacion.length === 0) return;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    eventosConUbicacion.forEach(evento => {
        const key = `${evento.lat},${evento.lng}`;
        const icon = CONFIG.EVENT_ICONS[evento.tipo] || '📌';
        
        const marker = L.marker([evento.lat, evento.lng], {
            title: `${evento.tipo} - ${evento.cuenta_codigo}`
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-size: 12px;">
                <strong>${icon} ${evento.tipo}</strong><br>
                Cuenta: ${evento.cuenta_codigo}<br>
                Hora: ${new Date(evento.fecha_evento).toLocaleString('es-ES')}<br>
                ${evento.origen ? `Origen: ${evento.origen}<br>` : ''}
            </div>
        `);

        markers[key] = marker;

        minLat = Math.min(minLat, evento.lat);
        maxLat = Math.max(maxLat, evento.lat);
        minLng = Math.min(minLng, evento.lng);
        maxLng = Math.max(maxLng, evento.lng);
    });

    // Ajustar vista al mapa
    if (Object.keys(markers).length > 0) {
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);
    }
}

// Limpiar marcadores
function clearMarkers() {
    Object.values(markers).forEach(marker => marker.remove());
    markers = {};
}

// Actualizar gráficos
function updateCharts() {
    updateTipoChart();
    updateHoraChart();
    updateCuentasChart();
}

// Gráfico por tipo de evento
function updateTipoChart() {
    const tipos = {};
    eventos.forEach(e => {
        tipos[e.tipo] = (tipos[e.tipo] || 0) + 1;
    });

    const ctx = document.getElementById('tipoChart').getContext('2d');
    
    if (tipoChart) tipoChart.destroy();
    
    tipoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tipos),
            datasets: [{
                data: Object.values(tipos),
                backgroundColor: Object.keys(tipos).map(tipo => 
                    CONFIG.EVENT_COLORS[tipo] || '#6b7280'
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico por hora
function updateHoraChart() {
    const horas = {};
    
    eventos.forEach(e => {
        const hora = new Date(e.fecha_evento).getHours();
        const label = `${hora}:00`;
        horas[label] = (horas[label] || 0) + 1;
    });

    const labels = Object.keys(horas).sort();
    const data = labels.map(h => horas[h]);

    const ctx = document.getElementById('horaChart').getContext('2d');
    
    if (horaChart) horaChart.destroy();
    
    horaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Eventos',
                data,
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Gráfico de top cuentas
function updateCuentasChart() {
    const cuentas = {};
    
    eventos.forEach(e => {
        cuentas[e.cuenta_codigo] = (cuentas[e.cuenta_codigo] || 0) + 1;
    });

    const sorted = Object.entries(cuentas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('cuentasChart').getContext('2d');
    
    if (cuentasChart) cuentasChart.destroy();
    
    cuentasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(c => c[0]),
            datasets: [{
                label: 'Eventos',
                data: sorted.map(c => c[1]),
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Actualizar tipos de eventos en el filtro
function updateEventTypes() {
    const tipos = [...new Set(eventos.map(e => e.tipo))];
    const currentValue = tipoFilter.value;
    
    // Limpiar opciones anteriores (excepto la primera)
    while (tipoFilter.options.length > 1) {
        tipoFilter.remove(1);
    }
    
    // Agregar nuevas opciones
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        tipoFilter.appendChild(option);
    });
    
    tipoFilter.value = currentValue;
}

// Aplicar filtros
function applyFilters() {
    filteredEventos = eventos.filter(evento => {
        const cuenta = cuentaFilter.value.toLowerCase();
        const tipo = tipoFilter.value;
        const desde = fechaDesdeFilter.value ? new Date(fechaDesdeFilter.value) : null;
        const hasta = fechaHastaFilter.value ? new Date(fechaHastaFilter.value) : null;
        const eventoFecha = new Date(evento.fecha_evento);

        if (cuenta && !evento.cuenta_codigo.toLowerCase().includes(cuenta)) {
            return false;
        }
        if (tipo && evento.tipo !== tipo) {
            return false;
        }
        if (desde && eventoFecha < desde) {
            return false;
        }
        if (hasta && eventoFecha > hasta) {
            return false;
        }

        return true;
    });

    updateTable();
    updateStats();
    updateCharts();
    updateMap();
}

// Limpiar filtros
function clearFilters() {
    cuentaFilter.value = '';
    tipoFilter.value = '';
    fechaDesdeFilter.value = '';
    fechaHastaFilter.value = '';
    
    filteredEventos = [...eventos];
    updateTable();
    updateStats();
    updateCharts();
    updateMap();
}
