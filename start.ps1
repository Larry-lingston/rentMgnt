<#
.SYNOPSIS
    One-command launcher for the Rent Manager app (backend API + Expo mobile app).

.DESCRIPTION
    Checks prerequisites, installs dependencies, prepares the SQLite database,
    points the mobile app at this machine's LAN IP, then starts both servers.

.EXAMPLE
    .\start.ps1
    .\start.ps1 -Reseed
    .\start.ps1 -ApiHost 192.168.1.50
    .\start.ps1 -Reinstall
#>

[CmdletBinding()]
param(
    # Use this IP instead of auto-detecting the LAN address.
    [string]$ApiHost,
    # Delete node_modules and install dependencies from scratch.
    [switch]$Reinstall,
    # Recreate and re-seed the database with demo data (wipes existing data).
    [switch]$Reseed,
    # Leave app/constants/theme.js untouched.
    [switch]$SkipIpUpdate,
    # Prepare everything but don't start the servers.
    [switch]$SetupOnly
)

$ErrorActionPreference = 'Stop'

$Root        = $PSScriptRoot
$BackendDir  = Join-Path $Root 'backend'
$AppDir      = Join-Path $Root 'app'
$DbFile      = Join-Path $BackendDir 'prisma\dev.db'
$ThemeFile   = Join-Path $AppDir 'constants\theme.js'

function Write-Step  ($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Write-Ok    ($m) { Write-Host "    $m" -ForegroundColor Green }
function Write-Info  ($m) { Write-Host "    $m" -ForegroundColor Gray }
function Write-Warn  ($m) { Write-Host "    $m" -ForegroundColor Yellow }

function Stop-WithError ($m) {
    Write-Host "`nERROR: $m`n" -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}

function Invoke-Npm ($Arguments, $WorkingDirectory) {
    Push-Location $WorkingDirectory
    try {
        & npm.cmd @Arguments
        if ($LASTEXITCODE -ne 0) {
            Stop-WithError "'npm $($Arguments -join ' ')' failed in $WorkingDirectory (exit code $LASTEXITCODE)."
        }
    } finally {
        Pop-Location
    }
}

function Get-LanIPAddress {
    # VPN and virtual adapters also have gateways, so exclude them by name.
    $excluded = 'Loopback|vEthernet|Virtual|VMware|VirtualBox|WSL|Hyper-V|Radmin|VPN|TAP|Tailscale|ZeroTier|Bluetooth'

    $addresses = @(
        Get-NetIPConfiguration -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPv4DefaultGateway -and
                $_.NetAdapter.Status -eq 'Up' -and
                $_.InterfaceAlias -notmatch $excluded
            } |
            ForEach-Object { $_.IPv4Address.IPAddress }
    ) | Where-Object { $_ }

    if (-not $addresses) {
        $addresses = @(
            Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
                Where-Object {
                    $_.IPAddress -notlike '127.*' -and
                    $_.IPAddress -notlike '169.254.*' -and
                    $_.InterfaceAlias -notmatch $excluded
                } |
                ForEach-Object { $_.IPAddress }
        )
    }

    # A phone on the same Wi-Fi will be on a private range, so prefer those.
    $private = $addresses | Where-Object { $_ -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)' } | Select-Object -First 1
    if ($private) { return $private }

    return $addresses | Select-Object -First 1
}

function Set-DevHost ($IPAddress) {
    $content = Get-Content -Path $ThemeFile -Raw
    $updated = [regex]::Replace(
        $content,
        "(?m)^const DEV_HOST = '.*';",
        "const DEV_HOST = '$IPAddress';"
    )
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($ThemeFile, $updated, (New-Object System.Text.UTF8Encoding($false)))
        return $true
    }
    return $false
}

function Wait-ForBackend ($Url, $TimeoutSeconds = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            return $true
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

function Test-PortInUse ($Port) {
    [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-ForPort ($Port, $TimeoutSeconds = 180) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($listening) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host ''
Write-Host '  Rent Manager - full stack launcher' -ForegroundColor White
Write-Host '  ----------------------------------' -ForegroundColor DarkGray

# --- 1. Prerequisites -------------------------------------------------------
Write-Step 'Checking prerequisites'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Stop-WithError 'Node.js is not installed or not on PATH. Install Node.js 18 or newer from https://nodejs.org and run this script again.'
}

$nodeVersion = (node --version).TrimStart('v')
$nodeMajor   = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 18) {
    Stop-WithError "Node.js $nodeVersion found, but version 18 or newer is required."
}
Write-Ok "Node.js v$nodeVersion"

if (-not (Test-Path $BackendDir) -or -not (Test-Path $AppDir)) {
    Stop-WithError "Expected 'backend' and 'app' folders next to this script. Run it from inside the project folder."
}

# --- 2. Dependencies --------------------------------------------------------
Write-Step 'Installing dependencies'

foreach ($target in @(@{ Name = 'backend'; Path = $BackendDir }, @{ Name = 'mobile app'; Path = $AppDir })) {
    $modules = Join-Path $target.Path 'node_modules'

    if ($Reinstall -and (Test-Path $modules)) {
        Write-Info "Removing existing $($target.Name) node_modules..."
        Remove-Item $modules -Recurse -Force
    }

    if (Test-Path $modules) {
        Write-Ok "$($target.Name) dependencies already installed (use -Reinstall to redo)"
    } else {
        Write-Info "Installing $($target.Name) dependencies, this can take a few minutes..."
        Invoke-Npm @('install') $target.Path
        Write-Ok "$($target.Name) dependencies installed"
        if ($target.Name -eq 'backend') { $script:FreshBackend = $true }
    }
}

# --- 3. Database ------------------------------------------------------------
Write-Step 'Preparing database'

$dbMissing = -not (Test-Path $DbFile)

if ($Reseed -and -not $dbMissing) {
    Write-Info 'Removing existing database (-Reseed)...'
    Remove-Item $DbFile -Force
    $dbMissing = $true
}

if ($dbMissing -or $FreshBackend) {
    Invoke-Npm @('run', 'db:generate') $BackendDir
    Invoke-Npm @('run', 'db:push')     $BackendDir
    Write-Ok 'Prisma client generated and schema applied'
}

if ($dbMissing) {
    Write-Info 'Seeding demo data...'
    Invoke-Npm @('run', 'db:seed') $BackendDir
    Write-Ok 'Demo data seeded'
} else {
    Write-Ok 'Existing database kept (use -Reseed to start fresh)'
}

# --- 4. Network address -----------------------------------------------------
Write-Step 'Configuring API address'

$lanIp = if ($ApiHost) { $ApiHost } else { Get-LanIPAddress }

if (-not $lanIp) {
    Write-Warn 'Could not detect a LAN IP. Physical devices may not reach the API.'
    Write-Warn 'Re-run with: .\start.ps1 -ApiHost <your-ip>'
    $lanIp = 'localhost'
} elseif ($SkipIpUpdate) {
    Write-Ok "Detected $lanIp (theme.js left unchanged)"
} elseif (Set-DevHost $lanIp) {
    Write-Ok "app/constants/theme.js updated to use $lanIp"
} else {
    Write-Ok "app/constants/theme.js already set to $lanIp"
}

if ($SetupOnly) {
    Write-Step 'Setup complete'
    Write-Info 'Run this script again without -SetupOnly to start the servers.'
    exit 0
}

# --- 5. Start the servers ---------------------------------------------------
Write-Step 'Starting backend API'

if (Test-PortInUse 3000) {
    Write-Ok 'Port 3000 is already serving the API, leaving it running'
} else {
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoExit', '-NoProfile', '-Command',
        "Set-Location '$BackendDir'; `$Host.UI.RawUI.WindowTitle = 'Rent Manager - Backend API'; npm run dev"
    ) | Out-Null

    if (Wait-ForBackend 'http://localhost:3000/api/health') {
        Write-Ok 'API is live on http://localhost:3000'
    } else {
        Write-Warn 'API did not respond within 60s. Check the backend window for errors.'
    }
}

Write-Step 'Starting Expo dev server'

if (Test-PortInUse 8081) {
    Write-Ok 'Port 8081 is already running Expo, leaving it running'
} else {
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoExit', '-NoProfile', '-Command',
        "Set-Location '$AppDir'; `$Host.UI.RawUI.WindowTitle = 'Rent Manager - Expo'; npm start"
    ) | Out-Null

    Write-Info 'Metro bundler can take a minute on first launch...'

    if (Wait-ForPort 8081) {
        Write-Ok 'Expo dev server ready, QR code is in the Expo window'
    } else {
        Write-Warn 'Expo has not opened port 8081 yet. Check the Expo window.'
    }
}

# --- 6. Summary -------------------------------------------------------------
Write-Host ''
Write-Host '  Everything is running' -ForegroundColor White
Write-Host '  ---------------------' -ForegroundColor DarkGray
Write-Host "  API           http://${lanIp}:3000/api" -ForegroundColor Gray
Write-Host "  Expo QR code  the Expo window (exp://${lanIp}:8081)" -ForegroundColor Gray
Write-Host ''
Write-Host '  On your phone: install Expo Go, connect to the SAME Wi-Fi,' -ForegroundColor Gray
Write-Host '  then scan the QR code shown in the Expo window.' -ForegroundColor Gray
Write-Host ''
Write-Host '  Demo logins   admin / admin123      (landlord)' -ForegroundColor Gray
Write-Host '                tenant1 / tenant123   (tenant)' -ForegroundColor Gray
Write-Host ''
Write-Host '  If the phone cannot reach the API, allow Node.js through' -ForegroundColor DarkGray
Write-Host '  Windows Firewall on private networks.' -ForegroundColor DarkGray
Write-Host ''
Write-Host '  Close the two server windows to stop everything.' -ForegroundColor DarkGray
Write-Host ''
