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
echo 9. Resetear tablas de Postgres
echo 10. Salir
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
if "%option%"=="10" goto end
goto menu

:start
call :write_host_ip
docker compose up -d
pause
goto menu

:status
docker compose ps
pause
goto menu

:logs_frontend
docker compose logs -f frontend
goto menu

:logs_backend
docker compose logs -f backend
goto menu

:logs_postgres
docker compose logs -f postgres
goto menu

:logs_minio
docker compose logs -f minio
goto menu

:stop
docker compose down
pause
goto menu

:rebuild
call :write_host_ip
docker compose up -d --build
pause
goto menu

:reset_db
echo.
echo Esto elimina y vuelve a crear todas las tablas de Postgres.
echo Los archivos cargados en MinIO no se borran.
set /p confirm=Escribi RESET para confirmar: 
if not "%confirm%"=="RESET" goto menu
docker compose exec backend python -c "from src.db import reset_database; reset_database()"
pause
goto menu

:write_host_ip
set "HOST_IP=127.0.0.1"
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127\.0\.0\.1|169\.254\.)' -and $_.InterfaceOperationalStatus -eq 'Up' } | Select-Object -ExpandProperty IPAddress -First 1"`) do set "HOST_IP=%%I"
echo HOST_IP=%HOST_IP% > .env
goto :eof

:end
endlocal
