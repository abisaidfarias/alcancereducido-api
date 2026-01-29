# Script para limpiar el caché de Cursor y resolver errores de "Failed to read file"
# Ejecuta este script DESPUES de cerrar todas las ventanas de Cursor

Write-Host "=== LIMPIANDO CACHE DE CURSOR ===" -ForegroundColor Cyan
Write-Host ""

# 1. Cerrar todos los procesos de Cursor
Write-Host "1. Cerrando procesos de Cursor..." -ForegroundColor Yellow
$cursorProcesses = Get-Process | Where-Object {$_.ProcessName -like '*cursor*'}
if ($cursorProcesses) {
    $cursorProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Procesos de Cursor cerrados" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay procesos de Cursor ejecutándose" -ForegroundColor Green
}

# 2. Limpiar caché
Write-Host ""
Write-Host "2. Limpiando caché..." -ForegroundColor Yellow
$cachePath = "$env:APPDATA\Cursor\Cache"
if (Test-Path $cachePath) {
    try {
        Remove-Item -Path "$cachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Caché limpiado: $cachePath" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Error al limpiar caché: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Carpeta de caché no encontrada" -ForegroundColor Yellow
}

# 3. Limpiar también el caché de Code (si existe, ya que Cursor está basado en VS Code)
Write-Host ""
Write-Host "3. Limpiando caché adicional..." -ForegroundColor Yellow
$codeCachePath = "$env:APPDATA\Cursor\CachedData"
if (Test-Path $codeCachePath) {
    try {
        Remove-Item -Path "$codeCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Caché adicional limpiado" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Error al limpiar caché adicional: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host "Ahora puedes reiniciar Cursor" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

