$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"
$examplePath = Join-Path $repoRoot ".env.example"
$backendEnvPath = Join-Path $repoRoot "backend\.env"

function Get-EnvValue {
    param(
        [string] $Path,
        [string] $Key
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $pattern = "^\s*$([regex]::Escape($Key))=(.*)$"
    foreach ($line in Get-Content -Path $Path) {
        if ($line -match $pattern) {
            return $Matches[1]
        }
    }

    return $null
}

function Set-EnvValue {
    param(
        [string] $Path,
        [string] $Key,
        [string] $Value
    )

    $lines = @()
    if (Test-Path $Path) {
        $lines = @(Get-Content -Path $Path)
    } else {
        $parent = Split-Path -Parent $Path
        if ($parent -and -not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent | Out-Null
        }
    }

    $pattern = "^\s*$([regex]::Escape($Key))="
    $line = "$Key=$Value"
    $found = $false

    $lines = @($lines | ForEach-Object {
        if ($_ -match $pattern) {
            $found = $true
            $line
        } else {
            $_
        }
    })

    if (-not $found) {
        if ($lines.Count -gt 0 -and $lines[-1] -ne "") {
            $lines += ""
        }
        $lines += $line
    }

    Set-Content -Path $Path -Value $lines -Encoding UTF8
}

function Test-MissingOrPlaceholder {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $true
    }

    $normalized = $Value.Trim().ToLowerInvariant()
    return @(
        "change-me-in-production",
        "cambiame-en-produccion",
        "eyjhijoi..."
    ) -contains $normalized
}

function New-JwtSecret {
    $bytes = New-Object byte[] 64
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $examplePath)) {
        Write-Error "No se encontro .env.example para crear .env."
        exit 1
    }

    Copy-Item $examplePath $envPath
    Write-Host "Se creo .env desde .env.example."
}

if (Test-Path $examplePath) {
    foreach ($line in Get-Content -Path $examplePath) {
        if ($line -notmatch "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
            continue
        }

        $key = $Matches[1]
        $value = $Matches[2]
        if ($null -eq (Get-EnvValue -Path $envPath -Key $key)) {
            Set-EnvValue -Path $envPath -Key $key -Value $value
            Write-Host "Se agrego $key a .env."
        }
    }
}

$jwtSecret = Get-EnvValue -Path $envPath -Key "JWT_SECRET"
if (Test-MissingOrPlaceholder $jwtSecret) {
    $jwtSecret = New-JwtSecret
    Set-EnvValue -Path $envPath -Key "JWT_SECRET" -Value $jwtSecret
    Write-Host "Se genero un JWT_SECRET nuevo para .env."
}

$backendJwtSecret = Get-EnvValue -Path $backendEnvPath -Key "JWT_SECRET"
if ((Test-MissingOrPlaceholder $backendJwtSecret) -or $backendJwtSecret -ne $jwtSecret) {
    Set-EnvValue -Path $backendEnvPath -Key "JWT_SECRET" -Value $jwtSecret
    Write-Host "Se sincronizo JWT_SECRET en backend\.env."
}

$cloudflareToken = Get-EnvValue -Path $envPath -Key "CLOUDFLARE_TUNNEL_TOKEN"
if (Test-MissingOrPlaceholder $cloudflareToken) {
    Write-Host ""
    $newToken = Read-Host "Pega el CLOUDFLARE_TUNNEL_TOKEN o presiona Enter para configurarlo luego"
    if (-not [string]::IsNullOrWhiteSpace($newToken)) {
        Set-EnvValue -Path $envPath -Key "CLOUDFLARE_TUNNEL_TOKEN" -Value $newToken.Trim()
        Write-Host "Se guardo CLOUDFLARE_TUNNEL_TOKEN en .env."
    } else {
        Write-Host "CLOUDFLARE_TUNNEL_TOKEN quedo vacio. Podras completarlo antes de iniciar el tunel."
    }
}
