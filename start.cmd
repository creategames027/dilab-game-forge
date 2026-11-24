@echo off
cd /d "%~dp0"
start "Game Forge server" node serve.js
timeout /t 2 /nobreak >nul
start "" "http://localhost:8765/"
