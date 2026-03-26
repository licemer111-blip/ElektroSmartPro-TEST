-- =====================================================
-- ACTIVITY FEED / ACTIVITY LOG
-- =====================================================
-- Tracks user actions for activity feed
-- "Jan added project", "Maria edited item", etc.
-- Date: 2026-01-29

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What entity was affected (optional, can be null for general actions)
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Action type
  action_type TEXT NOT NULL,
  -- Possible values:
  -- 'project_created', 'project_updated', 'project_deleted', 'project_archived'
  -- 'project_duplicated', 'project_finalized', 'project_shared'
  -- 'item_added', 'item_updated', 'item_deleted', 'items_imported'
  -- 'member_invited', 'member_removed', 'member_role_changed'
  -- 'invitation_accepted', 'invitation_declined'
  -- 'pdf_generated', 'email_sent', 'invoice_created'
  -- 'template_created', 'template_used'
  
  -- Human-readable description
  description TEXT NOT NULL,
  
  -- Additional metadata (JSON) - flexible storage for action-specific data
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example metadata:
  -- { "project_name": "Dom w Krakowie", "item_count": 5 }
  -- { "invited_email": "jan@example.com", "role": "editor" }
  -- { "old_status": "draft", "new_status": "final" }
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Composite index for user's recent activity
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_recent 
ON public.activity_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Users can see activity for:
-- 1. Their own actions
-- 2. Actions on projects they have access to

DROP POLICY IF EXISTS "Users can view relevant activity" ON public.activity_logs;
CREATE POLICY "Users can view relevant activity"
ON public.activity_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    project_id IS NOT NULL 
    AND public.has_project_access(project_id, auth.uid())
  )
);

-- Only the system (via SECURITY DEFINER functions) can insert
-- But for now, allow users to log their own actions
DROP POLICY IF EXISTS "Users can log own actions" ON public.activity_logs;
CREATE POLICY "Users can log own actions"
ON public.activity_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- No update/delete - activity logs are immutable
DROP POLICY IF EXISTS "Activity logs are immutable" ON public.activity_logs;
CREATE POLICY "Activity logs are immutable"
ON public.activity_logs FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Activity logs cannot be deleted" ON public.activity_logs;
CREATE POLICY "Activity logs cannot be deleted"
ON public.activity_logs FOR DELETE
USING (false);

-- =====================================================
-- HELPER FUNCTION: Log Activity
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action_type TEXT,
  p_description TEXT,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, project_id, action_type, description, metadata)
  VALUES (auth.uid(), p_project_id, p_action_type, p_description, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =====================================================
-- AUTOMATIC TRIGGERS (Optional - for automatic logging)
-- =====================================================

-- Trigger function for project changes
CREATE OR REPLACE FUNCTION public.trigger_log_project_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, project_id, action_type, description, metadata)
    VALUES (
      NEW.user_id,
      NEW.id,
      'project_created',
      'Utworzono projekt: ' || NEW.name,
      jsonb_build_object('project_name', NEW.name)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO activity_logs (user_id, project_id, action_type, description, metadata)
      VALUES (
        NEW.user_id,
        NEW.id,
        CASE 
          WHEN NEW.status = 'archived' THEN 'project_archived'
          WHEN NEW.status = 'final' THEN 'project_finalized'
          ELSE 'project_updated'
        END,
        CASE 
          WHEN NEW.status = 'archived' THEN 'Zarchiwizowano projekt: ' || NEW.name
          WHEN NEW.status = 'final' THEN 'Sfinalizowano projekt: ' || NEW.name
          ELSE 'Zaktualizowano projekt: ' || NEW.name
        END,
        jsonb_build_object(
          'project_name', NEW.name,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    -- Log name changes
    ELSIF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO activity_logs (user_id, project_id, action_type, description, metadata)
      VALUES (
        NEW.user_id,
        NEW.id,
        'project_updated',
        'Zmieniono nazwę projektu z "' || OLD.name || '" na "' || NEW.name || '"',
        jsonb_build_object(
          'old_name', OLD.name,
          'new_name', NEW.name
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for projects
DROP TRIGGER IF EXISTS log_project_activity ON public.projects;
CREATE TRIGGER log_project_activity
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trigger_log_project_activity();

-- =====================================================
-- ADD assigned_to FIELD (Task Assignment)
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.projects 
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for assigned projects
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Activity Feed & Task Assignment migration complete' as status;
