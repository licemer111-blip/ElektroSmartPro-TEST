@echo off
echo ========================================
echo Applying Migration to Production
echo ========================================
echo.
echo Project: jbxveulddoznswyeihda
echo Migration: 20260128_add_member_rpc_functions.sql
echo.

REM Set connection parameters
set PGHOST=aws-0-eu-central-1.pooler.supabase.com
set PGPORT=5432
set PGDATABASE=postgres
set PGUSER=postgres.jbxveulddoznswyeihda
set PGPASSWORD=your-db-password-here

echo Connecting to production database...
echo.

REM Check if psql is available
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] psql not found!
    echo.
    echo Please install PostgreSQL client or use the manual method:
    echo 1. Open: https://supabase.com/dashboard/project/jbxveulddoznswyeihda
    echo 2. Go to SQL Editor
    echo 3. Copy contents from: supabase\migrations\20260128_add_member_rpc_functions.sql
    echo 4. Paste and Run
    echo.
    pause
    exit /b 1
)

echo Applying migration...
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "supabase\migrations\20260128_add_member_rpc_functions.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Migration Applied!
    echo ========================================
    echo.
    echo You can now test invitations on production:
    echo 1. Open your production site
    echo 2. Go to a project -^> 'Uczestnicy'
    echo 3. Invite a user by email
    echo 4. Should see: 'Zaproszenie wyslane!'
    echo.
) else (
    echo.
    echo ========================================
    echo [ERROR] Migration Failed!
    echo ========================================
    echo.
    echo Please use the manual method:
    echo 1. Open: https://supabase.com/dashboard/project/jbxveulddoznswyeihda
    echo 2. Go to SQL Editor
    echo 3. Copy contents from: supabase\migrations\20260128_add_member_rpc_functions.sql
    echo 4. Paste and Run
    echo.
)

pause
