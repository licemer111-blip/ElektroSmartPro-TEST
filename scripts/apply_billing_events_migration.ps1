# Apply billing_events migration to TEST + LIVE Supabase projects
# Usage: .\scripts\apply_billing_events_migration.ps1

$SQL = Get-Content "$PSScriptRoot\..\supabase\migrations\20260307_create_billing_events.sql" -Raw

$projects = @(
    @{ id = "upwctgdpuckreoquofiu"; name = "TEST" },
    @{ id = "jbxveulddoznswyeihda"; name = "LIVE" }
)

$token = [System.Net.NetworkCredential]::new("", (Get-StoredCredential -Target "supabase_access_token" -AsCredentialObject).Password).Password

foreach ($proj in $projects) {
    Write-Host "Applying migration to $($proj.name) ($($proj.id))..." -ForegroundColor Cyan
    $body = @{ query = $SQL } | ConvertTo-Json -Depth 5
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    $url = "https://api.supabase.com/v1/projects/$($proj.id)/database/query"
    try {
        Invoke-RestMethod -Method POST -Uri $url -Headers $headers -Body $body | Out-Null
        Write-Host "  OK: $($proj.name)" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: $($proj.name) — $($_.Exception.Message)" -ForegroundColor Red
    }
}
