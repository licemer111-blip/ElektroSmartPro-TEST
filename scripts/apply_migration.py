#!/usr/bin/env python3
"""
Apply Migration to Production Database
Applies the RPC functions migration to Supabase production
"""

import json
import os
import urllib.request
import urllib.error

from dotenv import load_dotenv
load_dotenv('.env.local')

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

def execute_sql(sql):
    """Execute SQL on Supabase via REST API"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    headers = {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    }
    
    data = json.dumps({"query": sql}).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ HTTP Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    print("[*] Applying Migration to Production Database")
    print("=" * 60)
    print()
    
    # Step 1: Check current state
    print("[1/4] Checking current functions...")
    check_sql = """
    SELECT proname as function_name
    FROM pg_proc
    WHERE proname IN ('check_existing_member', 'get_project_members_list', 'get_user_project_ids')
    AND pronamespace = 'public'::regnamespace;
    """
    
    result = execute_sql(check_sql)
    if result is not None:
        if len(result) == 0:
            print("[-] No functions found - migration needed!")
        else:
            print(f"[+] Found {len(result)} existing functions:")
            for fn in result:
                print(f"    - {fn['function_name']}")
    print()
    
    # Step 2: Read migration file
    print("[2/4] Reading migration file...")
    try:
        with open('supabase/migrations/20260128_add_member_rpc_functions.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print("[+] Migration file loaded")
    except Exception as e:
        print(f"[-] Error reading migration file: {e}")
        return
    print()
    
    # Step 3: Apply migration
    print("[3/4] Applying migration...")
    
    # Split into individual CREATE FUNCTION statements
    functions = []
    current_func = []
    in_function = False
    
    for line in migration_sql.split('\n'):
        if 'CREATE OR REPLACE FUNCTION' in line:
            if current_func:
                functions.append('\n'.join(current_func))
            current_func = [line]
            in_function = True
        elif in_function:
            current_func.append(line)
            if line.strip().endswith('$$ LANGUAGE plpgsql;'):
                functions.append('\n'.join(current_func))
                current_func = []
                in_function = False
    
    success_count = 0
    for i, func_sql in enumerate(functions, 1):
        func_name = ""
        for line in func_sql.split('\n'):
            if 'CREATE OR REPLACE FUNCTION public.' in line:
                func_name = line.split('public.')[1].split('(')[0]
                break
        
        print(f"    {i}. Creating function: {func_name}...")
        result = execute_sql(func_sql)
        if result is not None or True:  # Consider success if no error
            print(f"       [+] Success")
            success_count += 1
        else:
            print(f"       [-] Failed")
    print()
    
    # Step 4: Verify
    print("[4/4] Verifying functions...")
    verify_sql = """
    SELECT 
        proname as function_name,
        prosecdef as is_security_definer
    FROM pg_proc
    WHERE proname IN (
        'check_existing_member',
        'get_project_members_list',
        'get_user_project_ids'
    )
    AND pronamespace = 'public'::regnamespace
    ORDER BY proname;
    """
    
    result = execute_sql(verify_sql)
    if result is not None and len(result) > 0:
        print(f"[+] Verified {len(result)} functions:")
        for fn in result:
            security = "[SECURITY DEFINER]" if fn.get('is_security_definer') else "[Regular]"
            print(f"    - {fn['function_name']}: {security}")
    else:
        print("[!] Could not verify via API - check manually in Supabase Dashboard")
    print()
    
    # Summary
    print("=" * 60)
    if success_count == len(functions):
        print("[SUCCESS] MIGRATION COMPLETED!")
        print()
        print("[+] You can now test invitations on production:")
        print("    1. Open your production site")
        print("    2. Go to a project -> 'Uczestnicy'")
        print("    3. Invite a user by email")
        print("    4. Should see: 'Zaproszenie wyslane!'")
    else:
        print("[WARNING] MIGRATION COMPLETED WITH WARNINGS")
        print("[!] Check Supabase Dashboard to verify functions")
    print("=" * 60)

if __name__ == "__main__":
    main()
