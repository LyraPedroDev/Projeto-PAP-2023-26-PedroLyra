@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"

if not exist "%BACKEND_PYTHON%" (
  echo [ERRO] Ambiente virtual do backend nao encontrado:
  echo %BACKEND_PYTHON%
  exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [ERRO] Dependencias do frontend nao encontradas:
  echo %FRONTEND_DIR%\node_modules
  echo Executa primeiro: cd frontend ^&^& npm install
  exit /b 1
)

start "EcoChat Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%BACKEND_PYTHON%" app.py"
start "EcoChat Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo EcoChat iniciado.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
