Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCredV4 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public UInt32 Flags;
        public UInt32 Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize;
        public IntPtr CredentialBlob;
        public UInt32 Persist;
        public UInt32 AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
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

$token = [WinCredV4]::GetPassword("Supabase CLI:supabase")
if (-not $token) {
    Write-Host "ERROR: Token not found" -ForegroundColor Red
    exit 1
}
Write-Host "Token OK: $($token.Substring(0, 20))..." -ForegroundColor Green

$seedPath = Join-Path $PSScriptRoot "..\supabase\migrations\20260304_seed_es_dictionary_v4.sql"
$seedSql = Get-Content $seedPath -Raw -Encoding UTF8
Write-Host "SQL loaded: $([Math]::Round($seedSql.Length / 1024, 1)) KB" -ForegroundColor Cyan

Add-Type -AssemblyName System.Web.Extensions
$ser = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
$ser.MaxJsonLength = 50000000

function Apply-SQL {
    param([string]$ProjectRef, [string]$Sql, [string]$Label)
    $payload = @{ query = $Sql }
    $json = $ser.Serialize($payload)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

    $req = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$ProjectRef/database/query")
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.ContentLength = $bytes.Length
    $req.Timeout = 180000

    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()

    try {
        $resp = $req.GetResponse()
        $body = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
        Write-Host "  [$ProjectRef] $Label -> OK (resp: $($body.Length) chars)" -ForegroundColor Green
        return $true
    } catch [System.Net.WebException] {
        $err = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
        $short = if ($err.Length -gt 400) { $err.Substring(0, 400) } else { $err }
        Write-Host "  [$ProjectRef] $Label -> ERROR: $short" -ForegroundColor Red
        return $false
    }
}

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"

Write-Host "`n=== Seed v4 -> TEST ===" -ForegroundColor Cyan
$r1 = Apply-SQL -ProjectRef $TEST -Sql $seedSql -Label "SEED v4 (2103 entries)"

Write-Host "`n=== Seed v4 -> LIVE ===" -ForegroundColor Cyan
$r2 = Apply-SQL -ProjectRef $LIVE -Sql $seedSql -Label "SEED v4 (2103 entries)"

Write-Host ""
if ($r1 -and $r2) {
    Write-Host "ALL DONE — seed v4 applied to TEST + LIVE" -ForegroundColor Green
} else {
    Write-Host "Partial — check errors above" -ForegroundColor Yellow
}
