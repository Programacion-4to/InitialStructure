@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

:menu
cls
echo Titoflix Docker Manager
echo =======================
echo.
echo 1. Iniciar servicios
echo 2. Ver estado
echo 3. Ver consola del frontend
echo 4. Ver consola del backend
echo 5. Ver consola de postgres
echo 6. Ver consola de MinIO
echo 7. Detener servicios
echo 8. Reconstruir e iniciar
echo 9. Resetear tablas de Postgres y buckets de MinIO
echo 10. Iniciar tunel de Cloudflare
echo 11. Ver estado/logs del tunel
echo 12. Detener tunel de Cloudflare
echo 13. Reconstruir frontend sin cache
echo 0. Salir
echo.
set /p option=Elegi una opcion: 

if "%option%"=="1" goto start
if "%option%"=="2" goto status
if "%option%"=="3" goto logs_frontend
if "%option%"=="4" goto logs_backend
if "%option%"=="5" goto logs_postgres
if "%option%"=="6" goto logs_minio
if "%option%"=="7" goto stop
if "%option%"=="8" goto rebuild
if "%option%"=="9" goto reset_db
if "%option%"=="10" goto start_tunnel
if "%option%"=="11" goto tunnel_logs
if "%option%"=="12" goto stop_tunnel
if "%option%"=="13" goto rebuild_frontend
if "%option%"=="0" goto end
goto menu

:start
call :ensure_env
if errorlevel 1 (
    pause
    goto menu
)
call :write_host_ip
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose up -d
pause
goto menu

:status
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose ps
pause
goto menu

:logs_frontend
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose logs -f frontend
goto menu

:logs_backend
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose logs -f backend
goto menu

:logs_postgres
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose logs -f postgres
goto menu

:logs_minio
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose logs -f minio
goto menu

:stop
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose down
pause
goto menu

:rebuild
call :ensure_env
if errorlevel 1 (
    pause
    goto menu
)
call :write_host_ip
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose down --remove-orphans
if errorlevel 1 goto rebuild_failed
docker compose build --no-cache frontend backend
if errorlevel 1 goto rebuild_failed
docker compose up -d --force-recreate
if errorlevel 1 goto rebuild_failed
pause
goto menu

:rebuild_frontend
call :ensure_env
if errorlevel 1 (
    pause
    goto menu
)
call :write_host_ip
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker compose build --no-cache frontend
if errorlevel 1 goto rebuild_failed
docker compose up -d --no-deps --force-recreate frontend
if errorlevel 1 goto rebuild_failed
pause
goto menu

:rebuild_failed
echo.
echo No se pudo reconstruir o iniciar Titoflix. Revisa el error anterior.
pause
goto menu

:reset_db
call :ensure_env
if errorlevel 1 (
    pause
    goto menu
)
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
echo.
echo Esto elimina y vuelve a crear todas las tablas de Postgres.
echo Tambien elimina y recrea el bucket titoflix-media de MinIO.
set /p confirm=Escribi RESET para confirmar: 
if not "%confirm%"=="RESET" goto menu
docker compose exec backend python -c "from src.db import reset_database; reset_database()"
docker compose run --rm --entrypoint /bin/sh minio-init -c "until mc alias set local http://minio:9000 titoflix titoflix-secret; do sleep 2; done && mc rb --force local/titoflix-media || true && mc mb --ignore-existing local/titoflix-media"
pause
goto menu

:start_tunnel
call :ensure_env
if errorlevel 1 (
    pause
    goto menu
)
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
call :load_tunnel_token
if errorlevel 1 (
    pause
    goto menu
)
docker rm -f titoflix-cloudflared-tunnel >nul 2>nul
docker run -d --name titoflix-cloudflared-tunnel --restart unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "%CLOUDFLARE_TUNNEL_TOKEN%"
echo.
echo Espera unos segundos. El conector deberia aparecer como Healthy en Cloudflare Zero Trust.
timeout /t 6 /nobreak >nul
docker logs titoflix-cloudflared-tunnel
pause
goto menu

:tunnel_logs
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker logs titoflix-cloudflared-tunnel
pause
goto menu

:stop_tunnel
call :check_docker
if errorlevel 1 (
    pause
    goto menu
)
docker rm -f titoflix-cloudflared-tunnel
pause
goto menu

:ensure_env
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (!(Test-Path '.env') -or -not (Select-String -Path '.env' -Pattern '^DATABASE_URL=' -Quiet)) { if (Test-Path '.env.example') { Copy-Item '.env.example' '.env' -Force; Write-Host 'Se creo/actualizo .env desde .env.example porque faltaban variables base.' } else { Write-Error 'No se encontro .env.example para crear .env.'; exit 1 } }"
if errorlevel 1 exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$path='.env'; $values=@{NEXT_PUBLIC_API_URL='/api/v1'; NEXT_PUBLIC_DIRECT_API_URL='/api/v1'; NEXT_PUBLIC_BACKEND_URL=''}; $lines=@(); if (Test-Path $path) { $lines=Get-Content $path }; foreach ($key in $values.Keys) { $line=$key + '=' + $values[$key]; if ($lines -match ('^' + [regex]::Escape($key) + '=')) { $lines=$lines -replace ('^' + [regex]::Escape($key) + '=.*'), $line } else { $lines += $line } }; if (-not ($lines -match '^CLOUDFLARE_TUNNEL_TOKEN=')) { $lines += ''; $lines += '# Cloudflare Tunnel'; $lines += 'CLOUDFLARE_TUNNEL_TOKEN=' }; Set-Content -Path $path -Value $lines"
goto :eof

:check_docker
docker info >nul 2>nul
if errorlevel 1 (
    echo.
    echo Docker no esta disponible.
    echo Abri Docker Desktop y espera a que diga "Docker Desktop is running".
    echo Si ya esta abierto, revisa que este usando el engine Linux de Docker Desktop.
    exit /b 1
)
goto :eof

:load_tunnel_token
set "CLOUDFLARE_TUNNEL_TOKEN="
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="CLOUDFLARE_TUNNEL_TOKEN" set "CLOUDFLARE_TUNNEL_TOKEN=%%B"
)
if "%CLOUDFLARE_TUNNEL_TOKEN%"=="" (
    echo.
    echo Falta CLOUDFLARE_TUNNEL_TOKEN en .env.
    echo Copia el token del conector Docker en Cloudflare Zero Trust ^> Networks ^> Tunnels.
    echo Debe quedar asi:
    echo CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
    exit /b 1
)
goto :eof

:write_host_ip
powershell -NoProfile -Command "$hostIp='127.0.0.1'; foreach ($ip in Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue) { if ($ip.IPAddress -notlike '127.*' -and $ip.IPAddress -notlike '169.254.*' -and $ip.InterfaceOperationalStatus -eq 'Up') { $hostIp=$ip.IPAddress; break } }; if (Test-Path '.env') { $c=Get-Content '.env'; if ($c -match '^HOST_IP=') { $c = $c -replace '^HOST_IP=.*',('HOST_IP=' + $hostIp); Set-Content -Path '.env' -Value $c } else { Add-Content -Path '.env' -Value ('HOST_IP=' + $hostIp) } } else { Set-Content -Path '.env' -Value ('HOST_IP=' + $hostIp) }"
goto :eof

:end
endlocal
