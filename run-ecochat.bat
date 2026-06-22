@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"

if not exist "%BACKEND_PYTHON%" (
  echo [INFO] Ambiente virtual do backend nao encontrado. A criar...
  cd /d "%BACKEND_DIR%"
  python -m venv venv

  if errorlevel 1 (
    echo [ERRO] Nao foi possivel criar o ambiente virtual do backend.
    exit /b 1
  )

  echo [INFO] A instalar dependencias do backend...
  call "%BACKEND_DIR%\venv\Scripts\activate.bat"
  pip install -r requirements.txt

  if errorlevel 1 (
    echo [ERRO] Nao foi possivel instalar as dependencias do backend.
    exit /b 1
  )
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [INFO] Dependencias do frontend nao encontradas. A instalar...
  cd /d "%FRONTEND_DIR%"
  call npm install

  if errorlevel 1 (
    echo [ERRO] Nao foi possivel instalar as dependencias do frontend.
    exit /b 1
  )
)

start "EcoChat Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%BACKEND_PYTHON%" app.py"
start "EcoChat Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo EcoChat iniciado.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
