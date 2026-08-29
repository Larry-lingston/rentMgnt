@echo off
REM Stops the backend API and Expo dev server.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
pause
