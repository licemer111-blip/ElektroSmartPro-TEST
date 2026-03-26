# ============================================================
# audit_es_dictionary.ps1
# Full audit: es_dictionary, es_sacred_words, es_unit_guardrails,
# catalog_items labor norms, RPC functions
# Usage: .\scripts\audit_es_dictionary.ps1
# ============================================================
param([string]$ProjectId = "jbxveulddoznswyeihda")

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WCred2 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CRED {
        public uint Flags; public uint Type; public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize; public IntPtr CredentialBlob;
        public uint Persist; public uint AttributeCount; public IntPtr Attributes;
        public string TargetAlias; public string UserName;
    }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string t, uint type, int f, out IntPtr p);
    [DllImport("advapi32.dll")]
    public static extern void CredFree(IntPtr p);
    public static string Get(string t) {
        IntPtr p = IntPtr.Zero;
        if (!CredRead(t, 1, 0, out p)) return null;
        var c = (CRED)Marshal.PtrToStructure(p, typeof(CRED));
        byte[] b = new byte[c.CredentialBlobSize];
        Marshal.Copy(c.CredentialBlob, b, 0, (int)c.CredentialBlobSize);
        CredFree(p);
        string r = System.Text.Encoding.Unicode.GetString(b).TrimEnd('\0');
        bool ok = true;
        foreach (char ch in r) { if (ch > 127) { ok = false; break; } }
        if (!ok) r = System.Text.Encoding.UTF8.GetString(b).TrimEnd('\0');
        return r;
    }
}
'@
Add-Type -AssemblyName System.Web.Extensions

$token = [WCred2]::Get("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: No token found in Credential Manager"; exit 1 }

function Run-Query($label, $sql) {
    $uri = "https://api.supabase.com/v1/projects/$ProjectId/database/query"
    $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $jss.MaxJsonLength = 20000000
    $body = $jss.Serialize(@{ query = $sql })
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req = [System.Net.HttpWebRequest]::Create($uri)
    $req.Method = "POST"
    $req.ContentType = "application/json; charset=utf-8"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try {
        $r = $req.GetResponse()
        $rd = New-Object System.IO.StreamReader($r.GetResponseStream())
        $result = $rd.ReadToEnd()
        Write-Host "`n===[ $label ]===`n$result"
    } catch [System.Net.WebException] {
        $er = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "`n===[ $label - ERROR ]===`n$($er.ReadToEnd())"
    }
}

Write-Host "========================================="
Write-Host " ES-DICTIONARY FULL AUDIT - $ProjectId"
Write-Host "========================================="

# 1. Ogolne statystyki
Run-Query "1. OGOLNE STATYSTYKI" @"
SELECT
  (SELECT COUNT(*) FROM es_dictionary) as dict_total,
  (SELECT COUNT(DISTINCT category) FROM es_dictionary) as dict_categories,
  (SELECT COUNT(*) FROM es_dictionary WHERE knr_code IS NOT NULL AND knr_code <> '') as dict_with_knr,
  (SELECT COUNT(*) FROM es_dictionary WHERE labor_norm IS NOT NULL AND labor_norm > 0) as dict_with_norm,
  (SELECT COUNT(*) FROM es_sacred_words) as sacred_words_total,
  (SELECT COUNT(*) FROM es_unit_guardrails) as unit_guardrails_total,
  (SELECT COUNT(*) FROM catalog_items WHERE labor_norm_rbh IS NOT NULL AND labor_norm_rbh > 0) as catalog_with_norm,
  (SELECT COUNT(*) FROM catalog_items) as catalog_total;
"@

# 2. Statystyki per kategoria
Run-Query "2. WPISY PER KATEGORIA (es_dictionary)" @"
SELECT
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN knr_code IS NOT NULL AND knr_code <> '' THEN 1 END) as with_knr,
  COUNT(CASE WHEN labor_norm > 0 THEN 1 END) as with_norm,
  ROUND(AVG(array_length(synonyms, 1))::numeric, 1) as avg_synonyms,
  MAX(array_length(synonyms, 1)) as max_synonyms
FROM es_dictionary
GROUP BY category
ORDER BY total DESC;
"@

# 3. Kategorie bez KNR code lub normy
Run-Query "3. WPISY BEZ KNR CODE (pierwsze 20)" @"
SELECT category, canonical_name, unit
FROM es_dictionary
WHERE (knr_code IS NULL OR knr_code = '')
  AND category NOT IN ('demontaze','pomiary_dokumentacja','materialy_ogolne')
ORDER BY category, canonical_name
LIMIT 20;
"@

# 4. Wpisy z brakujaca norma labor
Run-Query "4. WPISY Z NORMA = 0 LUB NULL (pierwsze 20)" @"
SELECT category, canonical_name, knr_code, labor_norm, unit
FROM es_dictionary
WHERE (labor_norm IS NULL OR labor_norm = 0)
  AND category NOT IN ('materialy_ogolne','pomiary_dokumentacja')
ORDER BY category, canonical_name
LIMIT 20;
"@

# 5. Sacred Words - sample
Run-Query "5. SACRED WORDS - pierwsze 20" @"
SELECT token, word_type, notes
FROM es_sacred_words
ORDER BY word_type, token
LIMIT 20;
"@

# 6. Unit Guardrails - statystyki per unit
Run-Query "6. UNIT GUARDRAILS PER UNIT" @"
SELECT unit, COUNT(*) as token_count
FROM es_unit_guardrails
GROUP BY unit
ORDER BY token_count DESC;
"@

# 7. Test RPC: es_lookup (jezeli istnieje)
Run-Query "7. TEST RPC es_lookup 'gniazdko'" @"
SELECT * FROM es_lookup('gniazdko', 1) LIMIT 5;
"@

# 8. Test RPC dla trudnych przypadkow
Run-Query "8. TEST RPC 'rurka karbowana'" @"
SELECT * FROM es_lookup('rurka karbowana ICT fi 32', 1) LIMIT 5;
"@

# 9. Test RPC bruzdowanie
Run-Query "9. TEST RPC 'bruzdowanie'" @"
SELECT * FROM es_lookup('kucie bruzdy', 1) LIMIT 5;
"@

# 10. Duplikaty w canonical_name
Run-Query "10. DUPLIKATY CANONICAL_NAME" @"
SELECT canonical_name, COUNT(*) as cnt, array_agg(category) as categories
FROM es_dictionary
GROUP BY canonical_name
HAVING COUNT(*) > 1
ORDER BY cnt DESC
LIMIT 15;
"@

# 11. Catalog items z bledna norma labor (norma > 5 rbh/jedn - podejrzane)
Run-Query "11. CATALOG ITEMS z norma > 5 rbh (podejrzane)" @"
SELECT name, unit, labor_norm_rbh, category
FROM catalog_items
WHERE labor_norm_rbh > 5
ORDER BY labor_norm_rbh DESC
LIMIT 15;
"@

# 12. Catalog items kable - sprawdzenie normy 0.0315 rbh/mb
Run-Query "12. KABLE - normy labor (sprawdzenie poprawki 0.0315 rbh/mb)" @"
SELECT name, unit, labor_norm_rbh
FROM catalog_items
WHERE (LOWER(name) LIKE '%ydy%' OR LOWER(name) LIKE '%lgy%' OR LOWER(name) LIKE '%kabel%' OR LOWER(name) LIKE '%przewod%')
  AND unit IN ('mb', 'mb.', 'm')
ORDER BY name
LIMIT 20;
"@

# 13. Sprawdzenie czy es_dictionary ma indeks GIN
Run-Query "13. INDEKSY NA es_dictionary" @"
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('es_dictionary', 'es_sacred_words', 'es_unit_guardrails')
ORDER BY tablename, indexname;
"@

# 14. Triggery na es_dictionary
Run-Query "14. TRIGGERY NA es_dictionary" @"
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'es_dictionary';
"@

# 15. RLS policies
Run-Query "15. RLS POLICIES na tabelach ES" @"
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('es_dictionary', 'es_sacred_words', 'es_unit_guardrails')
ORDER BY tablename, policyname;
"@

Write-Host "`n=========================================`n AUDIT ZAKONCZONY`n========================================="
