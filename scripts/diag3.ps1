Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCredD3 {
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
        bool ok = true;
        foreach (char c in r) { if (c > 127) { ok = false; break; } }
        if (!ok) r = Encoding.UTF8.GetString(bytes).TrimEnd('\0');
        return r;
    }
}
'@

$token = [WinCredD3]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "no token"; exit 1 }

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$ser.MaxJsonLength = 10000000

function Q([string]$ref, [string]$sql) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($ser.Serialize(@{ query = $sql }))
    $req = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ref/database/query")
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length
    $req.Timeout = 60000
    $s = $req.GetRequestStream()
    $s.Write($bytes, 0, $bytes.Length)
    $s.Close()
    try {
        return (New-Object System.IO.StreamReader($req.GetResponse().GetResponseStream())).ReadToEnd()
    }
    catch [System.Net.WebException] {
        return "ERR"
    }
}

$T = "upwctgdpuckreoquofiu"
$L = "jbxveulddoznswyeihda"

Write-Host "====== 1. SYNC TEST vs LIVE ======" -ForegroundColor Cyan
$cntT = ($ser.DeserializeObject($(Q $T "SELECT COUNT(*) as n FROM es_dictionary WHERE user_id IS NULL")))[0]['n']
$cntL = ($ser.DeserializeObject($(Q $L "SELECT COUNT(*) as n FROM es_dictionary WHERE user_id IS NULL")))[0]['n']
Write-Host "TEST = $cntT  |  LIVE = $cntL"
if ($cntT -eq $cntL) { Write-Host "[OK] SYNCHRONIZED" -ForegroundColor Green }
else { Write-Host "[!!] DIFF!" -ForegroundColor Red }

Write-Host "`n====== 2. KATEGORIE (TEST) ======" -ForegroundColor Cyan
$cats = $ser.DeserializeObject($(Q $T "SELECT category, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY category ORDER BY cnt DESC"))
foreach ($c in $cats) {
    Write-Host ("  {0,-28} {1}" -f $c['category'], $c['cnt'])
}

Write-Host "`n====== 3. RPC FUNCTIONS ======" -ForegroundColor Cyan
$fns = @("es_dictionary_fuzzy_match","es_dictionary_token_match","normalize_text")
foreach ($fn in $fns) {
    $n = ($ser.DeserializeObject($(Q $T "SELECT COUNT(*) as n FROM pg_proc WHERE proname='$fn'")))[0]['n']
    if ($n -gt 0) { Write-Host "  [OK] $fn" -ForegroundColor Green }
    else { Write-Host "  [!!] $fn MISSING" -ForegroundColor Red }
}

Write-Host "`n====== 4. INDEKSY GIN ======" -ForegroundColor Cyan
$idxs = $ser.DeserializeObject($(Q $T "SELECT indexname FROM pg_indexes WHERE tablename='es_dictionary' ORDER BY indexname"))
foreach ($i in $idxs) { Write-Host "  $($i['indexname'])" }

Write-Host "`n====== 5. PHASE 1 EXACT MATCH (po keyword) ======" -ForegroundColor Cyan
$tests = @(
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
    "bramka dali ethernet",
    "oprawa uliczna led 100w",
    "instalacja pv 1kwp dach skosny",
    "montaz rb tki budowlanej",
    "centrala ssp polon alfa",
    "szafa rack 42u",
    "ups 20kva 3f",
    "filtr aktywny harmonicznych"
)
$ok = 0; $miss = 0
foreach ($kw in $tests) {
    $esc = $kw.Replace("'","''")
    $r = Q $T "SELECT knr_ref, labor_norm_rbh, unit FROM es_dictionary WHERE keyword='$esc' AND user_id IS NULL LIMIT 1"
    if ($r -ne "ERR" -and $r -match '"knr_ref"') {
        $obj = $ser.DeserializeObject($r)
        if ($obj.Count -gt 0) {
            Write-Host ("  [OK] '{0,-45}' knr={1} rbh={2}/{3}" -f $kw, $obj[0]['knr_ref'], $obj[0]['labor_norm_rbh'], $obj[0]['unit']) -ForegroundColor Green
            $ok++
            continue
        }
    }
    Write-Host ("  [--] '{0}'" -f $kw) -ForegroundColor Yellow
    $miss++
}
Write-Host "  => Phase 1: $ok OK / $miss MISS z $($tests.Count)"

Write-Host "`n====== 6. SYNONIMY coverage ======" -ForegroundColor Cyan
$syns = @(
    "NHXH E90",
    "smoke detector",
    "boom barrier",
    "ATS 630A",
    "DVB-T2 antena",
    "power factor controller",
    "LED strip outdoor IP65",
    "Quad LNB",
    "Franklin rod",
    "DALI gateway"
)
$sokOk = 0; $sokMiss = 0
foreach ($syn in $syns) {
    $esc = $syn.Replace("'","''")
    $r = Q $T "SELECT knr_ref FROM es_dictionary WHERE lower(keyword)=lower('$esc') AND user_id IS NULL LIMIT 1"
    if ($r -ne "ERR" -and $r -match '"knr_ref"') {
        $obj = $ser.DeserializeObject($r)
        if ($obj.Count -gt 0) {
            Write-Host ("  [OK] syn='{0}' -> {1}" -f $syn, $obj[0]['knr_ref']) -ForegroundColor Green
            $sokOk++
            continue
        }
    }
    Write-Host ("  [--] syn='{0}' nie znaleziono" -f $syn) -ForegroundColor Yellow
    $sokMiss++
}
Write-Host "  => Synonimy: $sokOk OK / $sokMiss MISS z $($syns.Count)"

Write-Host "`n====== 7. RBH STATYSTYKI ======" -ForegroundColor Cyan
$rbhQ = "SELECT category, ROUND(AVG(labor_norm_rbh)::numeric,3) as avg_r, ROUND(MIN(labor_norm_rbh)::numeric,3) as min_r, ROUND(MAX(labor_norm_rbh)::numeric,3) as max_r, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL AND labor_norm_rbh > 0 GROUP BY category ORDER BY avg_r DESC"
$rbh = $ser.DeserializeObject($(Q $T $rbhQ))
Write-Host ("  {0,-28}{1,9}{2,9}{3,9}{4,7}" -f "Kategoria","avg rbh","min rbh","max rbh","count")
Write-Host ("  " + ("-"*65))
foreach ($row in $rbh) {
    Write-Host ("  {0,-28}{1,9}{2,9}{3,9}{4,7}" -f $row['category'],$row['avg_r'],$row['min_r'],$row['max_r'],$row['cnt'])
}

Write-Host "`n====== 8. DUPLIKATY ======" -ForegroundColor Cyan
$dups = $ser.DeserializeObject($(Q $T "SELECT keyword_normalized, COUNT(*) as cnt FROM es_dictionary WHERE user_id IS NULL GROUP BY keyword_normalized HAVING COUNT(*)>1 ORDER BY cnt DESC LIMIT 5"))
if ($dups.Count -eq 0) {
    Write-Host "  [OK] Brak duplikatow" -ForegroundColor Green
}
else {
    Write-Host "  [!!] $($dups.Count) zduplikowanych kluczy:" -ForegroundColor Yellow
    foreach ($d in $dups) { Write-Host "    '$($d['keyword_normalized'])' x$($d['cnt'])" }
}

Write-Host "`n====== 9. TOP 10 najdrozszych robot ======" -ForegroundColor Cyan
$tops = $ser.DeserializeObject($(Q $T "SELECT keyword, category, labor_norm_rbh, unit FROM es_dictionary WHERE user_id IS NULL ORDER BY labor_norm_rbh DESC LIMIT 10"))
foreach ($t in $tops) {
    Write-Host ("  {0,6} rbh/{1,-5}  {2}" -f $t['labor_norm_rbh'],$t['unit'],$t['keyword'])
}

Write-Host "`n====== 10. NOWE KATEGORIE v6-v10 ======" -ForegroundColor Cyan
$newcats = @("pv_ev","pomiary","uziemienie","demontaz","zestawy","prace_dodatkowe")
foreach ($nc in $newcats) {
    $n = ($ser.DeserializeObject($(Q $T "SELECT COUNT(*) as n FROM es_dictionary WHERE category='$nc' AND user_id IS NULL")))[0]['n']
    if ($n -gt 0) { Write-Host "  [OK] '$nc' = $n" -ForegroundColor Green }
    else { Write-Host "  [!!] '$nc' = 0" -ForegroundColor Red }
}

Write-Host "`n====== SUMMARY ======" -ForegroundColor Cyan
Write-Host "TEST=$cntT  LIVE=$cntL  Phase1=$ok/$($tests.Count)  Synonimy=$sokOk/$($syns.Count)" -ForegroundColor White
