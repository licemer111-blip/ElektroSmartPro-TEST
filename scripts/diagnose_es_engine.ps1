Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCredDiag {
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

$token = [WinCredDiag]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: no token"; exit 1 }
Write-Host "Token OK: $($token.Substring(0,20))..." -ForegroundColor Green

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$ser.MaxJsonLength = 10000000

function RunSQL([string]$ref, [string]$sql) {
    $payload = $ser.Serialize(@{ query = $sql })
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $req = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ref/database/query")
    $req.Method = "POST"; $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length; $req.Timeout = 60000
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try {
        return (New-Object System.IO.StreamReader($req.GetResponse().GetResponseStream())).ReadToEnd()
    } catch [System.Net.WebException] {
        return "ERR: " + (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
    }
}

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"

# ---- BLOK 1: Liczniki ----
Write-Host "`n===== BLOK 1: Liczniki (TEST vs LIVE) =====" -ForegroundColor Cyan
$q = "SELECT COUNT(*) FILTER (WHERE user_id IS NULL) AS system_entries, COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS user_entries, COUNT(*) AS total FROM es_dictionary"
$rt = $ser.DeserializeObject($(RunSQL $TEST $q))
$rl = $ser.DeserializeObject($(RunSQL $LIVE $q))
Write-Host ("TEST  -> system={0}  user={1}  total={2}" -f $rt[0]['system_entries'], $rt[0]['user_entries'], $rt[0]['total']) -ForegroundColor White
Write-Host ("LIVE  -> system={0}  user={1}  total={2}" -f $rl[0]['system_entries'], $rl[0]['user_entries'], $rl[0]['total']) -ForegroundColor White
if ($rt[0]['total'] -eq $rl[0]['total']) {
    Write-Host "  [OK] TEST == LIVE (synchronizacja OK)" -ForegroundColor Green
} else {
    Write-Host "  [!!] ROZNICA! TEST=$($rt[0]['total']) LIVE=$($rl[0]['total'])" -ForegroundColor Red
}

# ---- BLOK 2: Kategorie ----
Write-Host "`n===== BLOK 2: Kategorie w bazie (TEST) =====" -ForegroundColor Cyan
$q2 = "SELECT category, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY category ORDER BY cnt DESC"
$cats = $ser.DeserializeObject($(RunSQL $TEST $q2))
foreach ($c in $cats) {
    Write-Host ("  {0,-30} {1}" -f $c['category'], $c['cnt'])
}

# ---- BLOK 3: RPC Functions ----
Write-Host "`n===== BLOK 3: RPC Functions (silnik matchowania) =====" -ForegroundColor Cyan
$rpcs = @("es_dictionary_fuzzy_match", "es_dictionary_token_match", "normalize_text")
foreach ($fn in $rpcs) {
    $q3 = "SELECT COUNT(*) as cnt FROM pg_proc WHERE proname = '$fn'"
    $r3 = $ser.DeserializeObject($(RunSQL $TEST $q3))
    if ($r3[0]['cnt'] -gt 0) {
        Write-Host "  [OK] $fn -> exists" -ForegroundColor Green
    } else {
        Write-Host "  [!!] $fn -> MISSING!" -ForegroundColor Red
    }
}

# ---- BLOK 4: Indeksy GIN ----
Write-Host "`n===== BLOK 4: Indeksy GIN (trigram) =====" -ForegroundColor Cyan
$q4 = "SELECT indexname FROM pg_indexes WHERE tablename = 'es_dictionary' ORDER BY indexname"
$idxs = $ser.DeserializeObject($(RunSQL $TEST $q4))
foreach ($i in $idxs) {
    Write-Host "  $($i['indexname'])"
}

# ---- BLOK 5: Duplikaty ----
Write-Host "`n===== BLOK 5: Duplikaty keyword_normalized =====" -ForegroundColor Cyan
$q5 = "SELECT keyword_normalized, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY keyword_normalized HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 10"
$dups = $ser.DeserializeObject($(RunSQL $TEST $q5))
if ($dups.Count -eq 0) {
    Write-Host "  [OK] Brak duplikatow w systemowych wpisach" -ForegroundColor Green
} else {
    Write-Host "  [!!] Znaleziono $($dups.Count) duplikatow (top 10):" -ForegroundColor Yellow
    foreach ($d in $dups) {
        Write-Host ("    '{0}' x{1}" -f $d['keyword_normalized'], $d['cnt'])
    }
}

# ---- BLOK 6: Kluczowe frazy - Phase 1 Exact Match ----
Write-Host "`n===== BLOK 6: Kluczowe frazy - Phase 1 Exact Match =====" -ForegroundColor Cyan
$phrases = @(
    "kabel nhxh e90",
    "falownik trojfazowy 20kw",
    "wallbox 11kw 3f montaz",
    "czujnik pir podtynkowy",
    "gniazdo 230v beton",
    "wylacznik krzyzowy gk",
    "multiswitch 5x8",
    "talerz satelitarny 80cm",
    "bateria kondensatorow 100kvar",
    "szr do 630a",
    "pomiar petli zwarcia",
    "agregat diesel 100kva",
    "dali gateway",
    "oprawa uliczna led 100w",
    "instalacja pv 1kwp dach skosny",
    "rb tki budowlanej",
    "centrala ssp polon alfa",
    "szafa rack 42u",
    "ups 20kva 3f",
    "filtr aktywny harmonicznych"
)
$ok = 0; $miss = 0
foreach ($ph in $phrases) {
    $q6 = "SELECT keyword, knr_ref, labor_norm_rbh, unit, category FROM es_dictionary WHERE keyword_normalized = normalize_text('$ph') AND user_id IS NULL LIMIT 1"
    $r6 = $ser.DeserializeObject($(RunSQL $TEST $q6))
    if ($r6 -and $r6.Count -gt 0) {
        Write-Host ("  [OK] '{0}' -> knr={1}  rbh={2} {3}  cat={4}" -f $ph, $r6[0]['knr_ref'], $r6[0]['labor_norm_rbh'], $r6[0]['unit'], $r6[0]['category']) -ForegroundColor Green
        $ok++
    } else {
        Write-Host ("  [--] '{0}' -> Phase 1 MISS (trigram fallback)" -f $ph) -ForegroundColor Yellow
        $miss++
    }
}
Write-Host ("  Wynik: {0} OK / {1} MISS z {2} testow" -f $ok, $miss, $phrases.Count) -ForegroundColor White

# ---- BLOK 7: Fuzzy Match test ----
Write-Host "`n===== BLOK 7: Fuzzy Match (Phase 2) =====" -ForegroundColor Cyan
$fuzzyTests = @(
    "kabel nhxh ognioodporny",
    "talerz sat montaz",
    "agregat pradotworcza",
    "pomiar iso instalacji"
)
foreach ($ft in $fuzzyTests) {
    $q7 = "SELECT keyword, similarity, labor_norm_rbh FROM es_dictionary_fuzzy_match('$ft', 0.25) LIMIT 1"
    $r7 = $ser.DeserializeObject($(RunSQL $TEST $q7))
    if ($r7 -and $r7.Count -gt 0) {
        Write-Host ("  [OK] '{0}' ~> '{1}' sim={2} rbh={3}" -f $ft, $r7[0]['keyword'], $r7[0]['similarity'], $r7[0]['labor_norm_rbh']) -ForegroundColor Green
    } else {
        Write-Host ("  [--] '{0}' -> fuzzy no result" -f $ft) -ForegroundColor Yellow
    }
}

# ---- BLOK 8: Token Match test ----
Write-Host "`n===== BLOK 8: Token Match (Phase 2B) =====" -ForegroundColor Cyan
$tokenTests = @(
    "montaz rozdzielnicy budowlanej",
    "LED uliczna 100W montaz",
    "kompensacja mocy reaktywnej"
)
foreach ($tt in $tokenTests) {
    $q8 = "SELECT keyword, score, labor_norm_rbh FROM es_dictionary_token_match('$tt') LIMIT 1"
    $r8 = $ser.DeserializeObject($(RunSQL $TEST $q8))
    if ($r8 -and $r8.Count -gt 0) {
        Write-Host ("  [OK] '{0}' ~> '{1}' score={2} rbh={3}" -f $tt, $r8[0]['keyword'], $r8[0]['score'], $r8[0]['labor_norm_rbh']) -ForegroundColor Green
    } else {
        Write-Host ("  [--] '{0}' -> token no result" -f $tt) -ForegroundColor Yellow
    }
}

# ---- BLOK 9: Normy RBH - rozkladki ----
Write-Host "`n===== BLOK 9: Normy RBH - sprawdzenie rozkladow =====" -ForegroundColor Cyan
$q9 = @"
SELECT
  category,
  ROUND(AVG(labor_norm_rbh)::numeric,3) as avg_rbh,
  ROUND(MIN(labor_norm_rbh)::numeric,3) as min_rbh,
  ROUND(MAX(labor_norm_rbh)::numeric,3) as max_rbh,
  COUNT(*) as cnt
FROM es_dictionary
WHERE user_id IS NULL AND labor_norm_rbh > 0
GROUP BY category
ORDER BY avg_rbh DESC
"@
$r9 = $ser.DeserializeObject($(RunSQL $TEST $q9))
Write-Host ("  {0,-28} {1,8} {2,8} {3,8} {4,6}" -f "Kategoria","AVG rbh","MIN rbh","MAX rbh","Count")
Write-Host ("  " + "-"*65)
foreach ($row in $r9) {
    Write-Host ("  {0,-28} {1,8} {2,8} {3,8} {4,6}" -f $row['category'],$row['avg_rbh'],$row['min_rbh'],$row['max_rbh'],$row['cnt'])
}

# ---- BLOK 10: Nowe kategorie ----
Write-Host "`n===== BLOK 10: Nowe kategorie (v8+) =====" -ForegroundColor Cyan
$newCats = @("pv_ev", "pomiary", "uziemienie")
foreach ($nc in $newCats) {
    $q10 = "SELECT COUNT(*) as cnt FROM es_dictionary WHERE category = '$nc' AND user_id IS NULL"
    $r10 = $ser.DeserializeObject($(RunSQL $TEST $q10))
    $cnt = $r10[0]['cnt']
    if ($cnt -gt 0) {
        Write-Host ("  [OK] kategoria '{0}' -> {1} wpisow" -f $nc, $cnt) -ForegroundColor Green
    } else {
        Write-Host ("  [!!] kategoria '{0}' -> BRAK!" -f $nc) -ForegroundColor Red
    }
}

Write-Host "`n===== DIAGNOZA ZAKONCZONA =====" -ForegroundColor Cyan
