# Agilent Native Suite — One-Liner Instant Installer for Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    ⚡ AGILENT NATIVE SUITE — INSTANT INSTALLER (Windows) ⚡" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# Check Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Error "Python 3.10+ is required but not found in PATH."
    exit 1
}

$InstallDir = "$HOME\.agilent-native"

if (Test-Path $InstallDir) {
    Write-Host "🔄 Updating existing installation in $InstallDir..." -ForegroundColor Yellow
    Set-Location $InstallDir
    git pull origin main
} else {
    Write-Host "📥 Cloning Agilent Native Suite into $InstallDir..." -ForegroundColor Green
    git clone https://github.com/PeterRDev3l0per/rgf-agilent-native.git $InstallDir
    Set-Location $InstallDir
}

if (-not (Test-Path ".venv")) {
    Write-Host "⚙️ Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

& "$InstallDir\.venv\Scripts\python.exe" -m pip install --upgrade pip
& "$InstallDir\.venv\Scripts\python.exe" -m pip install -e .[dev]

Write-Host "✓ Installation complete! Running Agilent Setup Wizard..." -ForegroundColor Green
& "$InstallDir\.venv\Scripts\python.exe" scripts/setup.py --non-interactive
