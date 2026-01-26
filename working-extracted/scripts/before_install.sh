#!/bin/bash
# Script ejecutado antes de instalar la aplicación

# Actualizar sistema
yum update -y

# Instalar Node.js 18.x si no está instalado
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

# Verificar instalación
node --version
npm --version

