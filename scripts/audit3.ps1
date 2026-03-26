param([string]$DbId = "jbxveulddoznswyeihda")

Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Text;
public class WC6 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CRED { public uint Flags; public uint Type; public string TargetName; public string Comment; public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist; public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string t, uint type, int f, out IntPtr p);
    [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr p);
    public static string Get(string t) {
        IntPtr p = IntPtr.Zero;
        if (!CredRead(t, 1, 0, out p)) return null;
        var c = (CRED)Marshal.PtrToStructure(p, typeof(CRED));
        byte[] b = new byte[c.CredentialBlobSize];
        Marshal.Copy(c.CredentialBlob, b, 0, (int)c.CredentialBlobSize); CredFree(p);
        string r = Encoding.Unicode.GetString(b).TrimEnd('\0');
        bool ok = true; foreach (char ch in r) { if (ch > 127) { ok = false; break; } }
        if (!ok) r = Encoding.UTF8.GetString(b).TrimEnd('\0');
        return r;
    }
}
'@
Add-Type -AssemblyName System.Web.Extensions

$token = [WC6]::Get("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: No token"; exit 1 }
Write-Host "Token OK, querying project: $DbId"

function Qry([string]$label, [string]$sql) {
    $uri = "https://api.supabase.com/v1/projects/$DbId/database/query"
    $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $jss.MaxJsonLength = 10000000
    $body = $jss.Serialize(@{query=$sql})
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req = [System.Net.HttpWebRequest]::Create($uri)
    $req.Method = "POST"; $req.ContentType = "application/json; charset=utf-8"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try {
        $resp = $req.GetResponse()
        $rd = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $out = $rd.ReadToEnd()
        Write-Host "`n### $label`n$out"
    } catch [System.Net.WebException] {
        $er = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "`n### $label [ERROR]`n$($er.ReadToEnd())"
    }
}

Write-Host "`n========= AUDIT STARTED =========`n"

Qry "A1_TOTAL" "SELECT
  (SELECT COUNT(*) FROM es_dictionary WHERE user_id IS NULL) AS dict_total,
  (SELECT COUNT(DISTINCT category) FROM es_dictionary WHERE user_id IS NULL) AS categories,
  (SELECT COUNT(*) FROM es_dictionary WHERE user_id IS NULL AND labor_norm_rbh > 0) AS with_norm,
  (SELECT COUNT(*) FROM es_dictionary WHERE user_id IS NULL AND (knr_ref IS NULL OR knr_ref = '')) AS no_knr,
  (SELECT COUNT(*) FROM es_sacred_words) AS sacred_total,
  (SELECT COUNT(DISTINCT category) FROM es_sacred_words) AS sacred_cats,
  (SELECT COUNT(*) FROM es_unit_guardrails) AS guardrails_total,
  (SELECT COUNT(*) FROM catalog_items WHERE labor_norm_rbh > 0) AS cat_norm,
  (SELECT COUNT(*) FROM catalog_items) AS cat_total"

Qry "A2_PER_CATEGORY" "SELECT category, COUNT(*) AS n,
  COUNT(CASE WHEN labor_norm_rbh > 0 THEN 1 END) AS with_norm,
  COUNT(CASE WHEN type = 'zestaw' THEN 1 END) AS zestawy
FROM es_dictionary WHERE user_id IS NULL
GROUP BY category ORDER BY n DESC"

Qry "A3_MISSING_NORM_ROBOCIZNA" "SELECT category, COUNT(*) AS missing
FROM es_dictionary
WHERE user_id IS NULL
  AND (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND type = 'robocizna'
GROUP BY category ORDER BY missing DESC LIMIT 20"

Qry "A4_DUPLICATES_KEYWORD" "SELECT keyword_normalized, COUNT(*) AS cnt,
  array_agg(DISTINCT category) AS cats
FROM es_dictionary WHERE user_id IS NULL
GROUP BY keyword_normalized
HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 20"

Qry "A5_FUZZY_gniazdko" "SELECT * FROM es_dictionary_fuzzy_match('gniazdko') LIMIT 5"

Qry "A6_FUZZY_bruzda" "SELECT * FROM es_dictionary_fuzzy_match('kucie bruzdy') LIMIT 5"

Qry "A7_FUZZY_kabel_YDY" "SELECT * FROM es_dictionary_fuzzy_match('kabel YDYp 3x1.5') LIMIT 5"

Qry "A8_FUZZY_rozdzielnica" "SELECT * FROM es_dictionary_fuzzy_match('montaz rozdzielnicy') LIMIT 5"

Qry "A9_FUZZY_klimatyzacja" "SELECT * FROM es_dictionary_fuzzy_match('instalacja klimatyzacji split') LIMIT 5"

Qry "A10_FUZZY_solar" "SELECT * FROM es_dictionary_fuzzy_match('montaz paneli fotowoltaicznych') LIMIT 5"

Qry "A11_SACRED_STATS" "SELECT category, COUNT(*) AS n FROM es_sacred_words GROUP BY category ORDER BY n DESC"

Qry "A12_GUARDRAILS_STATS" "SELECT required_unit, COUNT(*) AS n FROM es_unit_guardrails GROUP BY required_unit ORDER BY n DESC"

Qry "A13_CATALOG_CABLE_NULL_NORM" "SELECT COUNT(*) AS null_norm_cable_count
FROM catalog_items
WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh = 0)
  AND unit IN ('mb', 'm')
  AND (LOWER(name) LIKE '%ydy%' OR LOWER(name) LIKE '%kabel%'
    OR LOWER(name) LIKE '%przewod%' OR LOWER(name) LIKE '%nyx%'
    OR LOWER(name) LIKE '%yky%' OR LOWER(name) LIKE '%lgyz%')"

Qry "A14_CATALOG_WRONG_315" "SELECT name, unit, labor_norm_rbh
FROM catalog_items
WHERE labor_norm_rbh BETWEEN 0.30 AND 0.32
ORDER BY labor_norm_rbh DESC LIMIT 20"

Qry "A15_CATALOG_HIGH_NORM" "SELECT name, unit, labor_norm_rbh
FROM catalog_items
WHERE labor_norm_rbh > 5
ORDER BY labor_norm_rbh DESC LIMIT 15"

Qry "A16_FUNCS_SIGNATURE" "SELECT proname, pg_get_function_arguments(oid) AS args,
  pg_get_function_result(oid) AS returns
FROM pg_proc WHERE proname IN ('es_dictionary_fuzzy_match','es_dictionary_token_match')"

Qry "A17_CATEGORY_DUPS_ANALYSIS" "SELECT
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'demontaz' AND user_id IS NULL) AS demontaz,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'demontaze' AND user_id IS NULL) AS demontaze,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'uziemienie' AND user_id IS NULL) AS uziemienie,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'uziemienie_odgromowa' AND user_id IS NULL) AS uziemienie_odgromowa,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'uziem_odgrom' AND user_id IS NULL) AS uziem_odgrom,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'ppoz' AND user_id IS NULL) AS ppoz,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'ppoz_ssp' AND user_id IS NULL) AS ppoz_ssp,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'ssp' AND user_id IS NULL) AS ssp,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'pv_ev' AND user_id IS NULL) AS pv_ev,
  (SELECT COUNT(*) FROM es_dictionary WHERE category = 'fotowoltaika' AND user_id IS NULL) AS fotowoltaika"

Qry "A18_ZESTAWY_QUALITY" "SELECT keyword, label, labor_norm_rbh,
  jsonb_array_length(composite_refs) AS parts_count
FROM es_dictionary
WHERE type = 'zestaw' AND user_id IS NULL
ORDER BY keyword LIMIT 15"

Qry "A19_KNR_REF_PATTERNS" "SELECT SUBSTRING(knr_ref FROM 1 FOR 10) AS knr_prefix, COUNT(*) AS n
FROM es_dictionary
WHERE user_id IS NULL AND knr_ref IS NOT NULL AND knr_ref <> ''
GROUP BY 1 ORDER BY n DESC LIMIT 15"

Qry "A20_LOW_CONFIDENCE" "SELECT category, label, confidence_weight, knr_ref
FROM es_dictionary
WHERE user_id IS NULL AND confidence_weight < 1.0
ORDER BY confidence_weight ASC LIMIT 20"

Write-Host "`n========= AUDIT COMPLETE ========="
