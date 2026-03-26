$url = "https://jbxveulddoznswyeihda.supabase.co/rest/v1/catalog_items?select=panel_category,base_material_price,base_labor_price&is_active=eq.true"
$key = $env:SUPABASE_SERVICE_KEY
$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Accept" = "application/json"
}
$r = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 15
$data = $r.Content | ConvertFrom-Json
Write-Host "Total rows from API: $($data.Count)"
$data | Where-Object { $_.panel_category -ne $null } | Group-Object panel_category | Sort-Object Count | ForEach-Object {
    Write-Host "$($_.Name): $($_.Count)"
}
