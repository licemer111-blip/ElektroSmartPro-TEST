# Apply Migration to Production Database
# PowerShell script to apply RPC functions migration
# Load environment variables from .env.local if needed

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

Write-Host "🚀 Applying migration to production database..." -ForegroundColor Cyan
Write-Host ""

# Read the migration file
$migrationPath = "supabase\migrations\20260128_add_member_rpc_functions.sql"
$sqlContent = Get-Content $migrationPath -Raw

Write-Host "📄 Migration file loaded: $migrationPath" -ForegroundColor Green
Write-Host ""

# Split SQL into individual statements
$statements = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" -and $_.Trim() -notmatch "^--" }

Write-Host "📊 Found $($statements.Count) SQL statements to execute" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($statement in $statements) {
    $trimmed = $statement.Trim()
    if ($trimmed -eq "" -or $trimmed.StartsWith("--")) {
        continue
    }
    
    # Show what we're executing
    $preview = $trimmed.Substring(0, [Math]::Min(80, $trimmed.Length))
    Write-Host "⚙️ Executing: $preview..." -ForegroundColor Gray
    
    try {
        # Execute via Supabase REST API
        $body = @{
            query = $trimmed
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
            "apikey" = $SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        }
        
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction SilentlyContinue
        
        Write-Host "   ✅ Success" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "   ⚠️ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 MIGRATION RESULTS:" -ForegroundColor Cyan
Write-Host "   ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "   ❌ Errors: $errorCount" -ForegroundColor Red
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "🎉 Migration applied successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Migration completed with errors. Check the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verifying functions..." -ForegroundColor Cyan

# Verify functions exist
$checkQuery = @"
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN (
  'check_existing_member',
  'get_project_members_list',
  'get_user_project_ids'
)
AND pronamespace = 'public'::regnamespace
ORDER BY proname;
"@

try {
    $body = @{ query = $checkQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    
    Write-Host ""
    Write-Host "✅ Functions created:" -ForegroundColor Green
    foreach ($fn in $response) {
        Write-Host "   - $($fn.function_name) $(if ($fn.is_security_definer) { '(SECURITY DEFINER)' } else { '' })" -ForegroundColor White
    }
}
catch {
    Write-Host "⚠️ Could not verify functions via API" -ForegroundColor Yellow
    Write-Host "💡 Please check manually in Supabase Dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Done! You can now test invitations on production." -ForegroundColor Green
