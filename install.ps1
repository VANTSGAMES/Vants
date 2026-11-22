# Instalador oficial de Banter Desktop para Windows (1 línea en PowerShell):
#   irm https://raw.githubusercontent.com/VANTSGAMES/banter/main/install.ps1 | iex
$ErrorActionPreference = "Stop"

Write-Host "=== Instalando Banter Desktop (VANTS GAMES) ===" -ForegroundColor Cyan
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/VANTSGAMES/banter/releases/latest" -Headers @{ "User-Agent" = "Banter-Installer" }
$asset = $release.assets | Where-Object { $_.name -like "Banter-Setup-*.exe" } | Select-Object -First 1

if (-not $asset) {
  throw "Aún no hay un Banter-Setup-*.exe publicado en GitHub Releases. Crea un tag v1.0.0 o ejecuta el workflow Release Windows."
}

$tmp = Join-Path $env:TEMP $asset.name
Write-Host "Descargando $($asset.name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp
Write-Host "Ejecutando instalador..."
Start-Process -FilePath $tmp -ArgumentList "/S" -Wait
Write-Host "Listo. Banter Desktop instalado." -ForegroundColor Green
