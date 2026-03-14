# Script para iniciar o sistema GDN Automotive localmente
# Requer Python instalado para rodar o servidor HTTP básico

Write-Host "--- Iniciando Servidor Local GDN Automotive ---" -ForegroundColor Cyan

# Verifica se o Python está instalado
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "ERRO: Python não encontrado. Certifique-se de que o Python está instalado e no seu PATH." -ForegroundColor Red
    Write-Host "Você também pode abrir o arquivo index.html diretamente, mas algumas funções podem falhar." -ForegroundColor Yellow
    Pause
    exit
}

Write-Host "Servidor rodando em http://localhost:8000" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para encerrar." -ForegroundColor Gray

# Inicia o servidor e abre o navegador
Start-Process "http://localhost:8000"
python -m http.server 8000
