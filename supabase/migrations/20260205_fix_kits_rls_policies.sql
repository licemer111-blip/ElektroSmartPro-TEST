-- =====================================================
-- FIX RLS POLICIES FOR kits AND kit_items TABLES
-- =====================================================
-- Problem: Current "Admins can manage" policies allow ALL authenticated 
-- users to modify kits, not just admins.
-- 
-- Solution: Replace with proper admin check using profiles.role
-- =====================================================

-- =====================================================
-- 1. FIX KITS TABLE POLICIES
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins can manage kits" ON public.kits;

-- Keep SELECT policy for all users (read-only access to catalog)
-- This should already exist, but recreate to be safe
DROP POLICY IF EXISTS "Authenticated users can view kits" ON public.kits;
CREATE POLICY "Authenticated users can view kits"
  ON public.kits FOR SELECT
  TO authenticated
  USING (true);

-- Create proper admin-only policies for modifications
CREATE POLICY "Only admins can insert kits"
  ON public.kits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update kits"
  ON public.kits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete kits"
  ON public.kits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 2. FIX KIT_ITEMS TABLE POLICIES
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins can manage kit items" ON public.kit_items;

-- Keep SELECT policy for all users
DROP POLICY IF EXISTS "Authenticated users can view kit items" ON public.kit_items;
CREATE POLICY "Authenticated users can view kit items"
  ON public.kit_items FOR SELECT
  TO authenticated
  USING (true);

-- Create proper admin-only policies for modifications
CREATE POLICY "Only admins can insert kit items"
  ON public.kit_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update kit items"
  ON public.kit_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete kit items"
  ON public.kit_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After applying, test:
-- 1. Regular user should be able to SELECT from kits/kit_items
-- 2. Regular user should NOT be able to INSERT/UPDATE/DELETE
-- 3. Admin user (role='admin' in profiles) CAN do everything
