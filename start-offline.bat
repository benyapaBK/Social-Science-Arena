@echo off
cd /d "%~dp0"
if not exist offline\index.html call npm run build:offline
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-offline.ps1"
pause
