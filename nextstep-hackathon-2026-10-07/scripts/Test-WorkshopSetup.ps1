# Read-only workstation preflight. Does not install, terminate, mutate env, or print secrets.
[CmdletBinding()]
param(
    [switch]$CheckApi,
    [string]$ApiBaseUrl = 'http://localhost:3001'
)

$ErrorActionPreference = 'Stop'
$kitRoot = Split-Path -Parent $PSScriptRoot
$problemFound = $false
Write-Output ('Kit: ' + $kitRoot)

foreach ($toolName in @('node', 'npm.cmd', 'git')) {
    $toolCommand = Get-Command $toolName -ErrorAction SilentlyContinue
    if ($null -eq $toolCommand) {
        Write-Output ('FAIL missing tool: ' + $toolName)
        $problemFound = $true
    } else {
        $toolVersion = & $toolCommand.Source --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Output ('FAIL version command: ' + $toolName)
            $problemFound = $true
        } else {
            Write-Output ('OK ' + $toolName + ': ' + ($toolVersion -join ' '))
        }
    }
}

foreach ($component in @('client', 'server')) {
    $manifestPath = Join-Path $kitRoot ($component + '/package.json')
    if (Test-Path -LiteralPath $manifestPath) {
        try {
            $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
            $requiredScripts = if ($component -eq 'client') { @('dev', 'build', 'preview') } else { @('dev', 'start', 'test') }
            foreach ($scriptName in $requiredScripts) {
                if (!$manifest.scripts -or !$manifest.scripts.PSObject.Properties[$scriptName]) {
                    Write-Output ('FAIL missing ' + $component + ' script: ' + $scriptName)
                    $problemFound = $true
                }
            }
            Write-Output ('FOUND ' + $component + ' package.json; this does not prove dependencies or tests pass.')
        } catch {
            Write-Output ('FAIL cannot parse ' + $component + '/package.json')
            $problemFound = $true
        }
    } else {
        Write-Output ('NOT IMPLEMENTED: ' + $component + '/package.json (expected before scaffold)')
    }
}

foreach ($relativeEnv in @('client/.env.local', 'server/.env')) {
    $envExists = Test-Path -LiteralPath (Join-Path $kitRoot $relativeEnv)
    Write-Output ($relativeEnv + ' exists: ' + $envExists + ' (contents not inspected)')
}

try {
    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort 3001,5173 -ErrorAction SilentlyContinue)
    if ($listeners.Count -gt 0) {
        Write-Output 'Listening ports: identify the process before taking any action.'
        $listeners | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize
    } else {
        Write-Output 'No visible listeners on 3001/5173. Expected before starting the app.'
    }
} catch {
    Write-Output 'Port inventory unavailable. Check the terminal output and browser URL manually.'
}

if ($CheckApi) {
    try {
        $apiUri = [Uri]$ApiBaseUrl
        if (!$apiUri.IsAbsoluteUri -or $apiUri.Scheme -notin @('http','https') -or $apiUri.UserInfo -or $apiUri.Query -or $apiUri.Fragment) {
            throw 'Provide a plain HTTP(S) origin with no credentials, query, or fragment.'
        }
        if ($apiUri.AbsolutePath -ne '/') { throw 'Provide only the API origin, without /api or another path.' }
        $healthUrl = $ApiBaseUrl.TrimEnd('/') + '/api/health'
        $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 15
        if ($health.ok -ne $true -or $health.service -ne 'nextstep-api' -or $health.apiVersion -ne 1) {
            throw 'Health response did not match API v1.'
        }
        Write-Output 'PASS API health shape. Database/auth/persistence remain untested.'
    } catch {
        Write-Output 'FAIL health check. Check the origin, server status, and JSON response in the troubleshooting guide.'
        $problemFound = $true
    }
}

Write-Output 'Read-only preflight complete. No software installed or processes stopped.'
if ($problemFound) { exit 1 } else { exit 0 }
