param(
  [string]$PreviewUrl = 'http://127.0.0.1:5173',
  [string]$PlaywrightModule = 'D:/Projects/Deadline-Catcher/node_modules/playwright'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$previewUri = [uri]$PreviewUrl
if ($previewUri.Host -notin @('127.0.0.1', 'localhost', '[::1]')) {
  throw 'This gate uses synthetic fixtures and must target a loopback preview.'
}
function Invoke-Check {
  param([string]$Label, [string]$Executable, [string[]]$CheckArguments)
  Write-Host "`nCHECK: $Label"
  & $Executable @CheckArguments
  if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit $LASTEXITCODE). Release gate stopped." }
}
Push-Location $projectRoot
try {
  Invoke-Check 'Server regressions' 'npm.cmd' @('--prefix', 'server', 'test')
  Invoke-Check 'Client regressions' 'npm.cmd' @('--prefix', 'client', 'test')
  Invoke-Check 'Production build' 'npm.cmd' @('--prefix', 'client', 'run', 'build')
  Invoke-Check 'Weekly execution and non-destructive replanning' 'node' @('client/scripts/verify-weekly-execution.cjs', $PlaywrightModule, $PreviewUrl)
  Invoke-Check 'Continuation failure-path integration' 'node' @('client/scripts/verify-continuation-integration.cjs', $PlaywrightModule, $PreviewUrl)
  Invoke-Check 'Completed starter to accepted continuation' 'node' @('client/scripts/verify-continuation.cjs', $PlaywrightModule, $PreviewUrl)
  Invoke-Check 'Atlas and Proof regressions' 'node' @('client/scripts/verify-atlas-proof.cjs', $PlaywrightModule, $PreviewUrl)
  Invoke-Check 'State isolation regressions' 'node' @('client/scripts/browser-state-isolation-test.mjs', $PreviewUrl)
  Invoke-Check 'Starter workspace regressions' 'node' @('client/scripts/verify-workspace.cjs', $PlaywrightModule, $PreviewUrl)
  Invoke-Check 'Whitespace validation' 'git' @('-c', 'core.safecrlf=false', 'diff', '--check')
  Write-Host "`nCONTINUATION LOCAL RELEASE GATE: PASS. Production verification and publication are separate."
} finally { Pop-Location }
