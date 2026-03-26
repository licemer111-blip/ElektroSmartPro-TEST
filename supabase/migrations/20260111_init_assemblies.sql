-- Migration: Initialize User Custom Assemblies System
-- Created: 2026-01-11
-- Description: Creates tables for user-defined assembly templates with RLS policies
-- Note: This migration is idempotent and will add missing columns/policies if tables already exist

-- ============================================================================
-- TABLE: user_assemblies
-- Stores user's custom assembly templates (e.g., "My Standard Socket Point")
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_assemblies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT user_assemblies_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_assemblies_user_id ON user_assemblies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assemblies_created_at ON user_assemblies(created_at DESC);

-- Add missing columns if table already exists (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_assemblies' AND column_name = 'description') THEN
        ALTER TABLE user_assemblies ADD COLUMN description text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_assemblies' AND column_name = 'updated_at') THEN
        ALTER TABLE user_assemblies ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    END IF;
END $$;

-- ============================================================================
-- TABLE: user_assembly_items
-- Stores individual items (materials/labor) within each assembly
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_assembly_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id uuid NOT NULL REFERENCES user_assemblies(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit text NOT NULL,
    type text NOT NULL CHECK (type IN ('material', 'labor')),
    price numeric NOT NULL DEFAULT 0,
    quantity numeric NOT NULL DEFAULT 1,
    sort_order integer NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT user_assembly_items_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT user_assembly_items_unit_not_empty CHECK (length(trim(unit)) > 0),
    CONSTRAINT user_assembly_items_price_non_negative CHECK (price >= 0),
    CONSTRAINT user_assembly_items_quantity_positive CHECK (quantity > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_assembly_items_assembly_id ON user_assembly_items(assembly_id);
CREATE INDEX IF NOT EXISTS idx_user_assembly_items_sort_order ON user_assembly_items(assembly_id, sort_order);

-- Add missing columns if table already exists (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_assembly_items' AND column_name = 'price') THEN
        ALTER TABLE user_assembly_items ADD COLUMN price numeric NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_assembly_items' AND column_name = 'sort_order') THEN
        ALTER TABLE user_assembly_items ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_assembly_items_price_non_negative') THEN
        ALTER TABLE user_assembly_items ADD CONSTRAINT user_assembly_items_price_non_negative CHECK (price >= 0);
    END IF;
END $$;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_assemblies_updated_at ON user_assemblies;
CREATE TRIGGER update_user_assemblies_updated_at
    BEFORE UPDATE ON user_assemblies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - user_assemblies
-- ============================================================================
ALTER TABLE user_assemblies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own assemblies" ON user_assemblies;
DROP POLICY IF EXISTS "Users can insert own assemblies" ON user_assemblies;
DROP POLICY IF EXISTS "Users can update own assemblies" ON user_assemblies;
DROP POLICY IF EXISTS "Users can delete own assemblies" ON user_assemblies;

-- Policy: Users can view their own assemblies
CREATE POLICY "Users can view own assemblies"
    ON user_assemblies
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own assemblies
CREATE POLICY "Users can insert own assemblies"
    ON user_assemblies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own assemblies
CREATE POLICY "Users can update own assemblies"
    ON user_assemblies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own assemblies
CREATE POLICY "Users can delete own assemblies"
    ON user_assemblies
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - user_assembly_items
-- ============================================================================
ALTER TABLE user_assembly_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own assembly items" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can insert own assembly items" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can update own assembly items" ON user_assembly_items;
DROP POLICY IF EXISTS "Users can delete own assembly items" ON user_assembly_items;

-- Policy: Users can view items of their own assemblies
CREATE POLICY "Users can view own assembly items"
    ON user_assembly_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_assemblies
            WHERE user_assemblies.id = user_assembly_items.assembly_id
            AND user_assemblies.user_id = auth.uid()
        )
    );

-- Policy: Users can insert items into their own assemblies
CREATE POLICY "Users can insert own assembly items"
    ON user_assembly_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_assemblies
            WHERE user_assemblies.id = user_assembly_items.assembly_id
            AND user_assemblies.user_id = auth.uid()
        )
    );

-- Policy: Users can update items in their own assemblies
CREATE POLICY "Users can update own assembly items"
    ON user_assembly_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_assemblies
            WHERE user_assemblies.id = user_assembly_items.assembly_id
            AND user_assemblies.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_assemblies
            WHERE user_assemblies.id = user_assembly_items.assembly_id
            AND user_assemblies.user_id = auth.uid()
        )
    );

-- Policy: Users can delete items from their own assemblies
CREATE POLICY "Users can delete own assembly items"
    ON user_assembly_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_assemblies
            WHERE user_assemblies.id = user_assembly_items.assembly_id
            AND user_assemblies.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE user_assemblies IS 'Stores user-defined assembly templates (e.g., custom electrical installation bundles)';
COMMENT ON TABLE user_assembly_items IS 'Individual items (materials/labor) within user assemblies';

COMMENT ON COLUMN user_assemblies.user_id IS 'Owner of the assembly template';
COMMENT ON COLUMN user_assemblies.name IS 'Display name of the assembly (e.g., "Gniazdo podwójne z uziemieniem")';
COMMENT ON COLUMN user_assemblies.description IS 'Optional description for the assembly';

COMMENT ON COLUMN user_assembly_items.type IS 'Either "material" or "labor" - matches Master Blueprint split pricing architecture';
COMMENT ON COLUMN user_assembly_items.price IS 'Base price per unit (will be multiplied by regional modifier at project level)';
COMMENT ON COLUMN user_assembly_items.quantity IS 'Default quantity when assembly is added to project';
COMMENT ON COLUMN user_assembly_items.sort_order IS 'Display order within the assembly';
