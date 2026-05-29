$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"

function Set-EnvValue {
    param(
        [string] $Path,
        [string] $Key,
        [string] $Value
    )

    $lines = @()
    if (Test-Path $Path) {
        $lines = @(Get-Content -Path $Path)
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

Write-Host ""
Write-Host "En Cloudflare: Tunnel > tu tunel > Add replica."
Write-Host "Copia el token eyJ... del comando Docker o pega el comando completo."
$inputValue = Read-Host "Token o comando"

if ([string]::IsNullOrWhiteSpace($inputValue)) {
    Write-Host "No se cambio CLOUDFLARE_TUNNEL_TOKEN."
    exit 0
}

$token = $inputValue.Trim()
if ($token -match "--token\s+(`"[^`"]+`"|'[^']+'|\S+)") {
    $token = $Matches[1].Trim("`"", "'")
}

if ($token -notmatch "^eyJ") {
    Write-Error "El token no parece valido. Debe empezar con eyJ."
    exit 1
}

Set-EnvValue -Path $envPath -Key "CLOUDFLARE_TUNNEL_TOKEN" -Value $token
Write-Host "Se actualizo CLOUDFLARE_TUNNEL_TOKEN en .env."
