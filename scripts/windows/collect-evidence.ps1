# Collects the evidence of a failure of the app into one folder. One script for every place the
# app runs, so all of them keep the same evidence:
#   - capture-crash.ps1 (the scheduled task, when the installed or DEV app crashes);
#   - the e2e tests, locally and in the CI, when a run fails (e2e/run.mjs).
# Runs on Windows PowerShell 5.1. Each step that fails is written in resumo.txt and the others go on:
# a collection that stops halfway would hide the very evidence it is for.
#
# What goes into -Folder:
#   Aplicativo.evtx, Sistema.evtx  the logs since -Since
#   CodeIntegrity.evtx             the whole CodeIntegrity/Operational log (blocks by Smart App Control)
#   resumo.txt                     versions, the app's crash events (1000, 1001) and blocks, as text
#   wer/                           the Windows Error Reporting reports of the app since -Since
#   logs-do-app/                   the app's own log files (installed, DEV and e2e)
#   dumps/                         with -DumpFolders: the app's dumps written since -Since
#   binarios/                      with -Binaries: the .exe and .pdb that read those dumps
param(
  [Parameter(Mandatory = $true)][string]$Folder,
  [datetime]$Since = (Get-Date).AddHours(-2),
  [string]$UserLocalAppData = $env:LOCALAPPDATA,
  [string[]]$DumpFolders = @(),
  [string[]]$Binaries = @()
)

$ErrorActionPreference = "Continue"
$app = "tambor-de-notas"
New-Item -ItemType Directory -Path $Folder -Force | Out-Null
$summary = Join-Path $Folder "resumo.txt"

function Write-Summary([string]$text) {
  $text | Out-File $summary -Append -Encoding UTF8 -Width 400
}

# Runs one step; if it throws, the error goes into the summary and the next step still runs.
function Step([string]$name, [scriptblock]$body) {
  try { & $body } catch { Write-Summary "Não consegui ${name}: $($_.Exception.Message)" }
}

$sinceUtc = $Since.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Write-Summary "Evidência coletada em $(Get-Date -Format s), desde $(Get-Date $Since -Format s)."

Step "ler as versões" {
  $os = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion"
  $webview = (Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue).pv
  Write-Summary "Windows: $($os.ProductName) $($os.DisplayVersion), build $($os.CurrentBuild).$($os.UBR)"
  Write-Summary "WebView2: $(if ($webview) { $webview } else { 'não encontrado' })"
}

# 1. The logs, exported whole (CodeIntegrity) or since -Since (the big ones).
foreach ($log in @(@("Application", "Aplicativo"), @("System", "Sistema"))) {
  $out = Join-Path $Folder "$($log[1]).evtx"
  wevtutil epl $log[0] $out "/q:*[System[TimeCreated[@SystemTime>='$sinceUtc']]]"
  if ($LASTEXITCODE -ne 0) { Write-Summary "Não consegui exportar o log $($log[0]) (código $LASTEXITCODE)." }
}
wevtutil epl Microsoft-Windows-CodeIntegrity/Operational (Join-Path $Folder "CodeIntegrity.evtx")
if ($LASTEXITCODE -ne 0) { Write-Summary "Não consegui exportar o log CodeIntegrity (código $LASTEXITCODE)." }

# 2. A readable summary, so the first look does not need the Event Viewer.
Step "resumir os eventos" {
  Write-Summary "`n=== Aplicativo: erros e relatórios do $app (IDs 1000 e 1001) ==="
  Get-WinEvent -FilterHashtable @{ LogName = "Application"; Id = 1000, 1001; StartTime = $Since } -ErrorAction SilentlyContinue |
    Where-Object { $_.Message -like "*$app*" } |
    Format-List TimeCreated, Id, ProviderName, Message | Out-File $summary -Append -Encoding UTF8 -Width 400
  Write-Summary "`n=== CodeIntegrity: bloqueios e auditorias (IDs 3033, 3076, 3077) ==="
  Get-WinEvent -FilterHashtable @{ LogName = "Microsoft-Windows-CodeIntegrity/Operational"; Id = 3033, 3076, 3077; StartTime = $Since } -ErrorAction SilentlyContinue |
    Format-List TimeCreated, Id, Message | Out-File $summary -Append -Encoding UTF8 -Width 400
}

# 3. The Windows Error Reporting reports of the app (they hold the module and the exception code).
Step "copiar os relatórios de erro" {
  $werRoots = foreach ($base in @("$env:ProgramData\Microsoft\Windows\WER", "$UserLocalAppData\Microsoft\Windows\WER")) {
    "$base\ReportArchive"
    "$base\ReportQueue"
  }
  foreach ($root in $werRoots) {
    Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "*$app*" -and $_.LastWriteTime -gt $Since } |
      ForEach-Object {
        $target = Join-Path $Folder "wer"
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
      }
  }
}

# 4. The app's own logs: installed, DEV and e2e (their folders start with the identifier).
Step "copiar os logs do app" {
  Get-ChildItem -Path $UserLocalAppData -Directory -Filter "com.tambordenotas.app*" -ErrorAction SilentlyContinue |
    ForEach-Object {
      $logs = Join-Path $_.FullName "logs"
      if (Test-Path $logs) {
        $target = Join-Path (Join-Path $Folder "logs-do-app") $_.Name
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path (Join-Path $logs "*") -Destination $target -Recurse -Force
      }
    }
}

# 5. The app's dumps written since -Since.
Step "copiar os dumps" {
  foreach ($dumps in $DumpFolders) {
    Get-ChildItem -Path $dumps -Filter "$app*.dmp" -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -gt $Since } |
      ForEach-Object {
        $target = Join-Path $Folder "dumps"
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path $_.FullName -Destination $target -Force
        Write-Summary "Dump: $($_.Name) ($($_.LastWriteTime))"
      }
  }
}

# 6. The binaries that read the dumps: the .exe and its .pdb, from the same build.
Step "copiar o .exe e o .pdb" {
  foreach ($file in $Binaries) {
    if (Test-Path $file) {
      $target = Join-Path $Folder "binarios"
      New-Item -ItemType Directory -Path $target -Force | Out-Null
      Copy-Item -Path $file -Destination $target -Force
    } else {
      Write-Summary "Binário não encontrado: $file"
    }
  }
}
