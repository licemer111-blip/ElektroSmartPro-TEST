/**
 * Find other users who can send invitations
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findUsers() {
  console.log('🔍 Finding users and their projects...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, company_name')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`📋 Found ${profiles?.length || 0} users:\n`);

  if (!profiles || profiles.length === 0) {
    console.log('❌ No users found!');
    return;
  }

  for (const profile of profiles) {
    console.log(`👤 ${profile.email || 'No email'}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Company: ${profile.company_name || 'Not set'}`);

    // Get projects owned by this user
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', profile.id);

    if (projects && projects.length > 0) {
      console.log(`   Projects: ${projects.length}`);
      projects.forEach(p => {
        console.log(`      - "${p.name}" (${p.id})`);
      });
    } else {
      console.log(`   Projects: 0`);
    }
    console.log('');
  }

  // Suggest action
  console.log('\n🔧 TO TEST SHARED PROJECTS:');
  console.log('1. Log in as a user WHO IS NOT licemer93@gmail.com');
  console.log('2. Open one of THEIR projects');
  console.log('3. Click "Uczestnicy" (Members)');
  console.log('4. Invite: licemer93@gmail.com');
  console.log('5. Log out and log in as licemer93@gmail.com');
  console.log('6. Accept the invitation');
  console.log('7. Then the shared project should appear!');
}

findUsers().catch(err => {
  console.error('💥 ERROR:', err);
  process.exit(1);
});
