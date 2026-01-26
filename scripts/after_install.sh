#!/bin/bash
# Script ejecutado después de instalar la aplicación

cd /var/app/current

# Instalar dependencias de producción
npm install --production

# Crear directorio de logs si no existe
mkdir -p /var/app/current/logs

# Establecer permisos
chown -R webapp:webapp /var/app/current



