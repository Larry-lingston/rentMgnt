@echo off
REM Double-click launcher for the Rent Manager app.
REM Passes any arguments straight through to start.ps1 (e.g. start.bat -Reseed).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
if errorlevel 1 pause
