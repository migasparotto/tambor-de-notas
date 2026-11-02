# TEMPORARY: is the WebView2 variable ignored because the runner's user is elevated?
$exe = (Resolve-Path "src-tauri\target\e2e\debug\tambor-de-notas.exe").Path
function Stop-All {
  Get-Process tambor-de-notas, msedgedriver, tauri-driver, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep 3
}
function Test-Port($port) {
  foreach ($i in 1..12) {
    Start-Sleep 3
    try { Invoke-WebRequest "http://127.0.0.1:$port/json/version" -UseBasicParsing -TimeoutSec 2 | Out-Null; return "open after $($i * 3)s" } catch {}
  }
  return "closed after 36s"
}
function Show-Browser {
  $main = Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
  "has port arg: $($main.CommandLine -match 'remote-debugging-port')"
}
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
"elevated=$((New-Object Security.Principal.WindowsPrincipal $id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
"uac=$((Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System').EnableLUA)"
"os=$((Get-CimInstance Win32_OperatingSystem).Caption)"
Stop-All

"--- A: elevated, as before"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9333"
Start-Process $exe | Out-Null
"port: $(Test-Port 9333)"; Show-Browser
Stop-All

"--- B: not elevated (runas /trustlevel)"
$cmd = Join-Path $env:RUNNER_TEMP "start-limited.cmd"
Set-Content $cmd "@echo off`r`nset WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9335`r`n`"$exe`"`r`n"
Start-Process runas -ArgumentList "/trustlevel:0x20000", "`"$cmd`"" -NoNewWindow
"port: $(Test-Port 9335)"; Show-Browser
Get-Process tambor-de-notas -ErrorAction SilentlyContinue | ForEach-Object { "app running pid=$($_.Id)" }
Stop-All

"--- C: the variable set at the machine level"
Remove-Item Env:\WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
[Environment]::SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--remote-debugging-port=9336", "User")
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9336"
Start-Process $exe | Out-Null
"port: $(Test-Port 9336)"; Show-Browser
Stop-All
exit 0
