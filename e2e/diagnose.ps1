# TEMPORARY: why the app does not start under the Edge driver on the CI runner.
$exe = (Resolve-Path "src-tauri\target\e2e\debug\tambor-de-notas.exe").Path
$driver = (Resolve-Path "node_modules\.cache\edge\msedgedriver.exe").Path
function Stop-All {
  Get-Process tambor-de-notas, msedgedriver, tauri-driver, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep 3
}
Stop-All
"--- policies"
foreach ($k in "HKLM:\SOFTWARE\Policies\Microsoft\Edge", "HKLM:\SOFTWARE\Policies\Microsoft\Edge\WebView2", "HKLM:\SOFTWARE\WOW6432Node\Policies\Microsoft\Edge", "HKCU:\SOFTWARE\Policies\Microsoft\Edge") {
  if (Test-Path $k) { $k; Get-ItemProperty $k | Format-List | Out-String } else { "$k (absent)" }
}
"--- driver version"; & $driver --version
"--- user data"; $udf = Join-Path $env:LOCALAPPDATA "com.tambordenotas.app.e2e"; "exists=$(Test-Path $udf)"

"--- A: app alone with a debugging port"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9333"
$p = Start-Process $exe -PassThru
$open = $false
foreach ($i in 1..15) {
  Start-Sleep 3
  try { Invoke-WebRequest http://127.0.0.1:9333/json/version -UseBasicParsing -TimeoutSec 2 | Out-Null; $open = $true; break } catch {}
}
"port open=$open after $($i * 3)s exited=$($p.HasExited)"
Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1 | ForEach-Object { "browser cmd: " + $_.CommandLine.Substring(0, [Math]::Min(500, $_.CommandLine.Length)) }
Get-ChildItem $udf -Recurse -Filter DevToolsActivePort -ErrorAction SilentlyContinue | ForEach-Object { "port file: " + $_.FullName }
Remove-Item Env:\WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
Stop-All

"--- B: session through the Edge driver, verbose"
$log = Join-Path $env:RUNNER_TEMP "msedgedriver.log"
$d = Start-Process $driver -ArgumentList "--port=9515", "--verbose", "--log-path=$log" -PassThru
Start-Sleep 2
$body = @{ capabilities = @{ alwaysMatch = @{ browserName = "webview2"; "ms:edgeOptions" = @{ binary = $exe; args = @(); webviewOptions = @{} } } } } | ConvertTo-Json -Depth 6
try { (Invoke-WebRequest http://127.0.0.1:9515/session -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 90).Content.Substring(0, 300) } catch { "session error: $($_.Exception.Message)"; $_.ErrorDetails.Message }
Stop-All
"--- driver log (filtered)"
Get-Content $log -ErrorAction SilentlyContinue | Select-String -Pattern "Launching|command line|DevToolsActivePort|ERROR|error|exited|crash|WEBVIEW2|Starting|port" | Select-Object -First 25 | ForEach-Object { $_.Line.Substring(0, [Math]::Min(420, $_.Line.Length)) }
"--- events"
Get-WinEvent -FilterHashtable @{ LogName = 'Application'; Id = 1000, 1001; StartTime = (Get-Date).AddMinutes(-20) } -ErrorAction SilentlyContinue | Select-Object -First 4 | ForEach-Object { $m = $_.Message -replace '\s+', ' '; $m.Substring(0, [Math]::Min(300, $m.Length)) }
exit 0
