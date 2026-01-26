#!/bin/bash
# Script ejecutado al iniciar la aplicación

cd /var/app/current

# El servicio PM2 o systemd se encargará de iniciar la aplicación
# Este script puede usarse para tareas adicionales si es necesario

# Reiniciar aplicación si está corriendo
if [ -f /etc/systemd/system/nodejs.service ]; then
    systemctl restart nodejs
fi

