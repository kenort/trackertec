#!/bin/bash

# Script de pruebas para la API MQTT Backend
# Uso: ./test-api.sh [base_url] [api_key]

BASE_URL="${1:-http://localhost:8787}"
API_KEY="${2:-tu_api_key}"

echo "🧪 Iniciando pruebas del API..."
echo "URL Base: $BASE_URL"
echo "API Key: ${API_KEY:0:10}..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para probar un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}→ $description${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method \
            -H "x-api-key: $API_KEY" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X $method \
            -H "x-api-key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if echo "$response" | grep -q "error"; then
        echo -e "${RED}✗ Error${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${GREEN}✓ OK${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
    echo ""
}

# 1. Health Check
test_endpoint "GET" "/status" "" "1. Health Check"

# 2. Crear evento
test_endpoint "POST" "/eventos" \
    '{
        "tipo": "movimiento",
        "cuenta_codigo": "TEST001",
        "origen": "test_script",
        "lat": 40.7128,
        "lng": -74.0060,
        "payload": {"velocidad": 100}
    }' \
    "2. Crear Evento"

# 3. Listar eventos
test_endpoint "GET" "/eventos?limit=5" "" "3. Listar Eventos"

# 4. Listar eventos con filtro
test_endpoint "GET" "/eventos?cuenta=TEST001" "" "4. Listar Eventos (filtrado por cuenta)"

# 5. Obtener notificaciones
test_endpoint "GET" "/notificaciones?limite=5" "" "5. Obtener Notificaciones"

# 6. Contador de notificaciones no leídas
test_endpoint "GET" "/notificaciones/contador" "" "6. Contador de No Leídas"

# 7. Resumen por tipo de evento
test_endpoint "GET" "/analytics/resumen-por-tipo?dias=7" "" "7. Analytics - Resumen por Tipo"

# 8. Serie temporal
test_endpoint "GET" "/analytics/serie-temporal?dias=7" "" "8. Analytics - Serie Temporal"

# 9. Estadísticas
test_endpoint "GET" "/analytics/estadisticas?dias=7" "" "9. Analytics - Estadísticas Generales"

# 10. Crear evento adicional (diferente tipo)
test_endpoint "POST" "/eventos" \
    '{
        "tipo": "parada",
        "cuenta_codigo": "TEST001",
        "origen": "test_script",
        "lat": 40.7129,
        "lng": -74.0061
    }' \
    "10. Crear Evento (tipo parada)"

# 11. Listar todos los eventos
test_endpoint "GET" "/eventos" "" "11. Listar Todos los Eventos"

# 12. Resumen actualizado
test_endpoint "GET" "/analytics/resumen-por-tipo?dias=1" "" "12. Analytics - Resumen Actualizado"

echo -e "${GREEN}✓ Pruebas completadas${NC}"
