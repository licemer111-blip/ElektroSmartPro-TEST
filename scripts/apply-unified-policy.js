/**
 * Apply unified RLS policy via direct SQL execution
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyPolicy() {
  console.log('🔧 Applying unified RLS policy...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Read SQL
  const sql = fs.readFileSync('./FIX_RLS_UNIFIED_POLICY.sql', 'utf8');
  
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && s.length > 10 && !s.startsWith('--'));

  console.log(`📋 Executing ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip SELECT statements
    if (stmt.toUpperCase().startsWith('SELECT')) {
      console.log(`⏭️  Skipping verification SELECT ${i + 1}`);
      continue;
    }

    const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
    console.log(`⚡ ${i + 1}. ${preview}...`);

    try {
      // Use rpc if available, otherwise try direct query
      const { error } = await supabase.rpc('exec', { query: stmt + ';' });
      
      if (error) {
        console.log(`   ⚠️  RPC not available, trying fallback...`);
        
        // Fallback: For DROP/CREATE POLICY, we can't execute via REST API
        // But we can at least log success for the attempt
        if (stmt.includes('DROP POLICY') || stmt.includes('CREATE POLICY') || stmt.includes('ALTER TABLE')) {
          console.log(`   ℹ️  Policy statement queued (manual application needed)`);
        } else {
          console.log(`   ❌ Error:`, error.message);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`);
    }
  }

  console.log('\n🔍 Verifying current policies...\n');
  
  // Try to fetch policies
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('policyname, cmd')
    .eq('tablename', 'projects');

  if (!policyError && policies) {
    console.log('📋 Current policies on projects table:');
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  }

  console.log('\n⚠️  NOTE: Supabase REST API cannot execute DDL statements.');
  console.log('📋 Please apply FIX_RLS_UNIFIED_POLICY.sql manually via:');
  console.log('   https://supabase.com/dashboard/project/jbxveulddoznswyeihda/sql/new');
}

applyPolicy().catch(err => {
  console.error('💥 ERROR:', err);
  process.exit(1);
});
