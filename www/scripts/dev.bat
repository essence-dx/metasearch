@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
set "PID_FILE=%TEMP%\dx-metasearch.pid"

REM Find dx-metasearch.exe
set "META_SEARCH="
where dx-metasearch.exe >nul 2>nul
if !errorlevel! equ 0 (
  for /f "delims=" %%a in ('where dx-metasearch.exe') do set "META_SEARCH=%%a"
) else (
  if exist "%LOCALAPPDATA%\dx\bin\dx-metasearch.exe" (
    set "META_SEARCH=%LOCALAPPDATA%\dx\bin\dx-metasearch.exe"
  ) else (
    echo dx-metasearch.exe not found.
    echo Install it or add its directory to PATH.
    exit /b 1
  )
)

echo Starting dx-metasearch...
powershell -Command "$p = Start-Process -FilePath '%META_SEARCH%' -ArgumentList 'serve' -NoNewWindow -PassThru; Write-Output $p.Id" > "%PID_FILE%"
set /p META_PID=<"%PID_FILE%"

REM Wait for metasearch to be ready
for /l %%i in (1,1,30) do (
  >nul 2>nul curl -sf "http://127.0.0.1:8888/api/search?q=ping"
  if !errorlevel! equ 0 (
    echo dx-metasearch is ready
    goto :run_dev
  )
  if %%i equ 30 (
    echo dx-metasearch failed to start
    exit /b 1
  )
  timeout /t 1 /nobreak >nul
)

:run_dev
echo Starting dx dev...
cd /d "%ROOT%"
dx dev %*
set "DEV_EXIT=!ERRORLEVEL!"

REM Kill metasearch
if defined META_PID (
  >nul 2>nul taskkill /pid !META_PID! /f
)
del "%PID_FILE%" 2>nul

exit /b %DEV_EXIT%
