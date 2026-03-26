# UPSERT Migration - How to Apply

## Problem

The UPSERT optimization requires a unique constraint on `catalog_items(user_id, name)`, but the migration hasn't been applied yet to the production database.

**Error seen:**
```
code: '42P10',
message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
```

## Current Status

✅ **Code:** Reverted to bulk insert (working)
⏳ **Migration:** Ready but not applied
📋 **Migration File:** `20260117_add_catalog_items_unique_constraint.sql`

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended for Production)

1. **Login to Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL:**
   ```sql
   -- Remove any existing duplicates (if any)
   DELETE FROM catalog_items a
   USING catalog_items b
   WHERE a.id > b.id
     AND a.user_id = b.user_id
     AND a.name = b.name;

   -- Add unique constraint
   ALTER TABLE catalog_items
   ADD CONSTRAINT catalog_items_user_name_unique UNIQUE (user_id, name);

   -- Create index for faster lookups
   CREATE INDEX IF NOT EXISTS idx_catalog_items_user_name 
   ON catalog_items(user_id, name);
   ```

4. **Run Query:**
   - Click "Run" button
   - Wait for success message

5. **Verify:**
   ```sql
   -- Check constraint exists
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'catalog_items'::regclass 
   AND conname = 'catalog_items_user_name_unique';

   -- Check index exists
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'catalog_items' 
   AND indexname = 'idx_catalog_items_user_name';
   ```

### Option 2: Supabase CLI (For Local Development)

1. **Ensure Supabase CLI is installed:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Apply migration:**
   ```bash
   supabase db push
   ```

### Option 3: Manual SQL (Quick Fix)

If you have direct database access:

```bash
psql YOUR_DATABASE_URL -f supabase/migrations/20260117_add_catalog_items_unique_constraint.sql
```

## After Migration is Applied

Once the migration is successfully applied, you can switch back to UPSERT for better performance:

### Update Code to Use UPSERT

The UPSERT version is documented in `docs/UPSERT_OPTIMIZATION.md` and provides:
- 25% fewer queries (4 → 3)
- 20-40% faster execution
- Simpler code
- Better reliability

### Test UPSERT

1. **Try adding catalog:**
   - Click "Uzupełnij Katalog Podstawowy"
   - Should complete in ~3-4 seconds
   - Check console for "ULTRA-OPTIMIZED" message

2. **Try adding again (test duplicate handling):**
   - Click button again
   - Should skip existing items automatically
   - No errors should occur

## Rollback Plan

If issues occur after migration, you can rollback:

```sql
-- Remove constraint
ALTER TABLE catalog_items
DROP CONSTRAINT IF EXISTS catalog_items_user_name_unique;

-- Remove index
DROP INDEX IF EXISTS idx_catalog_items_user_name;
```

Then the current bulk insert code will continue to work.

## Why This Happened

The UPSERT optimization was committed before the migration was applied to production. This is a common deployment issue.

**Lesson Learned:**
- Always apply database migrations BEFORE deploying code that depends on them
- Or use feature flags to enable new code only after migrations are confirmed

## Current Performance

Even without UPSERT, the current bulk insert optimization is very fast:

| Metric | Value |
|--------|-------|
| Time | ~5 seconds |
| Queries | 4 total |
| Improvement vs Original | 48x faster |

**UPSERT will provide additional 20-40% speedup once migration is applied.**

## Next Steps

1. ✅ **Current:** Bulk insert working (~5 sec)
2. ⏳ **Apply migration** (when ready)
3. 🚀 **Switch to UPSERT** (~3-4 sec)

## Questions?

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify constraint exists (see verification SQL above)
3. Test with small dataset first
4. Rollback if needed (see rollback plan above)
