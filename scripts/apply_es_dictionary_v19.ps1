Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCred6 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public UInt32 Flags; public UInt32 Type; public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize; public IntPtr CredentialBlob;
        public UInt32 Persist; public UInt32 AttributeCount; public IntPtr Attributes;
        public string TargetAlias; public string UserName;
    }
    [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern bool CredRead(string target, UInt32 type, Int32 flags, out IntPtr credPtr);
    [DllImport("advapi32.dll")]
    public static extern void CredFree(IntPtr cred);
    public static string GetPassword(string target) {
        IntPtr ptr = IntPtr.Zero;
        if (!CredRead(target, 1, 0, out ptr)) return null;
        var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
        byte[] bytes = new byte[cred.CredentialBlobSize];
        Marshal.Copy(cred.CredentialBlob, bytes, 0, (int)cred.CredentialBlobSize);
        CredFree(ptr);
        string r = Encoding.Unicode.GetString(bytes).TrimEnd('\0');
        bool ascii = true; foreach (char c in r) { if (c > 127) { ascii = false; break; } }
        return ascii ? r : Encoding.UTF8.GetString(bytes).TrimEnd('\0');
    }
}
'@

$token = [WinCred6]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: token not found" -ForegroundColor Red; exit 1 }
Write-Host "Token OK: $($token.Substring(0,20))..." -ForegroundColor Green

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()

function Invoke-SupabaseSQL {
    param([string]$Ref, [string]$Sql, [string]$Token, [string]$Label)
    $uri = "https://api.supabase.com/v1/projects/$Ref/database/query"
    $body = $ser.Serialize(@{ query = $Sql })
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req = [System.Net.HttpWebRequest]::Create($uri)
    $req.Method = "POST"; $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $Token")
    $req.ContentLength = $bytes.Length
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try {
        $res = $req.GetResponse()
        $rd = New-Object System.IO.StreamReader($res.GetResponseStream())
        $out = $rd.ReadToEnd()
        Write-Host "  [$Ref] $Label OK" -ForegroundColor Green; return $true
    } catch [System.Net.WebException] {
        $er = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $eb = $er.ReadToEnd()
        Write-Host "  [$Ref] $Label ERROR: $($eb.Substring(0,[Math]::Min(300,$eb.Length)))" -ForegroundColor Red
        return $false
    }
}

$dir = Join-Path $PSScriptRoot "..\supabase\migrations"
$files = @(
    "20260305_seed_es_dictionary_v19a_przewody_rury_gniazda.sql",
    "20260305_seed_es_dictionary_v19b_laczniki_wylaczniki.sql",
    "20260305_seed_es_dictionary_v19c_puszki_koryta_bruzdy.sql",
    "20260305_seed_es_dictionary_v19d_pomiary_uziemienie_oswietlenie.sql",
    "20260305_seed_es_dictionary_v19e_teletechnika_wlz_specjalne.sql"
)

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"
$ok = $true

foreach ($env in @($TEST, $LIVE)) {
    $label = if ($env -eq $TEST) { "TEST" } else { "LIVE" }
    Write-Host "`n=== $label ($env) ===" -ForegroundColor Cyan
    foreach ($f in $files) {
        $sql = Get-Content (Join-Path $dir $f) -Raw -Encoding UTF8
        $part = $f -replace ".*_v19(.*)\.sql", "v19$1"
        $r = Invoke-SupabaseSQL -Ref $env -Sql $sql -Token $token -Label $part
        if (-not $r) { $ok = $false }
    }
}

Write-Host ""
if ($ok) { Write-Host "ALL DONE - v19 (a-e) applied TEST + LIVE" -ForegroundColor Green }
else      { Write-Host "Partial - check errors above" -ForegroundColor Yellow }
