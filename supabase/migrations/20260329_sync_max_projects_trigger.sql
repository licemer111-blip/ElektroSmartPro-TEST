-- ── Trigger: keep max_projects in sync with is_pro ──────────────────────────
-- Prevents the is_pro=true / max_projects=3 inconsistency found in audit.
-- Rule: is_pro=true  → max_projects must be 999
--       is_pro=false → max_projects must be 3 (free tier cap)

CREATE OR REPLACE FUNCTION sync_max_projects_with_is_pro()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_pro = true AND (NEW.max_projects IS NULL OR NEW.max_projects < 999) THEN
    NEW.max_projects := 999;
  END IF;
  IF NEW.is_pro = false AND (NEW.max_projects IS NULL OR NEW.max_projects > 3) THEN
    NEW.max_projects := 3;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_max_projects ON profiles;
CREATE TRIGGER trg_sync_max_projects
  BEFORE INSERT OR UPDATE OF is_pro, max_projects ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_max_projects_with_is_pro();

-- Back-fill: fix any existing rows where is_pro / max_projects are out of sync
UPDATE profiles SET max_projects = 999 WHERE is_pro = true  AND max_projects < 999;
UPDATE profiles SET max_projects = 3   WHERE is_pro = false AND max_projects > 3;
