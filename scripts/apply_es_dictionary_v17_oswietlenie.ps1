Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCredOsw {
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
        string result = Encoding.Unicode.GetString(bytes).TrimEnd('\0');
        bool isAscii = true;
        foreach (char c in result) { if (c > 127) { isAscii = false; break; } }
        if (!isAscii) result = Encoding.UTF8.GetString(bytes).TrimEnd('\0');
        return result;
    }
}
'@

$token = [WinCredOsw]::GetPassword("Supabase CLI:supabase")
if (-not $token) {
    Write-Host "ERROR: Supabase token not found in Windows Credential Manager." -ForegroundColor Red
    Write-Host "Run 'supabase login' first, then retry." -ForegroundColor Yellow
    exit 1
}

Write-Host "Token found: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green

Add-Type -AssemblyName System.Web.Extensions

function Invoke-SupabaseSQL {
    param([string]$ProjectRef, [string]$Sql, [string]$Token, [string]$Label)

    $uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(
        ([System.Web.Script.Serialization.JavaScriptSerializer]::new()).Serialize(@{ query = $Sql })
    )

    $request = [System.Net.HttpWebRequest]::Create($uri)
    $request.Method = "POST"
    $request.ContentType = "application/json"
    $request.Headers.Add("Authorization", "Bearer $Token")
    $request.ContentLength = $jsonBytes.Length

    $stream = $request.GetRequestStream()
    $stream.Write($jsonBytes, 0, $jsonBytes.Length)
    $stream.Close()

    try {
        $response = $request.GetResponse()
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "  [$ProjectRef] $Label OK: $($body.Substring(0, [Math]::Min(120, $body.Length)))" -ForegroundColor Green
        return $true
    } catch [System.Net.WebException] {
        $errReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $errReader.ReadToEnd()
        Write-Host "  [$ProjectRef] $Label ERROR: $errBody" -ForegroundColor Red
        return $false
    }
}

$migrDir = Join-Path $PSScriptRoot "..\supabase\migrations"

$sql = Get-Content (Join-Path $migrDir "20260311_seed_es_dictionary_v17_oswietlenie.sql") -Raw -Encoding UTF8

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"

Write-Host "`n=== Applying to TEST ($TEST) ===" -ForegroundColor Cyan
$t1 = Invoke-SupabaseSQL -ProjectRef $TEST -Sql $sql -Token $token -Label "SEED v17-oswietlenie (oswietlenie_podstawowe + awaryjne - 60 entries)"

Write-Host "`n=== Applying to LIVE ($LIVE) ===" -ForegroundColor Cyan
$l1 = Invoke-SupabaseSQL -ProjectRef $LIVE -Sql $sql -Token $token -Label "SEED v17-oswietlenie (60 entries)"

Write-Host ""
if ($t1 -and $l1) {
    Write-Host "ALL DONE - v17-oswietlenie applied to TEST + LIVE" -ForegroundColor Green
} else {
    Write-Host "Partial success - check errors above" -ForegroundColor Yellow
}
