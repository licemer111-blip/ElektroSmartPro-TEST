Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCred3 {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public UInt32 Flags; public UInt32 Type; public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize; public IntPtr CredentialBlob;
        public UInt32 Persist; public UInt32 AttributeCount; public IntPtr Attributes;
        public string TargetAlias; public string UserName;
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
        string result = Encoding.Unicode.GetString(bytes).TrimEnd('\0');
        bool isAscii = true;
        foreach (char c in result) { if (c > 127) { isAscii = false; break; } }
        if (!isAscii) result = Encoding.UTF8.GetString(bytes).TrimEnd('\0');
        return result;
    }
}
'@

$token = [WinCred3]::GetPassword("Supabase CLI:supabase")
if (-not $token) {
    Write-Host "TOKEN_NOT_FOUND - zaloguj sie: npx supabase login"
    exit 1
}

Write-Host "Token found: $($token.Substring(0, [Math]::Min(20, $token.Length)))..."

$sqlFile = Join-Path $PSScriptRoot "..\supabase\migrations\20260224_catalog_audit_logs.sql"
$sql = Get-Content $sqlFile -Raw -Encoding UTF8

Add-Type -AssemblyName System.Web.Extensions

function Invoke-SupabaseSQL {
    param([string]$ProjectRef, [string]$Sql, [string]$Token)
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
        Write-Host "[$ProjectRef] SUCCESS"
        return $true
    } catch [System.Net.WebException] {
        $errReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "[$ProjectRef] ERROR: $($errReader.ReadToEnd())"
        return $false
    }
}

Write-Host "`n=== Applying catalog_audit_logs to TEST (upwctgdpuckreoquofiu) ==="
$r1 = Invoke-SupabaseSQL -ProjectRef "upwctgdpuckreoquofiu" -Sql $sql -Token $token

Write-Host "`n=== Applying catalog_audit_logs to LIVE (jbxveulddoznswyeihda) ==="
$r2 = Invoke-SupabaseSQL -ProjectRef "jbxveulddoznswyeihda" -Sql $sql -Token $token

if ($r1 -and $r2) {
    Write-Host "`nALL DONE - catalog_audit_logs applied to both projects"
} else {
    Write-Host "`nPartial success - check errors above"
}
