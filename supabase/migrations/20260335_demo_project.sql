-- ──────────────────────────────────────────────────────────────────────────
-- Demo Project Flag
-- is_demo_project: marks a project as the system-generated showcase project.
-- Demo projects bypass the free-tier price blur and PDF paywall so users
-- can see full value before upgrading.  They are permanently read-only.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_demo_project BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_is_demo
  ON projects (user_id, is_demo_project)
  WHERE is_demo_project = true;
