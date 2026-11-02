# TEMPORARY: does the debugging port asked by the app's own config open on the runner?
$exe = (Resolve-Path "src-tauri\target\e2e\debug\tambor-de-notas.exe").Path
Get-Process tambor-de-notas, msedgedriver, tauri-driver, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Process $exe | Out-Null
$open = "closed after 36s"
foreach ($i in 1..12) {
  Start-Sleep 3
  try { $open = "open after $($i * 3)s: " + (Invoke-WebRequest "http://127.0.0.1:9222/json/version" -UseBasicParsing -TimeoutSec 2).Content.Substring(0, 120); break } catch {}
}
"port: $open"
$main = Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
"has port arg: $($main.CommandLine -match 'remote-debugging-port')"
$driver = (Resolve-Path "node_modules\.cache\edge\msedgedriver.exe").Path
$d = Start-Process $driver -ArgumentList "--port=9515" -PassThru
Start-Sleep 2
$body = @{ capabilities = @{ alwaysMatch = @{ browserName = "webview2"; "ms:edgeOptions" = @{ debuggerAddress = "127.0.0.1:9222" } } } } | ConvertTo-Json -Depth 6
try { "session: " + (Invoke-WebRequest http://127.0.0.1:9515/session -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 60).Content.Substring(0, 200) } catch { "session error: $($_.Exception.Message) $($_.ErrorDetails.Message)" }
Get-Process tambor-de-notas, msedgedriver, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
exit 0
