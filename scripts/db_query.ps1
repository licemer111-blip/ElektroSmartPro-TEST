Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WC3 {
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
        string r = Encoding.Unicode.GetString(b).TrimEnd('\0');
        bool ok = true;
        foreach (char ch in r) { if (ch > 127) { ok = false; break; } }
        if (!ok) r = Encoding.UTF8.GetString(b).TrimEnd('\0');
        return r;
    }
}
'@
Add-Type -AssemblyName System.Web.Extensions

$token = [WC3]::Get("Supabase CLI:supabase")
$proj = $args[0]
$sql = $args[1]

$uri = "https://api.supabase.com/v1/projects/$proj/database/query"
$jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$jss.MaxJsonLength = 5000000
$bytes = [System.Text.Encoding]::UTF8.GetBytes($jss.Serialize(@{ query = $sql }))
$req = [System.Net.HttpWebRequest]::Create($uri)
$req.Method = "POST"
$req.ContentType = "application/json"
$req.Headers.Add("Authorization", "Bearer $token")
$req.ContentLength = $bytes.Length
$s = $req.GetRequestStream()
$s.Write($bytes, 0, $bytes.Length)
$s.Close()
try {
    $r = $req.GetResponse()
    $rd = New-Object System.IO.StreamReader($r.GetResponseStream())
    Write-Host $rd.ReadToEnd()
} catch [System.Net.WebException] {
    $er = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host ("ERR: " + $er.ReadToEnd())
}
