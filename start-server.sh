#!/bin/bash

# Script para iniciar el servidor sin salida en la terminal
cd /Users/kortiz/Downloads/trackerTec/proyectos/mqtt-backend
wrangler dev > /tmp/wrangler.log 2>&1 &
echo $! > /tmp/wrangler.pid
echo "Servidor iniciado con PID: $(cat /tmp/wrangler.pid)"
