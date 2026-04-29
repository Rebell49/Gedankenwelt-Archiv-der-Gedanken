<#
.SYNOPSIS
Creates a ready-to-use Windows archive for the Gedankenwelt project.

.DESCRIPTION
This script copies the repository into a temporary build folder, installs backend and frontend dependencies,
builds the frontend bundle, and creates a single ZIP archive at the destination path.

.PARAMETER Destination
Optional destination folder or archive path. If omitted, a folder picker is shown.

.PARAMETER Source
Optional repository source root. Defaults to the folder containing this script.

.PARAMETER SkipDependencies
If set, the script skips npm install and frontend build steps.
#>

[CmdletBinding()]
param(
    [string]$Destination,
    [string]$Source,
    [switch]$SkipDependencies,
    [switch]$Verbose
)

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function Write-ErrorAndExit {
    param([string]$Message)
    Write-Error "[ERROR] $Message"
    exit 1
}

function Get-FolderFromPicker {
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Select the destination folder for the Gedankenwelt archive'
    $dialog.ShowNewFolderButton = $true

    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $null
}

function Validate-Command {
    param([string]$CommandName)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Write-ErrorAndExit "Required command '$CommandName' is not available in PATH. Install it before running this script."
    }
}

function Copy-Project {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [string[]]$ExcludePatterns
    )

    $items = Get-ChildItem -Path $SourcePath -Force -Recurse
    foreach ($item in $items) {
        $relativePath = $item.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
        $skip = $false

        foreach ($pattern in $ExcludePatterns) {
            if ($relativePath -like $pattern) {
                $skip = $true
                break
            }
        }

        if ($skip) { continue }

        $destination = Join-Path $TargetPath $relativePath
        if ($item.PSIsContainer) {
            if (-not (Test-Path $destination)) {
                New-Item -ItemType Directory -Path $destination | Out-Null
            }
        } else {
            $folder = Split-Path $destination -Parent
            if (-not (Test-Path $folder)) {
                New-Item -ItemType Directory -Path $folder | Out-Null
            }
            Copy-Item -Path $item.FullName -Destination $destination -Force
        }
    }
}

$scriptRoot = Split-Path -Parent $PSCommandPath
$sourceRoot = if ($Source) { Resolve-Path -Path $Source | Select-Object -ExpandProperty Path } else { $scriptRoot }
if (-not (Test-Path $sourceRoot)) {
    Write-ErrorAndExit "Source path '$sourceRoot' does not exist."
}

if (-not $Destination) {
    Write-Info 'No destination path provided. Opening folder picker...'
    $destinationFolder = Get-FolderFromPicker
    if (-not $destinationFolder) {
        Write-ErrorAndExit 'No destination folder selected.'
    }
    $Destination = Join-Path $destinationFolder "Gedankenwelt-Ready.zip"
} elseif (Test-Path $Destination -PathType Container) {
    $Destination = Join-Path (Resolve-Path -Path $Destination | Select-Object -ExpandProperty Path) "Gedankenwelt-Ready.zip"
} else {
    $destinationFolder = Split-Path -Parent $Destination
    if (-not (Test-Path $destinationFolder)) {
        New-Item -ItemType Directory -Path $destinationFolder | Out-Null
    }
}

if (Test-Path $Destination) {
    Write-Host "Archive already exists at '$Destination'. Overwriting..."
    Remove-Item -Path $Destination -Force
}

$buildRoot = Join-Path $env:TEMP "gedankenwelt-package-$([guid]::NewGuid())"
New-Item -ItemType Directory -Path $buildRoot | Out-Null

$excludePatterns = @(
    '*\.git*',
    '*node_modules*',
    '*dist*',
    '*build*',
    '*.log',
    '*.tmp',
    '*.cache',
    '*.DS_Store',
    '*Thumbs.db*'
)

Write-Info "Copying repository files from '$sourceRoot' to temporary build folder..."
Copy-Project -SourcePath $sourceRoot -TargetPath $buildRoot -ExcludePatterns $excludePatterns

$backendDir = Join-Path $buildRoot 'Codebase/backend/backend'
$frontendDir = Join-Path $buildRoot 'Codebase/backend/frontend'

if (-not $SkipDependencies) {
    Validate-Command node
    Validate-Command npm

    if (-not (Test-Path $backendDir)) {
        Write-ErrorAndExit "Backend folder not found at '$backendDir'."
    }
    if (-not (Test-Path $frontendDir)) {
        Write-ErrorAndExit "Frontend folder not found at '$frontendDir'."
    }

    Push-Location $backendDir
    Write-Info 'Installing backend dependencies...'
    npm install --no-audit --no-fund | Out-Null
    Pop-Location

    Push-Location $frontendDir
    Write-Info 'Installing frontend dependencies...'
    npm install --no-audit --no-fund | Out-Null
    Write-Info 'Building the frontend bundle...'
    npm run build | Out-Null
    Pop-Location
}

$runScriptPath = Join-Path $buildRoot 'run-local.bat'
$runScriptContent = @"
@echo off
cls
echo Starting Gedankenwelt backend and frontend...
cd /d "%~dp0\Codebase\backend\backend"
start "Gedankenwelt Backend" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
cd /d "%~dp0\Codebase\backend\frontend"
start "Gedankenwelt Frontend" cmd /k "npm run dev"
echo Backend and frontend launch commands sent.
"@
Set-Content -Path $runScriptPath -Value $runScriptContent -Encoding ASCII

$usagePath = Join-Path $buildRoot 'README-WINDOWS-PACKAGE.txt'
$usageText = @"
Gedankenwelt Windows Package
============================

The archive contains the repository source plus installed project dependencies and the built frontend bundle.

How to use:
1. Extract the archive at your chosen location.
2. Edit the following files with your actual secrets and URLs:
   - Codebase/backend/backend/.env
   - Codebase/backend/frontend/.env
3. Open a PowerShell or Command Prompt and run:
   run-local.bat

Required runtimes:
- Node.js 18+ and npm 9+
- PostgreSQL 14+ (or Docker)
- OpenAI API key for backend moderation

If your actual environment differs, use the repository README for Docker and production setup.
"@
Set-Content -Path $usagePath -Value $usageText -Encoding UTF8

Write-Info "Creating ZIP archive at '$Destination'..."
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
    [System.IO.Compression.ZipFile]::CreateFromDirectory($buildRoot, $Destination, [System.IO.Compression.CompressionLevel]::Optimal, $false)
} catch {
    Write-Info 'Falling back to Compress-Archive...'
    Compress-Archive -Path (Join-Path $buildRoot '*') -DestinationPath $Destination -Force
}

Write-Info 'Cleaning up temporary build files...'
Remove-Item -Path $buildRoot -Recurse -Force

Write-Host "`nSuccess! The Gedankenwelt archive is ready at:`n$Destination"
Write-Host 'Open the archive and extract it to your chosen location. Then update .env files before running.'
