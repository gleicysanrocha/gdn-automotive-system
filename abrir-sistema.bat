@echo off
title GDN Automotive - Iniciar Sistema
echo ==========================================
echo    GDN AUTOMOTIVE - INICIADOR LOCAL
echo ==========================================
echo.

:: Verifica Node.js primeiro (mais rapido)
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js detectado.
    echo Iniciando servidor na porta 3000...
    start http://localhost:3000
    npx -y serve -l 3000 .
    goto end
)

:: Se nao tiver Node, tenta Python
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Python detectado.
    echo Iniciando servidor na porta 8000...
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

:: Se nao tiver nenhum, avisa
echo [!] ERRO: Nao encontrei Node.js ou Python instalado.
echo.
echo Tente instalar o Node.js em: https://nodejs.org/
echo Ou abra o arquivo 'index.html' diretamente (clique duplo),
echo mas algumas funcoes de rede podem ser bloqueadas pelo navegador.
echo.
echo Pressione qualquer tecla para tentar abrir o arquivo diretamente...
pause >nul
start index.html

:end
pause
