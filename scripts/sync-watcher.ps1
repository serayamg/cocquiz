# Script Auto-Sync Watcher untuk QuizCOC
Write-Host "=== QuizCOC Auto-Sync Watcher Aktif ===" -ForegroundColor Green
Write-Host "Setiap perubahan file akan otomatis di-commit dan di-push ke GitHub." -ForegroundColor Cyan
Write-Host "Tekan Ctrl+C untuk menghentikan watcher.`n" -ForegroundColor Yellow

$repoPath = Split-Path -Parent $PSScriptRoot
Set-Location $repoPath

while ($true) {
    $status = git status --porcelain
    if ($status) {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "[$timestamp] Perubahan terdeteksi! Mempersiapkan sinkronisasi..." -ForegroundColor Yellow
        
        # Debounce sejenak agar proses penyimpanan file selesai
        Start-Sleep -Seconds 3
        
        git add .
        $commitMsg = "Auto update: $timestamp"
        git commit -m "$commitMsg"
        
        Write-Host "[$timestamp] Mengunggah (push) ke GitHub..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] Berhasil sinkronisasi ke GitHub!`n" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] Gagal push, periksa koneksi internet.`n" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 5
}
