param(
  [string]$StageDir = 'build\windows-flash-tools',
  [switch]$Json
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$stagedToolDir = Join-Path $repoRoot 'build\windows-flash-tools'
$toolSourceCandidates = @(
  $stagedToolDir,
  (Join-Path $repoRoot 'official-ubertooth-src\host\build-windows\ubertooth-tools\src')
)

$toolSourceDir = $toolSourceCandidates[0]
foreach ($candidate in $toolSourceCandidates) {
  if (Test-Path -LiteralPath $candidate) {
    $toolSourceDir = $candidate
    break
  }
}

$firmwarePath = Join-Path $repoRoot 'official-release\ubertooth-2020-12-R1\ubertooth-one-firmware-bin\bluetooth_rxtx.dfu'
$resolvedStageDir = if ([System.IO.Path]::IsPathRooted($StageDir)) { $StageDir } else { Join-Path $repoRoot $StageDir }

$requiredToolFiles = @(
  'ubertooth-afh.exe',
  'ubertooth-btle.exe',
  'ubertooth-debug.exe',
  'ubertooth-dfu.exe',
  'ubertooth-ducky.exe',
  'ubertooth-dump.exe',
  'ubertooth-ego.exe',
  'ubertooth-follow.exe',
  'ubertooth-rx.exe',
  'ubertooth-scan.exe',
  'ubertooth-specan.exe',
  'ubertooth-tx.exe',
  'ubertooth-util.exe',
  'libusb-1.0.dll',
  'libubertooth.dll',
  'libbtbb.dll'
)

$missingPaths = New-Object System.Collections.Generic.List[string]
foreach ($name in $requiredToolFiles) {
  $candidate = Join-Path $toolSourceDir $name
  if (-not (Test-Path -LiteralPath $candidate)) {
    $missingPaths.Add($candidate)
  }
}
if (-not (Test-Path -LiteralPath $firmwarePath)) {
  $missingPaths.Add($firmwarePath)
}

if ($missingPaths.Count -gt 0) {
  $missingList = ($missingPaths | ForEach-Object { " - $_" }) -join [Environment]::NewLine
  throw "Setup cannot continue because the repo-local official flashing assets are incomplete.`n$missingList`n`nNext steps:`n - Verify the validated Windows build artifacts are present under official-ubertooth-src\\host\\build-windows\\ubertooth-tools\\src`n - Verify the official firmware archive is present under official-release\\ubertooth-2020-12-R1\\ubertooth-one-firmware-bin`n - Re-run this script after those repo-local assets exist`n`nNo drivers, PATH entries, or dependencies were modified."
}

New-Item -ItemType Directory -Force -Path $resolvedStageDir | Out-Null

$stagedToolPaths = [ordered]@{}
foreach ($name in $requiredToolFiles) {
  $sourcePath = Join-Path $toolSourceDir $name
  $targetPath = Join-Path $resolvedStageDir $name
  if ($sourcePath -ne $targetPath) {
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  }
  $stagedToolPaths[$name] = $targetPath
}

$manifest = [ordered]@{
  stageDir = $resolvedStageDir
  toolSourceDir = $toolSourceDir
  firmwarePath = $firmwarePath
  stagedToolPaths = [ordered]@{
    ubertoothDfu = $stagedToolPaths['ubertooth-dfu.exe']
    ubertoothUtil = $stagedToolPaths['ubertooth-util.exe']
    libusb = $stagedToolPaths['libusb-1.0.dll']
    libubertooth = $stagedToolPaths['libubertooth.dll']
    libbtbb = $stagedToolPaths['libbtbb.dll']
  }
  manualSteps = @(
    'This script did not install drivers, modify PATH, download dependencies, or make machine-wide changes.',
    'Before native flashing, manually bind usb_bootloader (VID_1D50&PID_6003) to WinUSB if Windows has not already done so.',
    ("Use the staged DFU tool with: npm run flash -- --file '{0}' --tool '{1}' --yes" -f $firmwarePath, $stagedToolPaths['ubertooth-dfu.exe']),
    ("If recovery is needed, run: & '{0}' -r" -f $stagedToolPaths['ubertooth-util.exe']),
    'Re-run npm run version and npm run status after flashing to confirm the device is healthy.'
  )
}

$manifestPath = Join-Path $resolvedStageDir 'setup-manifest.json'
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

if ($Json) {
  $manifest | ConvertTo-Json -Depth 6
  exit 0
}

Write-Host 'Ubertooth Windows flash setup is staged.'
Write-Host ''
Write-Host ('Stage directory: {0}' -f $resolvedStageDir)
Write-Host ('Firmware image:  {0}' -f $firmwarePath)
Write-Host ('DFU tool:        {0}' -f $stagedToolPaths['ubertooth-dfu.exe'])
Write-Host ('Recovery tool:   {0}' -f $stagedToolPaths['ubertooth-util.exe'])
Write-Host ('Manifest:        {0}' -f $manifestPath)
Write-Host ''
Write-Host 'Safety boundary:'
Write-Host ' - No automatic driver installation'
Write-Host ' - No PATH changes'
Write-Host ' - No dependency downloads/builds'
Write-Host ' - No hidden admin-wide mutation'
Write-Host ''
Write-Host 'Manual next steps:'
foreach ($step in $manifest.manualSteps) {
  Write-Host (' - {0}' -f $step)
}
