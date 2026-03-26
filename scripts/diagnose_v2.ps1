Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCredDiag2 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public UInt32 Flags; public UInt32 Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize; public IntPtr CredentialBlob; public UInt32 Persist;
        public UInt32 AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
    }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, UInt32 type, Int32 flags, out IntPtr credPtr);
    [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
    public static string GetPassword(string target) {
        IntPtr ptr = IntPtr.Zero;
        if (!CredRead(target, 1, 0, out ptr)) return null;
        var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
        byte[] bytes = new byte[cred.CredentialBlobSize];
        Marshal.Copy(cred.CredentialBlob, bytes, 0, (int)cred.CredentialBlobSize);
        CredFree(ptr);
        string r = Encoding.Unicode.GetString(bytes).TrimEnd('\0');
        bool isAscii = true;
        foreach (char c in r) { if (c > 127) { isAscii = false; break; } }
        if (!isAscii) r = Encoding.UTF8.GetString(bytes).TrimEnd('\0');
        return r;
    }
}
'@

$token = [WinCredDiag2]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: no token"; exit 1 }

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$ser.MaxJsonLength = 10000000

function SQL([string]$ref, [string]$sql) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($ser.Serialize(@{ query = $sql }))
    $req = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ref/database/query")
    $req.Method = "POST"; $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length; $req.Timeout = 60000
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try { return (New-Object System.IO.StreamReader($req.GetResponse().GetResponseStream())).ReadToEnd() }
    catch [System.Net.WebException] { return "ERR:" + (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
}

$T = "upwctgdpuckreoquofiu"
$L = "jbxveulddoznswyeihda"

# Helper: normalizacja po stronie PowerShell (ta sama logika co normalize_text w DB)
function NormPL([string]$s) {
    $s = $s.ToLower()
    $map = @{'a'='a';'c'='c';'e'='e';'l'='l';'n'='n';'o'='o';'s'='s';'z'='z';'Z'='z'}
    # Polish diacritics
    $s = $s -replace 'a','a' -replace 'c','c' -replace 'e','e' -replace 'l','l' -replace 'n','n' -replace 'o','o' -replace 's','s' -replace 'z','z' -replace 'z','z'
    $s = $s -replace 'a','a' -replace 'c','c' -replace 'e','e' -replace 'l','l' -replace 'n','n' -replace 'o','o' -replace 's','s' -replace 'z','z' -replace 'z','z'
    $s = $s -replace '\s+', ' '
    return $s.Trim()
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ES-ENGINE DIAGNOZA v2 — FULL SYSTEM CHECK" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ===== BLOK 1: Synchronizacja TEST <-> LIVE =====
Write-Host "`n[1] SYNCHRONIZACJA TEST vs LIVE" -ForegroundColor Yellow
$cnt = "SELECT COUNT(*) as n FROM es_dictionary WHERE user_id IS NULL"
$nt = ($ser.DeserializeObject($(SQL $T $cnt)))[0]['n']
$nl = ($ser.DeserializeObject($(SQL $L $cnt)))[0]['n']
if ($nt -eq $nl) {
    Write-Host "  [OK] TEST=$nt = LIVE=$nl — SYNCHRONIZED" -ForegroundColor Green
} else {
    Write-Host "  [!!] ROZNICA: TEST=$nt vs LIVE=$nl" -ForegroundColor Red
}

# ===== BLOK 2: Kategorie =====
Write-Host "`n[2] KATEGORIE w bazie (TEST)" -ForegroundColor Yellow
$cats = $ser.DeserializeObject($(SQL $T "SELECT category, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY category ORDER BY cnt DESC"))
$totalCat = 0
foreach ($c in $cats) {
    $bar = "#" * [Math]::Min([int]($c['cnt'] / 50), 40)
    Write-Host ("  {0,-28} {1,5}  {2}" -f $c['category'], $c['cnt'], $bar)
    $totalCat += $c['cnt']
}
Write-Host ("  {0,-28} {1,5}" -f "TOTAL", $totalCat) -ForegroundColor White

# ===== BLOK 3: RPC Functions =====
Write-Host "`n[3] RPC FUNCTIONS (silnik matchowania)" -ForegroundColor Yellow
$rpcQ = "SELECT proname, pronargs FROM pg_proc WHERE proname IN ('es_dictionary_fuzzy_match','es_dictionary_token_match','normalize_text') ORDER BY proname"
$rpcs = $ser.DeserializeObject($(SQL $T $rpcQ))
$rpcNames = @("es_dictionary_fuzzy_match","es_dictionary_token_match","normalize_text")
foreach ($fn in $rpcNames) {
    $found = $rpcs | Where-Object { $_['proname'] -eq $fn }
    if ($found) { Write-Host "  [OK] $fn (args=$($found['pronargs']))" -ForegroundColor Green }
    else        { Write-Host "  [!!] $fn MISSING — matching engine broke!" -ForegroundColor Red }
}

# ===== BLOK 4: Indeksy =====
Write-Host "`n[4] INDEKSY na tabeli es_dictionary" -ForegroundColor Yellow
$idxQ = "SELECT indexname, indexdef FROM pg_indexes WHERE tablename='es_dictionary' ORDER BY indexname"
$idxs = $ser.DeserializeObject($(SQL $T $idxQ))
foreach ($i in $idxs) {
    $def = $i['indexdef']
    $isGin = $def -match "gin"
    $icon = if ($isGin) { "[GIN]" } else { "[idx]" }
    Write-Host ("  $icon {0}" -f $i['indexname'])
}

# ===== BLOK 5: Phase 1 — Exact match przez keyword LIKE =====
Write-Host "`n[5] PHASE 1 — Exact Match (kluczowe frazy)" -ForegroundColor Yellow
# Uzywamy keyword (bez normalizacji) bo normalize_text() nie dziala przez API
$phrases = @(
    @{kw="kabel nhxh e90";        exp="KNR 5-09"},
    @{kw="falownik trojfazowy 20kw"; exp="KNR 5-04 1603"},
    @{kw="wallbox 11kw 3f montaz";  exp="KNR 5-04 1610"},
    @{kw="czujnik pir podtynkowy";  exp="KNR 5-04 0502"},
    @{kw="gniazdo 230v beton";      exp="KNR 5-04 0201"},
    @{kw="wylacznik krzyzowy gk";   exp="KNR 5-04 0202"},
    @{kw="multiswitch 5x8";         exp="KNR 5-09 0903"},
    @{kw="talerz satelitarny 80cm"; exp="KNR 5-09 0902"},
    @{kw="bateria kondensatorow 100kvar"; exp="KNR 5-08 0901"},
    @{kw="szr do 630a";             exp="KNR 5-08 1002"},
    @{kw="pomiar petli zwarcia";    exp="KNR 5-04 1001"},
    @{kw="agregat diesel 100kva";   exp="KNR 5-08 1001"},
    @{kw="bramka dali ethernet";    exp="KNR 5-04 0403"},
    @{kw="oprawa uliczna led 100w"; exp="KNR 5-04 1802"},
    @{kw="instalacja pv 1kwp dach skosny"; exp="KNR 5-04 1608"},
    @{kw="montaz rb tki budowlanej"; exp="KNR 5-04 1201"},
    @{kw="centrala ssp polon alfa"; exp="KNR 5-09 0601"},
    @{kw="szafa rack 42u";          exp="KNR 5-09 0101"},
    @{kw="ups 20kva 3f";            exp="KNR 5-08 1003"},
    @{kw="filtr aktywny harmonicznych"; exp="KNR 5-08 0905"}
)
$ok = 0; $miss = 0
foreach ($p in $phrases) {
    $kwEsc = $p.kw.Replace("'","''")
    $q = "SELECT keyword, knr_ref, labor_norm_rbh, unit FROM es_dictionary WHERE keyword = '$kwEsc' AND user_id IS NULL LIMIT 1"
    $r = SQL $T $q
    if ($r -match '"keyword"') {
        $obj = $ser.DeserializeObject($r)
        if ($obj -and $obj.Count -gt 0) {
            $knr = $obj[0]['knr_ref']
            $rbh = $obj[0]['labor_norm_rbh']
            $unit = $obj[0]['unit']
            Write-Host ("  [OK] '{0}' -> {1}  rbh={2}/{3}" -f $p.kw, $knr, $rbh, $unit) -ForegroundColor Green
            $ok++
            continue
        }
    }
    Write-Host ("  [--] '{0}' -> NOT FOUND by keyword" -f $p.kw) -ForegroundColor Yellow
    $miss++
}
Write-Host ("  Wynik Phase 1: $ok OK / $miss MISS z $($phrases.Count)") -ForegroundColor White

# ===== BLOK 6: Synonimy — sprawdzenie =====
Write-Host "`n[6] SYNONIMY — sprawdzenie coverage" -ForegroundColor Yellow
$synTests = @(
    "NHXH E90",
    "smoke detector",
    "boom barrier",
    "heat pump 3-phase connection",
    "GSU",
    "ATS 630A",
    "disk 80cm",
    "DVB-T2 antena",
    "power factor controller",
    "LED strip outdoor IP65"
)
$synOk = 0; $synMiss = 0
foreach ($syn in $synTests) {
    $synEsc = $syn.Replace("'","''")
    $q = "SELECT keyword, knr_ref FROM es_dictionary WHERE lower(keyword) = lower('$synEsc') AND user_id IS NULL LIMIT 1"
    $r = SQL $T $q
    if ($r -match '"keyword"') {
        $obj = $ser.DeserializeObject($r)
        if ($obj -and $obj.Count -gt 0) {
            Write-Host ("  [OK] syn='{0}' -> '{1}'" -f $syn, $obj[0]['knr_ref']) -ForegroundColor Green
            $synOk++; continue
        }
    }
    Write-Host ("  [--] syn='{0}' -> nie znaleziono" -f $syn) -ForegroundColor Yellow
    $synMiss++
}
Write-Host ("  Synonimy: $synOk OK / $synMiss MISS z $($synTests.Count)") -ForegroundColor White

# ===== BLOK 7: RBH rozkladki =====
Write-Host "`n[7] NORMY RBH — statystyki per kategoria" -ForegroundColor Yellow
$rbhQ = @"
SELECT category,
  ROUND(AVG(labor_norm_rbh)::numeric,3) as avg_rbh,
  ROUND(MIN(labor_norm_rbh)::numeric,3) as min_rbh,
  ROUND(MAX(labor_norm_rbh)::numeric,3) as max_rbh,
  COUNT(*) as cnt
FROM es_dictionary
WHERE user_id IS NULL AND labor_norm_rbh > 0
GROUP BY category ORDER BY avg_rbh DESC
"@
$rbh = $ser.DeserializeObject($(SQL $T $rbhQ))
Write-Host ("  {0,-28}{1,9}{2,9}{3,9}{4,7}" -f "Kategoria","avg rbh","min rbh","max rbh","count")
Write-Host ("  " + "-"*64)
foreach ($row in $rbh) {
    Write-Host ("  {0,-28}{1,9}{2,9}{3,9}{4,7}" -f $row['category'],$row['avg_rbh'],$row['min_rbh'],$row['max_rbh'],$row['cnt'])
}

# ===== BLOK 8: Duplikaty =====
Write-Host "`n[8] DUPLIKATY keyword_normalized (system entries)" -ForegroundColor Yellow
$dupQ = "SELECT keyword_normalized, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY keyword_normalized HAVING COUNT(*)>1 ORDER BY cnt DESC LIMIT 10"
$dups = $ser.DeserializeObject($(SQL $T $dupQ))
if ($dups.Count -eq 0) {
    Write-Host "  [OK] Brak duplikatow — normalizacja dziala prawidlowo" -ForegroundColor Green
} else {
    Write-Host "  [!!] $($dups.Count) zduplikowanych normalized kluczy:" -ForegroundColor Yellow
    foreach ($d in $dups) { Write-Host ("    '{0}' x{1}" -f $d['keyword_normalized'], $d['cnt']) }
}

# ===== BLOK 9: Wersje seed migration =====
Write-Host "`n[9] MIGRACJE SEED w historii" -ForegroundColor Yellow
$migQ = "SELECT name, executed_at FROM supabase_migrations.schema_migrations WHERE name LIKE '%seed_es%' ORDER BY executed_at"
$migs = SQL $T $migQ
if ($migs -notmatch "ERR") {
    $migObj = $ser.DeserializeObject($migs)
    foreach ($m in $migObj) { Write-Host ("  [OK] {0} @ {1}" -f $m['name'], $m['executed_at']) -ForegroundColor Green }
} else {
    # Sprawdz przez inny schemat
    $migQ2 = "SELECT name FROM _realtime.schema_migrations LIMIT 1"
    Write-Host "  (sprawdzam liczbe wpisow per seed bezposrednio)" -ForegroundColor Gray
    # Pokaz kto kiedy zostal wstawiony na podstawie knr_ref prefix
    $vQ = "SELECT LEFT(knr_ref,10) as knr_prefix, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY LEFT(knr_ref,10) ORDER BY cnt DESC LIMIT 15"
    $vR = $ser.DeserializeObject($(SQL $T $vQ))
    foreach ($v in $vR) { Write-Host ("  {0,-15} {1} wpisow" -f $v['knr_prefix'], $v['cnt']) }
}

# ===== BLOK 10: Sprawdzenie uW nowych kategorii =====
Write-Host "`n[10] NOWE KATEGORIE (v6-v10)" -ForegroundColor Yellow
$newCats = @("pv_ev","pomiary","uziemienie","demontaz","zestawy","prace_dodatkowe")
foreach ($nc in $newCats) {
    $cntQ = "SELECT COUNT(*) as n FROM es_dictionary WHERE category='$nc' AND user_id IS NULL"
    $n = ($ser.DeserializeObject($(SQL $T $cntQ)))[0]['n']
    $icon = if ($n -gt 0) { "[OK]" } else { "[!!]" }
    $col  = if ($n -gt 0) { "Green" } else { "Red" }
    Write-Host ("  $icon kategoria '$nc' = $n wpisow") -ForegroundColor $col
}

# ===== BLOK 11: Top 10 fraz po RBH (najdrozsze roboty) =====
Write-Host "`n[11] TOP 10 najdrozszych robót (max RBH)" -ForegroundColor Yellow
$topQ = "SELECT keyword, category, labor_norm_rbh, unit FROM es_dictionary WHERE user_id IS NULL AND labor_norm_rbh IS NOT NULL ORDER BY labor_norm_rbh DESC LIMIT 10"
$tops = $ser.DeserializeObject($(SQL $T $topQ))
foreach ($t in $tops) {
    Write-Host ("  {0,6} rbh/{1,-6}  [{2,-20}]  {3}" -f $t['labor_norm_rbh'],$t['unit'],$t['category'],$t['keyword'])
}

# ===== SUMMARY =====
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " PODSUMOWANIE DIAGNOZY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " TEST entries: $nt" -ForegroundColor White
Write-Host " LIVE entries: $nl" -ForegroundColor White
Write-Host " Sync: $(if ($nt -eq $nl) { 'OK' } else { 'ROZNICA!' })" -ForegroundColor $(if ($nt -eq $nl) { "Green" } else { "Red" })
Write-Host " Phase 1 coverage: $ok/$($phrases.Count) kluczowych fraz" -ForegroundColor White
Write-Host " Synonimy coverage: $synOk/$($synTests.Count) testow" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan
