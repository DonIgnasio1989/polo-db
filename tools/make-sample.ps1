# ============================================================
# tools/make-sample.ps1 — то же самое для PowerShell (Windows)
# Запуск:
#   powershell -ExecutionPolicy Bypass -File tools\make-sample.ps1 -Src "D:\etka-dump"
#   powershell -ExecutionPolicy Bypass -File tools\make-sample.ps1 -Src "D:\etka-dump" -Count 3 -Lines 60 -Out etka-sample.txt
# ============================================================
param(
    [Parameter(Mandatory = $true)][string]$Src,
    [int]$Count = 3,
    [int]$Lines = 60,
    [string]$Out = "etka-sample.txt"
)
$cp1251 = [System.Text.Encoding]::GetEncoding(1251)
$files = Get-ChildItem -Path $Src -Filter *.txt -File | Select-Object -First $Count
if (-not $files) { Write-Error "в $Src не найдено .txt"; exit 1 }
$sb = New-Object System.Text.StringBuilder
$i = 0
foreach ($f in $files) {
    $i++
    [void]$sb.AppendLine("==================== FILE ${i}: $($f.Name) ====================")
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $text = $null
    # сначала пробуем UTF-8 строго; если не вышло — CP1251
    try {
        $strict = New-Object System.Text.UTF8Encoding($false, $true)
        $text = $strict.GetString($bytes)
        $enc = "utf-8"
    } catch {
        $text = $cp1251.GetString($bytes)
        $enc = "cp1251"
    }
    [void]$sb.AppendLine("# кодировка исходника: $enc")
    ($text -split "`r?`n" | Select-Object -First $Lines) | ForEach-Object { [void]$sb.AppendLine($_) }
    [void]$sb.AppendLine("")
}
# пишем образец в UTF-8 (именно его и принимает загрузка)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $Out), $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
$size = (Get-Item $Out).Length
Write-Host "готово: $Out ($size байт, файлов: $i)"
