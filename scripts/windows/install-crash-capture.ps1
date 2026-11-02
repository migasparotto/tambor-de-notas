#Requires -RunAsAdministrator
# Sets up the automatic capture of evidence when the app crashes. Run once, in Windows
# PowerShell opened as administrator, from the repository folder:
#
#   powershell -ExecutionPolicy Bypass -File scripts\windows\install-crash-capture.ps1 -Test
#
# What it changes on the computer (undo with uninstall-crash-capture.ps1):
#   1. A folder outside the repository: %LOCALAPPDATA%\Tambor de Notas (quedas), and the
#      capture script in %ProgramFiles%\Tambor de Notas (quedas).
#   2. Windows writes a full dump of tambor-de-notas.exe there when it crashes
#      (Windows Error Reporting "LocalDumps", keeping the last 3).
#   3. The CodeIntegrity/Operational log grows from 1 MB to 20 MB, so it stops erasing
#      the time of a crash before anyone looks.
#   4. A scheduled task, "Tambor de Notas - capturar queda", started by event 1000 of
#      tambor-de-notas.exe in the Application log, runs capture-crash.ps1 as SYSTEM.
# It works for the installed app and the DEV one, because both run as tambor-de-notas.exe.
# With -Test it writes a fake event 1000 for the app and checks that a capture appeared.
param([switch]$Test)

$ErrorActionPreference = "Stop"
$app = "tambor-de-notas.exe"
$taskName = "Tambor de Notas - capturar queda"
$destination = Join-Path $env:LOCALAPPDATA "Tambor de Notas (quedas)"
$dumps = Join-Path $destination "dumps"
# The task runs this script as SYSTEM, so it lives where only administrators can change it:
# a copy in the user's folder could be edited by any program of the user to run as SYSTEM.
$scriptFolder = Join-Path $env:ProgramFiles "Tambor de Notas (quedas)"
$script = Join-Path $scriptFolder "capture-crash.ps1"

# 1. The folder, and a copy of the capture scripts, so the task does not depend on where the repository is.
New-Item -ItemType Directory -Path $dumps -Force | Out-Null
New-Item -ItemType Directory -Path $scriptFolder -Force | Out-Null
foreach ($name in @("capture-crash.ps1", "collect-evidence.ps1")) {
  Copy-Item -Path (Join-Path $PSScriptRoot $name) -Destination (Join-Path $scriptFolder $name) -Force
}
Write-Host "Pasta das capturas: $destination"

# 2. Full dumps of the app, straight into the folder.
$key = "HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\$app"
New-Item -Path $key -Force | Out-Null
New-ItemProperty -Path $key -Name DumpFolder -PropertyType ExpandString -Value $dumps -Force | Out-Null
New-ItemProperty -Path $key -Name DumpCount -PropertyType DWord -Value 3 -Force | Out-Null
New-ItemProperty -Path $key -Name DumpType -PropertyType DWord -Value 2 -Force | Out-Null
Write-Host "Dumps completos do $app em $dumps (os 3 mais recentes)."

# 3. A bigger CodeIntegrity log (20 MB).
wevtutil sl Microsoft-Windows-CodeIntegrity/Operational /ms:20971520
Write-Host "Log do CodeIntegrity aumentado para 20 MB."

# 4. The scheduled task, started by the crash event.
$query = "<QueryList><Query Id=`"0`" Path=`"Application`"><Select Path=`"Application`">" +
  "*[System[Provider[@Name='Application Error'] and EventID=1000]] and *[EventData[Data='$app']]" +
  "</Select></Query></QueryList>"
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Destination `"$destination`" -UserLocalAppData `"$env:LOCALAPPDATA`""
$escape = { param($text) [System.Security.SecurityElement]::Escape($text) }
$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Copia os logs, o relatório e o dump quando o Tambor de Notas cai. Criada por scripts\windows\install-crash-capture.ps1.</Description>
  </RegistrationInfo>
  <Triggers>
    <EventTrigger>
      <Enabled>true</Enabled>
      <Subscription>$(& $escape $query)</Subscription>
    </EventTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>Queue</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT10M</ExecutionTimeLimit>
    <Enabled>true</Enabled>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>$(& $escape $arguments)</Arguments>
    </Exec>
  </Actions>
</Task>
"@
Register-ScheduledTask -TaskName $taskName -Xml $xml -Force | Out-Null
Write-Host "Tarefa agendada criada: $taskName"

if ($Test) {
  # A fake crash event: its only text is the app name, which is what the task's filter looks for.
  $before = @(Get-ChildItem -Path $destination -Directory -Filter "queda-*" -ErrorAction SilentlyContinue).Count
  Write-EventLog -LogName Application -Source "Application Error" -EventId 1000 -EntryType Error -Message $app
  Write-Host "Evento de teste gravado. Esperando a captura (até 90 s)..."
  $deadline = (Get-Date).AddSeconds(90)
  do {
    Start-Sleep -Seconds 5
    $after = @(Get-ChildItem -Path $destination -Directory -Filter "queda-*" -ErrorAction SilentlyContinue).Count
  } while ($after -le $before -and (Get-Date) -lt $deadline)
  # The task may have started without managing to export anything, so check the files too.
  $newest = Get-ChildItem -Path $destination -Directory -Filter "queda-*" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
  $expected = @("Aplicativo.evtx", "Sistema.evtx", "CodeIntegrity.evtx", "resumo.txt")
  $missing = @($expected | Where-Object { $newest -and -not (Test-Path (Join-Path $newest.FullName $_)) })
  if ($after -gt $before -and $missing.Count -eq 0) {
    Write-Host "OK: a captura apareceu em $($newest.FullName), com $($expected -join ', ')." -ForegroundColor Green
  } elseif ($after -gt $before) {
    Write-Host "A captura apareceu em $($newest.FullName), mas sem: $($missing -join ', '). Veja $destination\capturas.log." -ForegroundColor Red
    exit 1
  } else {
    Write-Host "A captura não apareceu. Veja o histórico da tarefa no Agendador e $destination\capturas.log." -ForegroundColor Red
    exit 1
  }
}
