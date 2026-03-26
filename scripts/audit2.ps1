param([string]$ProjectId = "jbxveulddoznswyeihda")

Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Text;
public class WC4 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CRED { public uint Flags; public uint Type; public string TargetName; public string Comment; public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist; public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string t, uint type, int f, out IntPtr p);
    [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr p);
    public static string Get(string t) { IntPtr p = IntPtr.Zero; if (!CredRead(t, 1, 0, out p)) return null; var c = (CRED)Marshal.PtrToStructure(p, typeof(CRED)); byte[] b = new byte[c.CredentialBlobSize]; Marshal.Copy(c.CredentialBlob, b, 0, (int)c.CredentialBlobSize); CredFree(p); string r = Encoding.Unicode.GetString(b).TrimEnd('\0'); bool ok = true; foreach (char ch in r) { if (ch > 127) { ok = false; break; } } if (!ok) r = Encoding.UTF8.GetString(b).TrimEnd('\0'); return r; }
}
'@
Add-Type -AssemblyName System.Web.Extensions

$token = [WC4]::Get("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: No token"; exit 1 }

function Q($label, $sql) {
    $uri = "https://api.supabase.com/v1/projects/$ProjectId/database/query"
    $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer; $jss.MaxJsonLength = 20000000
    $body = $jss.Serialize(@{query=$sql})
    $bytes = [Text.Encoding]::UTF8.GetBytes($body)
    $req = [Net.HttpWebRequest]::Create($uri); $req.Method="POST"; $req.ContentType="application/json; charset=utf-8"
    $req.Headers.Add("Authorization","Bearer $token"); $req.ContentLength=$bytes.Length
    $s=$req.GetRequestStream(); $s.Write($bytes,0,$bytes.Length); $s.Close()
    try { $r=$req.GetResponse(); $rd=New-Object IO.StreamReader($r.GetResponseStream()); $out=$rd.ReadToEnd(); Write-Host "`n===[ $label ]=== $out" }
    catch { $er=New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host "`n===[ $label - ERR ]=== $($er.ReadToEnd())" }
}

Write-Host "====== ES-DICTIONARY FULL AUDIT v2 ======"

# 1. Ogolne statystyki
Q "1.TOTAL_STATS" "SELECT (SELECT COUNT(*) FROM es_dictionary) dict_total, (SELECT COUNT(DISTINCT category) FROM es_dictionary) dict_cats, (SELECT COUNT(*) FROM es_dictionary WHERE knr_ref IS NOT NULL AND knr_ref<>'') dict_with_knr, (SELECT COUNT(*) FROM es_dictionary WHERE labor_norm_rbh IS NOT NULL AND labor_norm_rbh>0) dict_with_norm, (SELECT COUNT(*) FROM es_dictionary WHERE type='zestaw') dict_zestawy, (SELECT COUNT(*) FROM es_sacred_words) sacred_total, (SELECT COUNT(*) FROM es_unit_guardrails) guardrails_total, (SELECT COUNT(*) FROM catalog_items WHERE labor_norm_rbh IS NOT NULL AND labor_norm_rbh>0) cat_with_norm, (SELECT COUNT(*) FROM catalog_items) cat_total"

# 2. Per category
Q "2.PER_CATEGORY" "SELECT category, COUNT(*) total, COUNT(CASE WHEN knr_ref IS NOT NULL AND knr_ref<>'' THEN 1 END) with_knr, COUNT(CASE WHEN labor_norm_rbh>0 THEN 1 END) with_norm, COUNT(CASE WHEN type='zestaw' THEN 1 END) zestawy FROM es_dictionary GROUP BY category ORDER BY total DESC"

# 3. Brakujace normy - istotne kategorie
Q "3.MISSING_NORMS" "SELECT category, label, knr_ref, unit FROM es_dictionary WHERE (labor_norm_rbh IS NULL OR labor_norm_rbh=0) AND category NOT IN ('materialy_ogolne','pomiary_dokumentacja','zestawy') ORDER BY category, label LIMIT 25"

# 4. Duplikaty keyword_normalized
Q "4.DUPLICATES" "SELECT keyword_normalized, COUNT(*) cnt, array_agg(DISTINCT category) cats FROM es_dictionary WHERE user_id IS NULL GROUP BY keyword_normalized HAVING COUNT(*)>1 ORDER BY cnt DESC LIMIT 20"

# 5. Sacred words - statystyki
Q "5.SACRED_STATS" "SELECT category, COUNT(*) cnt FROM es_sacred_words GROUP BY category ORDER BY cnt DESC"

# 6. Sacred words sample
Q "6.SACRED_SAMPLE" "SELECT token, category FROM es_sacred_words ORDER BY category, token LIMIT 30"

# 7. Unit guardrails statystyki
Q "7.GUARDRAILS_STATS" "SELECT required_unit, category, COUNT(*) cnt FROM es_unit_guardrails GROUP BY required_unit, category ORDER BY required_unit, cnt DESC"

# 8. Test es_dictionary_fuzzy_match - gniazdko
Q "8.FUZZY_gniazdko" "SELECT * FROM es_dictionary_fuzzy_match('gniazdko') LIMIT 5"

# 9. Test fuzzy - kabel YDY
Q "9.FUZZY_kabel_YDY" "SELECT * FROM es_dictionary_fuzzy_match('kabel YDY 3x1.5') LIMIT 5"

# 10. Test fuzzy - bruzdowanie
Q "10.FUZZY_bruzda" "SELECT * FROM es_dictionary_fuzzy_match('kucie bruzdy w betonie') LIMIT 5"

# 11. Test fuzzy - rozdzielnica
Q "11.FUZZY_rozdzielnica" "SELECT * FROM es_dictionary_fuzzy_match('montaz rozdzielnicy') LIMIT 5"

# 12. Test es_dictionary_token_match jesli istnieje
Q "12.TOKEN_MATCH_sig" "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname='es_dictionary_token_match' LIMIT 1"

# 13. Kable w katalogu - normy
Q "13.CATALOG_CABLES" "SELECT name, unit, labor_norm_rbh FROM catalog_items WHERE (LOWER(name) LIKE '%ydy%' OR LOWER(name) LIKE '%ydyp%' OR LOWER(name) LIKE '%ydyz%') AND unit IN ('mb','m') ORDER BY name LIMIT 20"

# 14. Kable z norma null w katalogu - ile?
Q "14.CATALOG_NULL_NORM_COUNT" "SELECT COUNT(*) null_norm_cables FROM catalog_items WHERE unit IN ('mb','m') AND (labor_norm_rbh IS NULL OR labor_norm_rbh=0) AND (LOWER(name) LIKE '%kabel%' OR LOWER(name) LIKE '%przewod%' OR LOWER(name) LIKE '%ydy%')"

# 15. Catalog items z podejrzanie wysoka norma (>5 rbh)
Q "15.SUSPICIOUS_HIGH_NORM" "SELECT name, unit, labor_norm_rbh FROM catalog_items WHERE labor_norm_rbh > 5 ORDER BY labor_norm_rbh DESC LIMIT 15"

# 16. Catalog items - normy 0.315 (stara bledna wartosc)
Q "16.OLD_WRONG_NORM_315" "SELECT name, unit, labor_norm_rbh FROM catalog_items WHERE ABS(labor_norm_rbh - 0.315) < 0.001 OR ABS(labor_norm_rbh - 0.315) < 0.001"

# 17. Project items z bledna norma
Q "17.PROJECT_ITEMS_WRONG_NORM" "SELECT pi.name, pi.unit, pi.labor_norm, pi.quantity FROM project_items pi WHERE ABS(pi.labor_norm - 0.315) < 0.001 LIMIT 10"

# 18. Es_dictionary zestawy - sprawdzenie composite_refs
Q "18.ZESTAWY_SAMPLE" "SELECT keyword, label, composite_refs FROM es_dictionary WHERE type='zestaw' LIMIT 8"

# 19. Kategorie ktore sa w seeds ale moze brakuje - sprawdzenie list
Q "19.CATEGORY_LIST" "SELECT DISTINCT category FROM es_dictionary WHERE user_id IS NULL ORDER BY category"

# 20. Kable w es_dictionary - normy
Q "20.DICT_CABLES" "SELECT keyword, label, knr_ref, labor_norm_rbh, unit FROM es_dictionary WHERE category IN ('instalacje_podstawowe','kable') AND (LOWER(keyword) LIKE '%ydy%' OR LOWER(keyword) LIKE '%kabel%') ORDER BY keyword LIMIT 20"

Write-Host "`n====== AUDIT COMPLETE ======"
