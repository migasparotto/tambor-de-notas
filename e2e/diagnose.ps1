# TEMPORARY: why the app does not start under the Edge driver on the CI runner.
$exe = (Resolve-Path "src-tauri\target\e2e\debug\tambor-de-notas.exe").Path
function Stop-All {
  Get-Process tambor-de-notas, msedgedriver, tauri-driver, msedgewebview2 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep 3
}
Stop-All
$udf = Join-Path $env:LOCALAPPDATA "com.tambordenotas.app.e2e"
Remove-Item $udf -Recurse -Force -ErrorAction SilentlyContinue
"--- WEBVIEW2 env"; Get-ChildItem Env: | Where-Object Name -match "WEBVIEW2|EDGE" | ForEach-Object { "$($_.Name)=$($_.Value)" }
"--- A: app alone with a debugging port"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9333"
$p = Start-Process $exe -PassThru
Start-Sleep 30
"exited=$($p.HasExited) mainWindow=$($p.MainWindowHandle) title=$($p.MainWindowTitle)"
$browsers = Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'"
"webview2 processes=$(@($browsers).Count)"
$main = $browsers | Where-Object { $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
"browser cmd: $($main.CommandLine)"
$browsers | ForEach-Object { [regex]::Match($_.CommandLine, '--type=[a-z-]+').Value } | Group-Object | ForEach-Object { "$($_.Name) x$($_.Count)" }
"--- listening"
if ($main) { Get-NetTCPConnection -State Listen -OwningProcess $main.ProcessId -ErrorAction SilentlyContinue | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" } }
try { "curl: " + (Invoke-WebRequest http://127.0.0.1:9333/json/version -UseBasicParsing -TimeoutSec 3).Content } catch { "curl failed: $($_.Exception.Message)" }
"--- user data"
Get-ChildItem (Join-Path $udf "EBWebView") -Force -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
Get-ChildItem (Join-Path $udf "EBWebView") -Recurse -Filter "DevToolsActivePort" -ErrorAction SilentlyContinue | ForEach-Object { "port file: $($_.FullName): " + (Get-Content $_.FullName -Raw) }
Get-ChildItem (Join-Path $udf "EBWebView\Crashpad\reports") -ErrorAction SilentlyContinue | ForEach-Object { "crash report: $($_.Name) $($_.Length)" }
"--- debug log tail"
Get-ChildItem $udf -Recurse -Filter "*debug.log" -ErrorAction SilentlyContinue | ForEach-Object { Get-Content $_.FullName -Tail 20 }
"--- desktop"
Add-Type -AssemblyName System.Windows.Forms
"screen=$([Windows.Forms.Screen]::PrimaryScreen.Bounds)"
Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object { "video: $($_.Name) $($_.Status)" }
Stop-All
"--- B: the same with logging and no sandbox of the GPU"
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9334 --disable-gpu --enable-logging --v=0"
$p = Start-Process $exe -PassThru
$open = $false
foreach ($i in 1..10) {
  Start-Sleep 3
  try { Invoke-WebRequest http://127.0.0.1:9334/json/version -UseBasicParsing -TimeoutSec 2 | Out-Null; $open = $true; break } catch {}
}
"port open with --disable-gpu=$open after $($i * 3)s exited=$($p.HasExited)"
Get-ChildItem $udf -Recurse -Filter "*debug.log" -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName; Get-Content $_.FullName -Tail 25 | ForEach-Object { $_.Substring(0, [Math]::Min(220, $_.Length)) } }
Stop-All
exit 0
