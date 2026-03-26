Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCred2 {
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

Add-Type -AssemblyName System.Web.Extensions

$token = [WinCred2]::GetPassword("Supabase CLI:supabase")

function Invoke-SQL {
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
        return $reader.ReadToEnd()
    } catch [System.Net.WebException] {
        $errReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        return "ERROR: " + $errReader.ReadToEnd()
    }
}

$verifySql = @"
SELECT panel_category, COUNT(*) AS cnt,
       ROUND(AVG(base_material_price),0) AS avg_mat,
       ROUND(AVG(base_labor_price),0) AS avg_lab
FROM catalog_items
WHERE catalog_confidence = 'verified' AND panel_category IS NOT NULL AND user_id IS NULL
GROUP BY panel_category ORDER BY panel_category;
"@

Write-Host "=== TEST DB coverage ==="
$r = Invoke-SQL -ProjectRef "upwctgdpuckreoquofiu" -Sql $verifySql -Token $token
$data = ([System.Web.Script.Serialization.JavaScriptSerializer]::new()).DeserializeObject($r)
if ($data -is [System.Collections.IEnumerable]) {
    foreach ($row in $data) {
        Write-Host ("  {0,-20} cnt={1,3}  mat={2,5} lab={3,5}" -f $row['panel_category'], $row['cnt'], $row['avg_mat'], $row['avg_lab'])
    }
} else {
    Write-Host $r
}
