#Requires -RunAsAdministrator
# Undoes install-crash-capture.ps1: removes the scheduled task, the LocalDumps setting and the
# copy of the capture script in %ProgramFiles%.
# Keeps the captures already made (%LOCALAPPDATA%\Tambor de Notas (quedas)) and the bigger
# CodeIntegrity log, which does no harm.
#
#   powershell -ExecutionPolicy Bypass -File scripts\windows\uninstall-crash-capture.ps1

$taskName = "Tambor de Notas - capturar queda"
$key = "HKLM:\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\tambor-de-notas.exe"

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Remove-Item -Path $key -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $env:ProgramFiles "Tambor de Notas (quedas)") -Recurse -ErrorAction SilentlyContinue
Write-Host "Captura de quedas desligada. As capturas feitas continuam em $env:LOCALAPPDATA\Tambor de Notas (quedas)."
