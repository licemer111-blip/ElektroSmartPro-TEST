Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCredKnr {
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

$token = [WinCredKnr]::GetPassword("Supabase CLI:supabase")
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

$structureSql    = Get-Content (Join-Path $migrDir "20260306_create_knr_catalog_structure.sql")    -Raw -Encoding UTF8
$zestAwySql      = Get-Content (Join-Path $migrDir "20260306_seed_knr_to_materials_zestawy.sql")   -Raw -Encoding UTF8
$uniqueConstrSql = Get-Content (Join-Path $migrDir "20260306_knr_norms_unique_constraint.sql")     -Raw -Encoding UTF8

$TEST = "upwctgdpuckreoquofiu"
$LIVE = "jbxveulddoznswyeihda"

Write-Host "`n=== Applying to TEST ($TEST) ===" -ForegroundColor Cyan
$t1 = Invoke-SupabaseSQL -ProjectRef $TEST -Sql $structureSql    -Token $token -Label "knr_norms + knr_to_materials + regional_coefficients (tables + seed)"
$t2 = Invoke-SupabaseSQL -ProjectRef $TEST -Sql $zestAwySql      -Token $token -Label "knr_to_materials Zestawy seed (5 zestawow)"
$t3 = Invoke-SupabaseSQL -ProjectRef $TEST -Sql $uniqueConstrSql -Token $token -Label "knr_norms UNIQUE constraint (catalog_code, table_number, column_number)"

Write-Host "`n=== Applying to LIVE ($LIVE) ===" -ForegroundColor Cyan
$l1 = Invoke-SupabaseSQL -ProjectRef $LIVE -Sql $structureSql    -Token $token -Label "knr_norms + knr_to_materials + regional_coefficients (tables + seed)"
$l2 = Invoke-SupabaseSQL -ProjectRef $LIVE -Sql $zestAwySql      -Token $token -Label "knr_to_materials Zestawy seed (5 zestawow)"
$l3 = Invoke-SupabaseSQL -ProjectRef $LIVE -Sql $uniqueConstrSql -Token $token -Label "knr_norms UNIQUE constraint (catalog_code, table_number, column_number)"

Write-Host ""
if ($t1 -and $t2 -and $t3 -and $l1 -and $l2 -and $l3) {
    Write-Host "ALL DONE - KNR catalog structure applied to TEST + LIVE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tabele utworzone:" -ForegroundColor White
    Write-Host "  - knr_norms          (51 norm: KNR 5-08/5-10/5-12/4-03/5-06)" -ForegroundColor White
    Write-Host "  - knr_to_materials   (Zestawy M2M: gniazdo/oswietlenie/LAN/TV/rozdzielnica)" -ForegroundColor White
    Write-Host "  - regional_coefficients (16 wojewodztw, multiplier TYLKO na robocizne)" -ForegroundColor White
    Write-Host "  - UNIQUE(catalog_code, table_number, column_number) -- ON CONFLICT support" -ForegroundColor White
    Write-Host ""
    Write-Host "Uruchom testy regresji:" -ForegroundColor Yellow
    Write-Host "  npx vitest run tests/knr-catalog.test.ts" -ForegroundColor Yellow
} else {
    Write-Host "Partial success - check errors above" -ForegroundColor Yellow
}
