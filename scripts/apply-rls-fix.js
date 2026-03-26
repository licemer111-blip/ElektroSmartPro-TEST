/**
 * 🚨 CRITICAL FIX: Apply RLS policy to Production
 * This script applies the RLS fix directly to production database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyRLSFix() {
  console.log('🔧 Connecting to Production Supabase...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read SQL file
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260128_fix_rls_insert_with_check.sql');
  console.log('📄 Reading SQL from:', sqlPath);
  
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📤 Executing SQL migration...');
  console.log('SQL length:', sql.length, 'characters');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📋 Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments and SELECT statements used for verification
    if (statement.includes('--') || statement.trim().startsWith('SELECT')) {
      console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
      continue;
    }

    console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
    console.log(statement.substring(0, 100) + '...');

    try {
      // Execute via RPC
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
      }
    } catch (e) {
      console.error(`💥 Exception in statement ${i + 1}:`, e.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount === 0) {
    console.log('\n🎉 SUCCESS! RLS policies have been fixed on Production!');
    console.log('👉 Now test the invite function at: https://elektrosmart-pro.vercel.app');
  } else {
    console.log('\n⚠️  Some statements failed. Please review the errors above.');
    console.log('📋 Alternative: Copy SQL manually to Supabase Dashboard');
    console.log('👉 https://supabase.com/dashboard/project/jbxveulddoznswyeihda/sql/new');
  }
}

// Run
applyRLSFix().catch(err => {
  console.error('💥 FATAL ERROR:', err);
  process.exit(1);
});
