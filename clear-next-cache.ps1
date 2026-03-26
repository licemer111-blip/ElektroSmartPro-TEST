# Clear Next.js cache and restart dev server
# Run: .\clear-next-cache.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (Test-Path .next) {
  Remove-Item -Recurse -Force .next
  Write-Host "Removed .next folder"
}
Write-Host "Starting dev server..."
npm run dev
