<#
.SYNOPSIS
    Stops the Rent Manager servers by freeing the API (3000) and Expo (8081) ports.
#>

$ErrorActionPreference = 'SilentlyContinue'

foreach ($port in 3000, 8081) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen |
        Select-Object -ExpandProperty OwningProcess -Unique

    if (-not $pids) {
        Write-Host "Port $port is already free." -ForegroundColor Gray
        continue
    }

    foreach ($procId in $pids) {
        $name = (Get-Process -Id $procId).ProcessName
        Stop-Process -Id $procId -Force
        Write-Host "Stopped $name (PID $procId) on port $port." -ForegroundColor Green
    }
}
