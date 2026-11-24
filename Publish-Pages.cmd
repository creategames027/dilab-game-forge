@echo off
cd /d "%~dp0"
node scripts/build-pages.js
if errorlevel 1 goto done
echo.
echo Static site is ready in docs.
echo GitHub Pages: Settings - Pages - Deploy from a branch - main - /docs.
echo No paid server or build service required.
:done
pause
