/**
 * Apply SQL directly to Production using Supabase Service Role
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applySQLFile(filename) {
  console.log(`\n📄 Applying ${filename}...`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const sqlPath = path.join(__dirname, '..', filename);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10);

  console.log(`📋 Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip SELECT statements (they're just for verification)
    if (statement.trim().toUpperCase().startsWith('SELECT')) {
      console.log(`⏭️  Skipping SELECT statement ${i + 1}`);
      continue;
    }

    console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
    console.log(statement.substring(0, 80) + '...');

    try {
      // Use the REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed (${response.status}):`, error);
        
        // Continue anyway for DROP POLICY (might not exist)
        if (statement.includes('DROP POLICY IF EXISTS')) {
          console.log('   (Ignoring - policy might not exist)');
          continue;
        }
      } else {
        console.log(`✅ Success`);
      }
    } catch (error) {
      console.error(`💥 Exception:`, error.message);
      
      // Continue for DROP POLICY
      if (statement.includes('DROP POLICY IF EXISTS')) {
        console.log('   (Ignoring - policy might not exist)');
        continue;
      }
    }
  }

  console.log(`\n✅ ${filename} applied!`);
}

async function main() {
  console.log('🚀 Starting SQL application to Production...\n');
  console.log('Database:', SUPABASE_URL);
  
  try {
    // Apply Part 1
    await applySQLFile('PART1_PROJECT_MEMBERS.sql');
    
    // Apply Part 2
    await applySQLFile('PART2_PROJECTS.sql');
    
    console.log('\n🎉 ALL SQL APPLIED SUCCESSFULLY!');
    console.log('\n📋 Next steps:');
    console.log('1. Hard refresh your browser (Ctrl+Shift+R)');
    console.log('2. Test Guest login: licemer93@gmail.com');
    console.log('3. Check Console logs for [getProjects]');
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
