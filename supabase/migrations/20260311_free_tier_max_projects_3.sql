-- ============================================================
-- Update free tier max_projects limit: → 3
-- Apply to BOTH TEST and LIVE Supabase projects
-- ============================================================

-- 1. Update column default for new registrations
ALTER TABLE public.profiles
ALTER COLUMN max_projects SET DEFAULT 3;

-- 2. Update all existing free tier users to 3
UPDATE public.profiles
SET max_projects = 3
WHERE is_pro = false AND (max_projects IS NULL OR max_projects < 999);

-- 3. Ensure PRO users have 999
UPDATE public.profiles
SET max_projects = 999
WHERE is_pro = true AND (max_projects IS NULL OR max_projects < 999);

-- 4. Update column comment
COMMENT ON COLUMN public.profiles.max_projects IS 'Maximum active projects. Demo = 3, PRO = 999. Enforced in UI and server actions.';

-- Verification
SELECT
  is_pro,
  max_projects,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY is_pro, max_projects
ORDER BY is_pro, max_projects;
