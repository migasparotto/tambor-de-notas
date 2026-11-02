# Copies the evidence of a crash of the app as soon as it happens, before the circular
# Windows logs erase it. Started by the scheduled task "Tambor de Notas - capturar queda"
# (see install-crash-capture.ps1), which runs as SYSTEM when the Application log records
# event 1000 for tambor-de-notas.exe. Runs on Windows PowerShell 5.1.
#
# Each crash gets its own folder "queda-<date>" with:
#   Aplicativo.evtx, Sistema.evtx  the last 2 hours of those logs
#   CodeIntegrity.evtx             the whole CodeIntegrity/Operational log (blocks by Smart App Control)
#   resumo.txt                     the crash events and blocks of the last 2 hours, as text
#   wer/                           the Windows Error Reporting reports of the app from the last 2 hours
#   logs-do-app/                   the app's own log files, when they exist
# The dumps themselves are written by Windows straight into "<Destination>\dumps" (LocalDumps).
param(
  [Parameter(Mandatory = $true)][string]$Destination,
  [Parameter(Mandatory = $true)][string]$UserLocalAppData
)

$ErrorActionPreference = "Continue"
$app = "tambor-de-notas.exe"
$twoHours = "*[System[TimeCreated[timediff(@SystemTime) <= 7200000]]]"
$journal = Join-Path $Destination "capturas.log"

function Write-Journal([string]$line) {
  Add-Content -Path $journal -Value "$(Get-Date -Format s)  $line" -Encoding UTF8
}

# Windows Error Reporting may still be writing the dump and the report.
Start-Sleep -Seconds 20

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$folder = Join-Path $Destination "queda-$stamp"
New-Item -ItemType Directory -Path $folder -Force | Out-Null
Write-Journal "Queda detectada; capturando em $folder"

# 1. The logs, exported whole (CodeIntegrity) or for the last 2 hours (the big ones).
wevtutil epl Application (Join-Path $folder "Aplicativo.evtx") "/q:$twoHours"
wevtutil epl System (Join-Path $folder "Sistema.evtx") "/q:$twoHours"
wevtutil epl Microsoft-Windows-CodeIntegrity/Operational (Join-Path $folder "CodeIntegrity.evtx")

# 2. A readable summary, so the first look does not need the Event Viewer.
$summary = Join-Path $folder "resumo.txt"
"Captura de $stamp. Eventos das últimas 2 horas." | Out-File $summary -Encoding UTF8
"`n=== Aplicativo: erros e relatórios do $app (IDs 1000 e 1001) ===" | Out-File $summary -Append -Encoding UTF8
Get-WinEvent -FilterHashtable @{ LogName = "Application"; Id = 1000, 1001; StartTime = (Get-Date).AddHours(-2) } -ErrorAction SilentlyContinue |
  Where-Object { $_.Message -like "*$app*" } |
  Format-List TimeCreated, Id, ProviderName, Message | Out-File $summary -Append -Encoding UTF8 -Width 400
"`n=== CodeIntegrity: bloqueios e auditorias (IDs 3033, 3076, 3077) ===" | Out-File $summary -Append -Encoding UTF8
Get-WinEvent -FilterHashtable @{ LogName = "Microsoft-Windows-CodeIntegrity/Operational"; Id = 3033, 3076, 3077; StartTime = (Get-Date).AddHours(-2) } -ErrorAction SilentlyContinue |
  Format-List TimeCreated, Id, Message | Out-File $summary -Append -Encoding UTF8 -Width 400

# 3. The Windows Error Reporting reports of the app (they hold the module and the exception code).
$werDestination = Join-Path $folder "wer"
$werRoots = foreach ($base in @("$env:ProgramData\Microsoft\Windows\WER", "$UserLocalAppData\Microsoft\Windows\WER")) {
  "$base\ReportArchive"
  "$base\ReportQueue"
}
foreach ($root in $werRoots) {
  Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*tambor-de-notas*" -and $_.LastWriteTime -gt (Get-Date).AddHours(-2) } |
    ForEach-Object {
      New-Item -ItemType Directory -Path $werDestination -Force | Out-Null
      Copy-Item -Path $_.FullName -Destination $werDestination -Recurse -Force
    }
}

# 4. The app's own logs, for the installed app and the DEV one (their folders start with the identifier).
Get-ChildItem -Path $UserLocalAppData -Directory -Filter "com.tambordenotas.app*" -ErrorAction SilentlyContinue |
  ForEach-Object {
    $logs = Join-Path $_.FullName "logs"
    if (Test-Path $logs) {
      $target = Join-Path (Join-Path $folder "logs-do-app") $_.Name
      New-Item -ItemType Directory -Path $target -Force | Out-Null
      Copy-Item -Path (Join-Path $logs "*") -Destination $target -Recurse -Force
    }
  }

# 5. Point to the dump Windows wrote, if any.
$dump = Get-ChildItem -Path (Join-Path $Destination "dumps") -Filter "*.dmp" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($dump) {
  "`nDump mais recente: $($dump.FullName) ($($dump.LastWriteTime))" | Out-File $summary -Append -Encoding UTF8
}

Write-Journal "Captura concluída em $folder"
