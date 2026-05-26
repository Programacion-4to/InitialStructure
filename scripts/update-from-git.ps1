$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $Args)

    $output = & git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output -join [Environment]::NewLine)
    }

    return $output
}

try {
    Invoke-Git rev-parse --is-inside-work-tree | Out-Null

    $dirty = @(Invoke-Git status --porcelain --untracked-files=all)
    if ($dirty.Count -gt 0) {
        Write-Host "Hay cambios locales sin commitear. No hago pull para no pisarlos."
        Write-Host ""
        $dirty | ForEach-Object { Write-Host $_ }
        exit 1
    }

    $branch = (Invoke-Git branch --show-current | Select-Object -First 1).Trim()
    if ([string]::IsNullOrWhiteSpace($branch)) {
        Write-Host "No estas en una rama normal de Git."
        exit 1
    }

    Write-Host "Buscando cambios remotos..."
    Invoke-Git fetch --prune | Out-Null

    $upstream = (& git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null)
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($upstream)) {
        $candidate = "origin/$branch"
        & git show-ref --verify --quiet "refs/remotes/$candidate"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "La rama '$branch' no tiene upstream y no existe '$candidate'."
            exit 1
        }

        $upstream = $candidate
    }

    $counts = (Invoke-Git rev-list --left-right --count "HEAD...$upstream" | Select-Object -First 1).Trim() -split "\s+"
    $ahead = [int]$counts[0]
    $behind = [int]$counts[1]

    if ($behind -eq 0) {
        Write-Host "No hay cambios nuevos en $upstream."
        exit 2
    }

    if ($ahead -gt 0) {
        Write-Host "Tu rama local tiene commits que no estan en $upstream."
        Write-Host "No hago pull automatico para evitar mezclar cambios sin revisar."
        exit 1
    }

    Write-Host "Hay $behind commit(s) nuevo(s). Actualizando desde $upstream..."
    Invoke-Git pull --ff-only | Out-Host
    Write-Host "Repositorio actualizado. Ahora se reconstruiran los servicios."
    exit 0
} catch {
    Write-Host "No se pudo actualizar desde Git."
    Write-Host $_.Exception.Message
    exit 1
}
