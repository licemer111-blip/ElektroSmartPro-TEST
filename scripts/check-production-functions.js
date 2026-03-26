// Check Production Database Functions
// This script checks if the required RPC functions exist

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkFunctions() {
  console.log("🔍 Checking production database functions...\n");

  const query = `
    SELECT 
      proname as function_name,
      prosecdef as is_security_definer
    FROM pg_proc
    WHERE proname IN (
      'check_existing_member',
      'get_project_members_list',
      'get_user_project_ids',
      'has_project_access',
      'get_project_role',
      'create_owner_membership'
    )
    AND pronamespace = 'public'::regnamespace
    ORDER BY proname;
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      // Try alternative approach using pg_catalog
      console.log("⚠️ RPC endpoint not available, using direct query...\n");
      
      const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/pg_catalog`);
      const altResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          sql: query
        }),
      });

      if (!altResponse.ok) {
        console.log("❌ Cannot check functions via REST API");
        console.log("📋 Required functions to check:");
        console.log("   - check_existing_member");
        console.log("   - get_project_members_list");
        console.log("   - get_user_project_ids");
        console.log("\n💡 Proceeding with migration...\n");
        return;
      }

      const data = await altResponse.json();
      displayResults(data);
    } else {
      const data = await response.json();
      displayResults(data);
    }
  } catch (error) {
    console.log("⚠️ Error checking functions:", error.message);
    console.log("💡 Proceeding with migration anyway...\n");
  }
}

function displayResults(data) {
  if (!data || data.length === 0) {
    console.log("❌ No functions found! Migration needed.\n");
    console.log("📋 Missing functions:");
    console.log("   - check_existing_member");
    console.log("   - get_project_members_list");
    console.log("   - get_user_project_ids");
  } else {
    console.log("✅ Found functions:\n");
    data.forEach(fn => {
      const securityStatus = fn.is_security_definer ? "✅ SECURITY DEFINER" : "⚠️ Regular";
      console.log(`   - ${fn.function_name}: ${securityStatus}`);
    });
  }
  console.log("");
}

checkFunctions();
