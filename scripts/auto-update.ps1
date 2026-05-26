param(
    [int] $IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$updateScript = Join-Path $PSScriptRoot "update-from-git.ps1"
$ensureEnvScript = Join-Path $PSScriptRoot "ensure-env.ps1"

Set-Location $repoRoot

function Invoke-Step {
    param(
        [string] $Name,
        [scriptblock] $Command
    )

    Write-Host ""
    Write-Host $Name
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name fallo con codigo $LASTEXITCODE."
    }
}

function Write-HostIp {
    $hostIp = "127.0.0.1"
    foreach ($ip in Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue) {
        if (
            $ip.IPAddress -notlike "127.*" -and
            $ip.IPAddress -notlike "169.254.*" -and
            $ip.InterfaceOperationalStatus -eq "Up"
        ) {
            $hostIp = $ip.IPAddress
            break
        }
    }

    $envPath = Join-Path $repoRoot ".env"
    $lines = @()
    if (Test-Path $envPath) {
        $lines = @(Get-Content $envPath)
    }

    if ($lines -match "^HOST_IP=") {
        $lines = @($lines | ForEach-Object {
            if ($_ -match "^HOST_IP=") {
                "HOST_IP=$hostIp"
            } else {
                $_
            }
        })
    } else {
        if ($lines.Count -gt 0 -and $lines[-1] -ne "") {
            $lines += ""
        }
        $lines += "HOST_IP=$hostIp"
    }

    Set-Content -Path $envPath -Value $lines -Encoding UTF8
}

function Invoke-Rebuild {
    Invoke-Step "Preparando .env" {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $ensureEnvScript
    }

    Write-HostIp

    Invoke-Step "Chequeando Docker" {
        & docker info *> $null
    }

    Invoke-Step "Deteniendo servicios" {
        & docker compose down --remove-orphans
    }

    Invoke-Step "Reconstruyendo frontend y backend" {
        & docker compose build --no-cache frontend backend
    }

    Invoke-Step "Iniciando servicios" {
        & docker compose up -d --force-recreate
    }
}

Write-Host "Auto-update activo. Revisando Git cada $IntervalSeconds segundos."
Write-Host "Presiona Ctrl+C para detenerlo."

while ($true) {
    Write-Host ""
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Buscando cambios..."

    & powershell -NoProfile -ExecutionPolicy Bypass -File $updateScript
    $updateExitCode = $LASTEXITCODE

    if ($updateExitCode -eq 0) {
        try {
            Invoke-Rebuild
            Write-Host "Actualizacion aplicada correctamente."
        } catch {
            Write-Host "No se pudo reconstruir despues del pull."
            Write-Host $_.Exception.Message
        }
    } elseif ($updateExitCode -eq 2) {
        Write-Host "Sin cambios nuevos."
    } else {
        Write-Host "No se pudo revisar o actualizar Git. Se intentara de nuevo luego."
    }

    Start-Sleep -Seconds $IntervalSeconds
}
