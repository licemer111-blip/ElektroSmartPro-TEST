-- =====================================================
-- CRM Module: Clients Database
-- Created: 2026-01-29
-- Purpose: Client management with project history
-- =====================================================

-- =====================================================
-- 1. CLIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  company_name TEXT,
  type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
  
  -- Contact info
  email TEXT,
  phone TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  postal_code TEXT,
  
  -- Business info
  nip TEXT, -- Polish tax ID
  regon TEXT,
  
  -- CRM fields
  tags TEXT[] DEFAULT '{}', -- ['vip', 'regular', 'problematic']
  notes TEXT,
  source TEXT, -- 'referral', 'website', 'cold_call', 'other'
  
  -- Statistics (cached for performance)
  total_projects INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  last_project_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_team_id ON public.clients(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_nip ON public.clients(nip) WHERE nip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(user_id, created_at DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients 
  USING GIN(to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(email, '')));

-- =====================================================
-- 3. ADD CLIENT_ID TO PROJECTS TABLE
-- =====================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id) WHERE client_id IS NOT NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view team clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

-- View: own clients + team clients
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (
    user_id = auth.uid() OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = clients.team_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    ))
  );

-- Insert: own clients
CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update: own clients or team clients (if admin/manager)
CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = clients.team_id 
      AND user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('admin', 'kierownik')
    ))
  );

-- Delete: own clients only
CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 5. FUNCTION: Update client statistics
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_client_stats(p_client_id UUID)
RETURNS void AS $$
DECLARE
  v_total_projects INTEGER;
  v_total_revenue DECIMAL(12,2);
  v_last_project_date TIMESTAMPTZ;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(
      CASE WHEN status = 'final' THEN 
        (SELECT COALESCE(SUM(
          (COALESCE(pi.final_material_price, pi.material_price, 0) + 
           COALESCE(pi.final_labor_price, pi.labor_price, 0)) * pi.quantity
        ), 0) FROM project_items pi WHERE pi.project_id = p.id)
      ELSE 0 END
    ), 0),
    MAX(created_at)
  INTO v_total_projects, v_total_revenue, v_last_project_date
  FROM public.projects p
  WHERE p.client_id = p_client_id;

  UPDATE public.clients 
  SET 
    total_projects = v_total_projects,
    total_revenue = v_total_revenue,
    last_project_date = v_last_project_date,
    updated_at = now()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGER: Auto-update client stats on project changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old client stats if client changed
  IF TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    IF OLD.client_id IS NOT NULL THEN
      PERFORM public.update_client_stats(OLD.client_id);
    END IF;
  END IF;
  
  -- Update new/current client stats
  IF NEW.client_id IS NOT NULL THEN
    PERFORM public.update_client_stats(NEW.client_id);
  END IF;
  
  -- Handle deletes
  IF TG_OP = 'DELETE' AND OLD.client_id IS NOT NULL THEN
    PERFORM public.update_client_stats(OLD.client_id);
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_project_client_stats ON public.projects;
CREATE TRIGGER trigger_project_client_stats
  AFTER INSERT OR UPDATE OF client_id, status OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_client_stats();

-- =====================================================
-- 7. Updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at();
