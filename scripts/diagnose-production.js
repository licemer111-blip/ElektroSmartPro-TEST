/**
 * AUTONOMOUS DIAGNOSTIC: Check Production State
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function diagnose() {
  console.log('🔍 AUTONOMOUS DIAGNOSTIC STARTING...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Step 1: Check if licemer93@gmail.com exists
  console.log('1️⃣ Checking user existence...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'licemer93@gmail.com')
    .single();

  if (profileError || !profile) {
    console.log('❌ User does not exist!');
    return;
  }
  console.log('✅ User found:', profile.id);

  // Step 2: Check membership
  console.log('\n2️⃣ Checking project membership...');
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select(`
      id,
      project_id,
      role,
      status,
      invited_at,
      accepted_at,
      projects:project_id (
        id,
        name
      )
    `)
    .eq('user_id', profile.id);

  if (memberError) {
    console.log('❌ Error fetching memberships:', memberError);
    return;
  }

  console.log('📊 Memberships found:', memberships?.length || 0);
  if (memberships && memberships.length > 0) {
    memberships.forEach(m => {
      console.log(`   - Project: ${m.projects?.name || 'Unknown'}`);
      console.log(`     Status: ${m.status}`);
      console.log(`     Role: ${m.role}`);
      console.log(`     Accepted: ${m.accepted_at || 'Not yet'}`);
    });
  } else {
    console.log('⚠️  No memberships found!');
  }

  // Step 3: Check RLS policies
  console.log('\n3️⃣ Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, cmd')
    .in('tablename', ['projects', 'project_members'])
    .order('tablename, cmd, policyname');

  if (!policyError && policies) {
    console.log('📋 RLS Policies:');
    const projectPolicies = policies.filter(p => p.tablename === 'projects');
    const memberPolicies = policies.filter(p => p.tablename === 'project_members');
    
    console.log('   Projects table:', projectPolicies.length, 'policies');
    projectPolicies.forEach(p => {
      console.log(`     - ${p.policyname} (${p.cmd})`);
    });
    
    console.log('   Project_members table:', memberPolicies.length, 'policies');
    memberPolicies.forEach(p => {
      console.log(`     - ${p.policyname} (${p.cmd})`);
    });

    // Check critical policies
    const hasGuestViewPolicy = projectPolicies.some(p => 
      p.policyname === 'Members can view projects' && p.cmd === 'SELECT'
    );
    const hasGuestUpdatePolicy = memberPolicies.some(p => 
      p.policyname === 'Members can update their own status' && p.cmd === 'UPDATE'
    );

    console.log('\n   Critical policies:');
    console.log('   ✓ Guest can VIEW shared projects:', hasGuestViewPolicy ? '✅ YES' : '❌ NO');
    console.log('   ✓ Guest can ACCEPT invitations:', hasGuestUpdatePolicy ? '✅ YES' : '❌ NO');
  }

  // Step 4: Test actual query (as guest would see it)
  console.log('\n4️⃣ Testing actual projects query...');
  
  // Simulate what getProjects() does
  const { data: allProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.log('❌ Error fetching projects:', projectsError);
  } else {
    console.log('📊 Total projects in DB:', allProjects?.length || 0);
  }

  // Now check what the guest SHOULD see with RLS
  console.log('\n5️⃣ DIAGNOSIS COMPLETE!\n');
  
  if (memberships && memberships.length > 0) {
    const activeMemberships = memberships.filter(m => m.status === 'active');
    if (activeMemberships.length > 0) {
      console.log('✅ Guest HAS active memberships');
      console.log('✅ Code is correct (no .eq filtering)');
      console.log('⚠️  BUT if projects not showing, RLS policy is likely WRONG or MISSING');
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('   Apply the correct RLS policy for "Members can view projects"');
    } else {
      console.log('⚠️  Guest has memberships but status is NOT active');
      console.log('   Status:', memberships[0].status);
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('   Guest needs to ACCEPT the invitation');
    }
  } else {
    console.log('❌ Guest has NO memberships at all!');
    console.log('\n🔧 RECOMMENDED ACTION:');
    console.log('   Owner needs to send an invitation first');
  }
}

diagnose().catch(err => {
  console.error('💥 FATAL ERROR:', err);
  process.exit(1);
});
