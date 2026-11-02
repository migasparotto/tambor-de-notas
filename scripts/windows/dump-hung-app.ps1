# Keeps the evidence of an app that hangs instead of crashing: its state and a full dump of the
# still running process (with the matching .pdb, the dump shows where each thread is stuck).
# Used by the e2e tests when the app opens but never answers (e2e/system.mjs); also works on the
# installed app:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\dump-hung-app.ps1 -ExePath <exe> -Folder <pasta>
# Runs on Windows PowerShell 5.1. It only reads the process: it does not stop it.
param(
  [Parameter(Mandatory = $true)][string]$ExePath,
  [Parameter(Mandatory = $true)][string]$Folder
)

$ErrorActionPreference = "Continue"
New-Item -ItemType Directory -Path $Folder -Force | Out-Null
$state = Join-Path $Folder "app-travado.txt"
$processes = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $ExePath })
$webviews = @(Get-Process msedgewebview2 -ErrorAction SilentlyContinue)
"Estado em $(Get-Date -Format s) de $ExePath" | Out-File $state -Encoding UTF8
"Processos do app vivos: $($processes.Count); processos do WebView2: $($webviews.Count)" | Out-File $state -Append -Encoding UTF8
$processes | Format-List Id, StartTime, TotalProcessorTime, Responding, MainWindowTitle, Threads, HandleCount, WorkingSet64 |
  Out-File $state -Append -Encoding UTF8 -Width 400

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;
public static class HungDump {
  [DllImport("dbghelp.dll", SetLastError = true)]
  static extern bool MiniDumpWriteDump(IntPtr process, int processId, IntPtr file, int type,
    IntPtr exception, IntPtr userStream, IntPtr callback);
  // 2 = MiniDumpWithFullMemory, the same kind Windows writes for a crash (LocalDumps DumpType 2).
  public static bool Write(System.Diagnostics.Process process, string path) {
    using (var file = new FileStream(path, FileMode.Create)) {
      return MiniDumpWriteDump(process.Handle, process.Id, file.SafeFileHandle.DangerousGetHandle(), 2,
        IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
    }
  }
}
"@

foreach ($process in $processes) {
  $dump = Join-Path $Folder "app-travado-$($process.Id).dmp"
  try {
    $ok = [HungDump]::Write($process, $dump)
    "Dump do processo $($process.Id): $(if ($ok) { $dump } else { 'falhou (erro ' + [Runtime.InteropServices.Marshal]::GetLastWin32Error() + ')' })" |
      Out-File $state -Append -Encoding UTF8
  } catch {
    "Não consegui gravar o dump do processo $($process.Id): $($_.Exception.Message)" | Out-File $state -Append -Encoding UTF8
  }
}
