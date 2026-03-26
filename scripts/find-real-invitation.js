/**
 * Find REAL guest invitations (not owner)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findInvitations() {
  console.log('🔍 Finding REAL guest invitations...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get licemer93@gmail.com user ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'licemer93@gmail.com')
    .single();

  if (!profile) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✅ User ID:', profile.id);
  console.log('✅ Email:', profile.email);

  // Get ALL memberships (including ALL roles)
  console.log('\n📋 ALL MEMBERSHIPS for this user:');
  const { data: allMemberships } = await supabase
    .from('project_members')
    .select(`
      id,
      project_id,
      user_id,
      role,
      status,
      invited_at,
      accepted_at,
      invited_by,
      projects:project_id (
        id,
        name,
        user_id
      )
    `)
    .eq('user_id', profile.id)
    .order('invited_at', { ascending: false });

  if (!allMemberships || allMemberships.length === 0) {
    console.log('❌ NO MEMBERSHIPS FOUND!');
    console.log('\n🔧 ACTION: Owner needs to send invitation first!');
    return;
  }

  console.log(`\nFound ${allMemberships.length} membership(s):\n`);

  allMemberships.forEach((m, i) => {
    console.log(`${i + 1}. Project: "${m.projects?.name}" (ID: ${m.project_id})`);
    console.log(`   Role: ${m.role}`);
    console.log(`   Status: ${m.status}`);
    console.log(`   Invited at: ${m.invited_at}`);
    console.log(`   Accepted at: ${m.accepted_at || 'Not accepted'}`);
    console.log(`   Project owner: ${m.projects?.user_id}`);
    console.log(`   Guest user: ${m.user_id}`);
    console.log(`   IS OWNER: ${m.projects?.user_id === m.user_id ? '✅ YES (own project)' : '❌ NO (shared project)'}`);
    console.log('');
  });

  // Filter REAL guest invitations (where user is NOT the project owner)
  const guestMemberships = allMemberships.filter(m => 
    m.projects?.user_id !== m.user_id && m.role !== 'owner'
  );

  console.log('\n🎯 REAL GUEST MEMBERSHIPS (not owner):');
  if (guestMemberships.length === 0) {
    console.log('❌ NO GUEST MEMBERSHIPS FOUND!');
    console.log('\n🔧 EXPLANATION:');
    console.log('   The user is only OWNER of their own projects.');
    console.log('   There are NO invitations where they are a GUEST.');
    console.log('\n🔧 ACTION NEEDED:');
    console.log('   1. Log in as DIFFERENT user (project owner)');
    console.log('   2. Invite licemer93@gmail.com as guest/member');
    console.log('   3. Then test shared project visibility');
  } else {
    console.log(`✅ Found ${guestMemberships.length} real guest membership(s):`);
    guestMemberships.forEach((m, i) => {
      console.log(`\n${i + 1}. Project: "${m.projects?.name}"`);
      console.log(`   Role: ${m.role}`);
      console.log(`   Status: ${m.status}`);
      console.log(`   ${m.status === 'active' ? '✅ ACTIVE - should be visible!' : '⚠️ NOT ACTIVE - needs accept'}`);
    });

    // Check if any active guest memberships exist
    const activeGuests = guestMemberships.filter(m => m.status === 'active');
    if (activeGuests.length > 0) {
      console.log('\n⚠️  CRITICAL ISSUE:');
      console.log('   User HAS active guest memberships');
      console.log('   BUT projects are NOT showing');
      console.log('\n🔧 ROOT CAUSE:');
      console.log('   RLS policy "Members can view projects" is MISSING or BROKEN');
      console.log('\n🔧 FIX:');
      console.log('   Apply SINGLE_LINE_FIX.sql to add the policy');
    }
  }
}

findInvitations().catch(err => {
  console.error('💥 ERROR:', err);
  process.exit(1);
});
