#!/bin/bash

# Script para probar la creación de una API_KEY
# Asegúrate de que wrangler dev está ejecutándose en otro terminal

API_URL="http://localhost:8787"
ADMIN_KEY="admin_super_secreta_456"

echo "🔑 Creando una nueva API_KEY..."
echo ""

curl -X POST "$API_URL/admin/api-keys" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{
    "cuenta_codigo": "CUENTA_001",
    "nombre": "API Key de prueba"
  }' | jq .

echo ""
echo "✅ Prueba completada"
