# Client Data Fields Migration

## Overview
This migration adds client/investor data fields to the `projects` table for PDF generation.

## New Fields
- `client_name` (TEXT) - Client or investor name (individual or company)
- `client_address` (TEXT) - Client address
- `client_nip` (VARCHAR(20)) - Client NIP (tax identification number)

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content of `20260117_add_client_fields.sql`
4. Click **Run**

### Option 2: Supabase CLI
```bash
supabase db push
```

## Verification
After applying the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('client_name', 'client_address', 'client_nip');
```

## UI Changes
The "Create Project" modal now includes a "Dane Inwestora / Klienta" section with:
- Client Name input
- Client Address input
- Client NIP input

All fields are optional and will be included in generated PDFs.
