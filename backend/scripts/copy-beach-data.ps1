# Script to copy beachData.ts from frontend to backend
# Run this before deploying: .\scripts\copy-beach-data.ps1

$ErrorActionPreference = "Stop"

$sourceFile = Join-Path $PSScriptRoot "..\..\next\app\data\beachData.ts"
$destFile = Join-Path $PSScriptRoot "..\src\data\beachData.ts"
$destDir = Split-Path $destFile

Write-Host "Copying beachData.ts..."
Write-Host "  From: $sourceFile"
Write-Host "  To: $destFile"

if (-not (Test-Path $sourceFile)) {
    Write-Error "Source file not found: $sourceFile"
    exit 1
}

# Create destination directory
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

# Read and fix the import
$content = Get-Content $sourceFile -Raw -Encoding UTF8
$content = $content -replace 'import \{ Beach \} from "\.\.\/types\/beaches";', 'import { Beach } from "../types/beaches";'

# Write to destination
Set-Content -Path $destFile -Value $content -Encoding UTF8 -NoNewline

Write-Host "✓ Successfully copied beachData.ts"
Write-Host "  File size: $((Get-Item $destFile).Length) bytes"

