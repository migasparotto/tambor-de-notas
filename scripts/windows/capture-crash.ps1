# Copies the evidence of a crash of the app as soon as it happens, before the circular
# Windows logs erase it. Started by the scheduled task "Tambor de Notas - capturar queda"
# (see install-crash-capture.ps1), which runs as SYSTEM when the Application log records
# event 1000 for tambor-de-notas.exe. Runs on Windows PowerShell 5.1.
#
# Each crash gets its own folder "queda-<date>", filled by collect-evidence.ps1 (the same
# script the e2e tests use) with the last 2 hours: logs, summary, error reports, the app's logs,
# the dump Windows wrote into "<Destination>\dumps" (LocalDumps) and the installed .exe. The
# .pdb that reads the dump is attached to the GitHub release of the same version.
param(
  [Parameter(Mandatory = $true)][string]$Destination,
  [Parameter(Mandatory = $true)][string]$UserLocalAppData
)

$ErrorActionPreference = "Continue"
$journal = Join-Path $Destination "capturas.log"

function Write-Journal([string]$line) {
  Add-Content -Path $journal -Value "$(Get-Date -Format s)  $line" -Encoding UTF8
}

# Windows Error Reporting may still be writing the dump and the report.
Start-Sleep -Seconds 20

$folder = Join-Path $Destination "queda-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
Write-Journal "Queda detectada; capturando em $folder"
& (Join-Path $PSScriptRoot "collect-evidence.ps1") `
  -Folder $folder `
  -Since (Get-Date).AddHours(-2) `
  -UserLocalAppData $UserLocalAppData `
  -DumpFolders @(Join-Path $Destination "dumps") `
  -Binaries @(Join-Path $UserLocalAppData "Tambor de Notas\tambor-de-notas.exe")
Write-Journal "Captura concluída em $folder"
