# Vercel Filesystem Fix - EROFS Error Resolution

## Problem

The application was throwing `EROFS: read-only file system` errors when trying to generate catalog data on Vercel. This occurred because the code was attempting to write to the filesystem using `fs.writeFileSync()`, which is not allowed on Vercel's serverless platform.

**Error Location:**
```
/lib/data/master-catalog-items.json
```

**Root Cause:**
Three server actions were using `fs.writeFileSync()` to save generated catalog data to JSON files:
1. `exportCurrentCatalog()` - app/dashboard/settings/actions.ts
2. `generateBigCatalogMatrix()` - app/dashboard/settings/actions.ts
3. `generateMasterCatalog()` - app/dashboard/settings/generate-catalog-action.ts

## Solution

Replaced all file system operations with direct Supabase database inserts.

### Changes Made

#### 1. `exportCurrentCatalog()` - Export Function
**Before:**
- Fetched catalog items from database
- Wrote to `master-catalog-items.json` file
- Returned success message

**After:**
- Fetches catalog items from database
- Returns data directly in response object
- No file writing

**Code Changes:**
```typescript
// REMOVED:
// import fs from "fs";
// import path from "path";
// fs.writeFileSync(filePath, jsonString, "utf-8");

// ADDED:
return { 
  success: true, 
  count: exportData.length,
  data: exportData, // Return data instead of writing to file
  message: `Wyeksportowano ${exportData.length} pozycji z katalogu`,
  error: null 
};
```

#### 2. `generateBigCatalogMatrix()` - Matrix Generator
**Before:**
- Generated 2000+ catalog items in memory
- Wrote to `master-catalog-items.json` file
- Returned count

**After:**
- Generates 2000+ catalog items in memory
- Inserts directly into `catalog_items` table
- Uses batch inserts (500 items per batch)
- Auto-creates categories as needed

**Key Features:**
- Helper function `getOrCreateCategory()` for category management
- Batch processing to avoid Supabase limits
- Progress logging for each batch
- Proper error handling

**Code Changes:**
```typescript
// ADDED: Helper function
async function getOrCreateCategory(supabase: any, categoryName: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('catalog_categories')
    .select('id')
    .eq('name', categoryName)
    .single();
  
  if (existing) return existing.id;
  
  const { data: newCat, error } = await supabase
    .from('catalog_categories')
    .insert({ name: categoryName })
    .select('id')
    .single();
  
  return newCat ? newCat.id : null;
}

// REPLACED: File writing with DB inserts
const batchSize = 500;
for (let i = 0; i < dbItems.length; i += batchSize) {
  const batch = dbItems.slice(i, i + batchSize);
  await supabase.from('catalog_items').insert(batch);
}
```

#### 3. `generateMasterCatalog()` - Master Catalog Generator
**Before:**
- Generated 1200+ catalog items
- Wrote to `master-catalog-items.json` file

**After:**
- Generates 1200+ catalog items
- Inserts directly into `catalog_items` table
- Uses same batch processing as Matrix Generator

**Code Changes:**
- Same pattern as `generateBigCatalogMatrix()`
- Added user authentication check
- Added `getOrCreateCategory()` helper
- Batch inserts with progress logging

### Database Schema

The functions now insert into the `catalog_items` table with this structure:

```typescript
{
  user_id: string,           // Current authenticated user
  category_id: string,       // FK to catalog_categories
  name: string,              // Item name
  unit: string,              // Unit of measurement
  base_material_price: number,
  base_labor_price: number,
  is_assembly_parent: boolean,
  is_active: boolean
}
```

### Batch Processing

To avoid Supabase query limits and improve performance:
- **Batch Size:** 500 items per insert
- **Progress Logging:** Console logs after each batch
- **Error Handling:** Throws error on first failed batch
- **Total Items:** Can handle 2000+ items efficiently

### Category Management

The `getOrCreateCategory()` helper function:
1. Checks if category exists by name
2. Returns existing category ID if found
3. Creates new category if not found
4. Returns category ID for item insertion

This ensures:
- No duplicate categories
- Automatic category creation
- Proper foreign key relationships

## Files Modified

1. **app/dashboard/settings/actions.ts**
   - Removed `fs` and `path` imports
   - Updated `exportCurrentCatalog()` to return data
   - Updated `generateBigCatalogMatrix()` to insert to DB
   - Added `getOrCreateCategory()` helper

2. **app/dashboard/settings/generate-catalog-action.ts**
   - Removed `fs` and `path` imports
   - Added Supabase client import
   - Updated `generateMasterCatalog()` to insert to DB
   - Added `getOrCreateCategory()` helper

## Testing

### Build Verification
- ✅ TypeScript compilation passes
- ✅ No linter errors
- ✅ Production build successful

### Functional Testing Required
After deployment to Vercel, test:
1. **Export Catalog:** Click "Eksportuj Katalog" button
   - Should return JSON data
   - Should not throw EROFS error

2. **Generate Matrix:** Click "Generuj Bazę Matrix" button
   - Should insert 2000+ items into database
   - Should create categories automatically
   - Should show progress in console

3. **Generate Master Catalog:** Click "Generuj Katalog Master" button
   - Should insert 1200+ items into database
   - Should not throw EROFS error

## Benefits

### Before (File-based)
- ❌ Fails on Vercel (read-only filesystem)
- ❌ Data not immediately available in app
- ❌ Requires manual import step
- ❌ File can get out of sync with DB

### After (Database-based)
- ✅ Works on Vercel serverless
- ✅ Data immediately available in app
- ✅ No manual import needed
- ✅ Single source of truth (database)
- ✅ Supports concurrent users
- ✅ Better error handling

## Migration Notes

### For Existing Deployments
1. Deploy the updated code
2. Test catalog generation functions
3. Verify items appear in catalog
4. Old JSON files can be safely deleted

### For New Deployments
- No special migration needed
- Functions work out of the box
- Categories auto-created on first use

## Performance

### Batch Insert Timings (Estimated)
- **500 items:** ~2-3 seconds
- **1200 items:** ~6-8 seconds
- **2000 items:** ~10-12 seconds

### Database Impact
- Uses Supabase's batch insert optimization
- Minimal impact on database performance
- Progress logging helps monitor long operations

## Error Handling

### Common Errors & Solutions

**Error:** "Unauthorized"
- **Cause:** User not logged in
- **Solution:** Ensure user is authenticated before calling functions

**Error:** "Database insert failed"
- **Cause:** Supabase connection issue or RLS policy
- **Solution:** Check Supabase connection and RLS policies

**Error:** "Category not found"
- **Cause:** Failed to create category
- **Solution:** Check catalog_categories table permissions

## Future Improvements

1. **Progress UI:** Add progress bar for long operations
2. **Duplicate Handling:** Add upsert logic to prevent duplicates
3. **Rollback:** Add transaction support for failed batches
4. **Caching:** Cache category IDs to reduce DB queries
5. **Parallel Processing:** Use Promise.all for faster inserts

## Related Files
- `app/dashboard/settings/actions.ts`
- `app/dashboard/settings/generate-catalog-action.ts`
- `lib/types/database.ts` (CatalogItem interface)
- `components/settings/matrix-generator-button.tsx` (UI component)
- `components/settings/export-catalog-button.tsx` (UI component)
