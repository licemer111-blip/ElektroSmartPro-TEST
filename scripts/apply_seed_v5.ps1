Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCredV5 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public UInt32 Flags; public UInt32 Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize; public IntPtr CredentialBlob; public UInt32 Persist;
        public UInt32 AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
    }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
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
        bool isAscii = true;
        foreach (char c in r) { if (c > 127) { isAscii = false; break; } }
        if (!isAscii) r = Encoding.UTF8.GetString(bytes).TrimEnd('\0');
        return r;
    }
}
'@

$token = [WinCredV5]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Host "ERROR: Token not found" -ForegroundColor Red; exit 1 }
Write-Host "Token OK: $($token.Substring(0,20))..." -ForegroundColor Green

$seedPath = Join-Path $PSScriptRoot "..\supabase\migrations\20260305_seed_es_dictionary_v5.sql"
$seedSql = Get-Content $seedPath -Raw -Encoding UTF8
Write-Host "SQL loaded: $([Math]::Round($seedSql.Length / 1024, 1)) KB" -ForegroundColor Cyan

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$ser.MaxJsonLength = 20000000

function Send-SQL {
    param([string]$ProjectRef, [string]$Sql, [string]$Label)
    $payload = @{ query = $Sql }
    $json = $ser.Serialize($payload)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $req = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ProjectRef/database/query")
    $req.Method = "POST"; $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length; $req.Timeout = 120000
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    try {
        $body = (New-Object System.IO.StreamReader($req.GetResponse().GetResponseStream())).ReadToEnd()
        Write-Host "  [$ProjectRef] $Label OK (resp: $($body.Length) chars)" -ForegroundColor Green
        return $true
    } catch [System.Net.WebException] {
        $err = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
        $short = if ($err.Length -gt 300) { $err.Substring(0, 300) } else { $err }
        Write-Host "  [$ProjectRef] $Label ERROR: $short" -ForegroundColor Red
        return $false
    }
}

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"

Write-Host "`n=== Seed v5 -> TEST ===" -ForegroundColor Cyan
$r1 = Send-SQL -ProjectRef $TEST -Sql $seedSql -Label "SEED v5 (208 entries)"

Write-Host "`n=== Seed v5 -> LIVE ===" -ForegroundColor Cyan
$r2 = Send-SQL -ProjectRef $LIVE -Sql $seedSql -Label "SEED v5 (208 entries)"

# Verify counts
Write-Host "`n=== Final counts ===" -ForegroundColor Cyan
$countSql = "SELECT COUNT(*) as total FROM es_dictionary WHERE user_id IS NULL"
$cntBytes = [System.Text.Encoding]::UTF8.GetBytes($ser.Serialize(@{ query = $countSql }))

function Get-Count([string]$ref) {
    $rq = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ref/database/query")
    $rq.Method="POST"; $rq.ContentType="application/json"; $rq.Headers.Add("Authorization","Bearer $token"); $rq.ContentLength=$cntBytes.Length
    $st=$rq.GetRequestStream(); $st.Write($cntBytes,0,$cntBytes.Length); $st.Close()
    try { return (New-Object System.IO.StreamReader($rq.GetResponse().GetResponseStream())).ReadToEnd() } catch { return "ERROR" }
}

Write-Host "TEST: $(Get-Count $TEST)"
Write-Host "LIVE: $(Get-Count $LIVE)"

if ($r1 -and $r2) { Write-Host "`nALL DONE" -ForegroundColor Green }
else { Write-Host "`nPartial - check errors above" -ForegroundColor Yellow }
