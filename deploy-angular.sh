#!/bin/bash

# Configuración
SERVER_IP="3.130.97.174"
SERVER_USER="ubuntu"
KEY_PATH="./pagotic.pem"  # Ajusta el nombre de tu archivo .pem real
PROJECT_NAME="junto-tic-frontend"

echo "🚀 Iniciando despliegue de Angular a AWS..."

# Verificar que estamos en el directorio correcto
if [ ! -f "angular.json" ]; then
    echo "❌ Error: No se encontró angular.json. Ejecuta este script desde la raíz del proyecto Angular."
    exit 1
fi

# Verificar que existe la clave SSH
if [ ! -f "${KEY_PATH}" ]; then
    echo "❌ Error: No se encontró el archivo de clave SSH en ${KEY_PATH}"
    echo "💡 Asegúrate de que tu archivo .pem esté en la carpeta del proyecto."
    exit 1
fi

# Configurar permisos de la clave
chmod 400 "${KEY_PATH}"

# Paso 1: Build de producción local
echo "📦 Creando build de producción..."
ng build --configuration production

if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Abortando."
    exit 1
fi

# Paso 2: Crear archivo comprimido con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="junto-tic-frontend_${TIMESTAMP}.tar.gz"

echo "🗜️ Comprimiendo archivos..."
cd dist
tar -czf "../${ARCHIVE_NAME}" junto-tic-frontend/
cd ..

echo "📦 Archivo creado: ${ARCHIVE_NAME}"

# Paso 3: Subir archivo al servidor (con las opciones SSH que funcionaron)
echo "☁️ Subiendo archivo al servidor AWS..."
scp -i "${KEY_PATH}" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "${ARCHIVE_NAME}" "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivo. Verifica conexión SSH."
    exit 1
fi

echo "✅ Archivo subido exitosamente"

# Paso 4: Desplegar en el servidor
echo "🔧 Desplegando en servidor..."
ssh -i "${KEY_PATH}" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "${SERVER_USER}@${SERVER_IP}" << EOF
    echo "📂 Extrayendo archivos..."
    cd /home/ubuntu
    tar -xzf "${ARCHIVE_NAME}"
    
    echo "🗂️ Creando backup de la versión anterior..."
    sudo mkdir -p /var/www/html/backups
    if [ -d "/var/www/html/junto-tic-frontend" ]; then
        sudo mv /var/www/html/junto-tic-frontend /var/www/html/backups/junto-tic-frontend_backup_${TIMESTAMP}
        echo "✅ Backup creado: junto-tic-frontend_backup_${TIMESTAMP}"
    fi
    
    echo "📁 Creando directorio web..."
    sudo mkdir -p /var/www/html/junto-tic-frontend
    
    echo "📁 Moviendo nueva versión..."
    sudo cp -r junto-tic-frontend/* /var/www/html/junto-tic-frontend/
    
    echo "🔐 Configurando permisos..."
    sudo chown -R www-data:www-data /var/www/html/junto-tic-frontend
    sudo chmod -R 755 /var/www/html/junto-tic-frontend
    
    echo "🔍 Verificando archivos copiados..."
    ls -la /var/www/html/junto-tic-frontend/
    
    echo "🔄 Verificando configuración de Nginx..."
    sudo nginx -t
    
    if [ \$? -eq 0 ]; then
        echo "✅ Configuración de Nginx válida"
        echo "🔄 Recargando Nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx recargado"
    else
        echo "❌ Error en configuración de Nginx"
        exit 1
    fi
    
    echo "🧹 Limpiando archivos temporales..."
    rm -f "${ARCHIVE_NAME}"
    rm -rf junto-tic-frontend/
    
    echo "✅ ¡Despliegue completado exitosamente!"
EOF

# Verificar que el comando SSH fue exitoso
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡DESPLIEGUE COMPLETADO!"
    echo "🌐 Tu aplicación Angular está disponible en: http://${SERVER_IP}"
    echo "📊 Para ver logs de acceso: ssh -i ${KEY_PATH} -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'sudo tail -f /var/log/nginx/marketplace_access.log'"
    echo "📊 Para ver logs de error: ssh -i ${KEY_PATH} -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'sudo tail -f /var/log/nginx/marketplace_error.log'"
else
    echo "❌ Error durante el despliegue en el servidor"
    exit 1
fi

# Paso 5: Limpiar archivo local
rm "${ARCHIVE_NAME}"
echo "🧹 Archivo temporal local eliminado"