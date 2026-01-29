# Script para resolver errores de Cursor "Failed to read file"
# Ejecutar como Administrador si es necesario

Write-Host "=== SOLUCIONANDO ERROR DE CURSOR ===" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Cerrar TODOS los procesos de Cursor
Write-Host "1. Cerrando todos los procesos de Cursor..." -ForegroundColor Yellow
$cursorProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like '*cursor*' -or 
    $_.ProcessName -like '*Cursor*' 
}

if ($cursorProcesses) {
    $cursorProcesses | ForEach-Object {
        Write-Host "   Cerrando proceso: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Procesos cerrados" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay procesos de Cursor ejecutándose" -ForegroundColor Green
}

# Paso 2: Limpiar caché de Cursor
Write-Host "`n2. Limpiando caché de Cursor..." -ForegroundColor Yellow
$cachePath = "$env:APPDATA\Cursor\Cache"
if (Test-Path $cachePath) {
    try {
        Remove-Item -Path "$cachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Caché limpiado: $cachePath" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Error al limpiar caché: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Caché no encontrado" -ForegroundColor Yellow
}

# Paso 3: Limpiar workspace storage (solo el workspace actual si es necesario)
Write-Host "`n3. Verificando workspace storage..." -ForegroundColor Yellow
$workspaceStorage = "$env:APPDATA\Cursor\User\workspaceStorage"
if (Test-Path $workspaceStorage) {
    $workspaces = Get-ChildItem $workspaceStorage -Directory -ErrorAction SilentlyContinue
    Write-Host "   Encontrados $($workspaces.Count) workspaces" -ForegroundColor Gray
    
    # Buscar workspace del proyecto actual
    $currentWorkspace = $workspaces | Where-Object {
        $_.GetFiles("workspace.json", "Recurse") | ForEach-Object {
            $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -match "alcancereducido") { $true }
        }
    }
    
    if ($currentWorkspace) {
        Write-Host "   ⚠️  Workspace actual encontrado. Puede contener referencias a archivos antiguos." -ForegroundColor Yellow
        Write-Host "   💡 Si el problema persiste, puedes eliminar manualmente:" -ForegroundColor Cyan
        Write-Host "      $($currentWorkspace.FullName)" -ForegroundColor Gray
    }
}

# Paso 4: Verificar OneDrive
Write-Host "`n4. Verificando sincronización de OneDrive..." -ForegroundColor Yellow
$workspacePath = "C:\Users\thena\OneDrive\Documentos\alcancereducido"
if (Test-Path $workspacePath) {
    $item = Get-Item $workspacePath
    if ($item.Attributes -match "ReparsePoint") {
        Write-Host "   ⚠️  La carpeta puede estar en modo 'online-only' de OneDrive" -ForegroundColor Yellow
        Write-Host "   💡 Asegúrate de que los archivos estén sincronizados localmente" -ForegroundColor Cyan
    } else {
        Write-Host "   ✅ Carpeta disponible localmente" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Carpeta no encontrada" -ForegroundColor Red
}

# Paso 5: Limpiar logs de Cursor
Write-Host "`n5. Limpiando logs de Cursor..." -ForegroundColor Yellow
$logPaths = @(
    "$env:APPDATA\Cursor\logs",
    "$env:LOCALAPPDATA\Cursor\logs"
)

foreach ($logPath in $logPaths) {
    if (Test-Path $logPath) {
        try {
            Remove-Item -Path "$logPath\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Logs limpiados: $logPath" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  No se pudieron limpiar logs: $logPath" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== COMPLETADO ===" -ForegroundColor Cyan
Write-Host "`nAhora puedes:" -ForegroundColor Yellow
Write-Host "1. Reiniciar Cursor" -ForegroundColor White
Write-Host "2. Abrir SOLO el proyecto alcancereducido" -ForegroundColor White
Write-Host "3. Si el problema persiste, considera:" -ForegroundColor White
Write-Host "   - Reinstalar Cursor" -ForegroundColor Gray
Write-Host "   - Verificar que OneDrive esté completamente sincronizado" -ForegroundColor Gray
Write-Host "   - Mover el proyecto fuera de OneDrive temporalmente para probar" -ForegroundColor Gray
Write-Host ""



