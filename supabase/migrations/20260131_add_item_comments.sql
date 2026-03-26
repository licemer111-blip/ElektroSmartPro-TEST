-- ============================================================================
-- 💬 Комментарии к позициям в проектах
-- ============================================================================
-- Дата: 2026-01-31
-- Позволяет команде обсуждать конкретные позиции в проектах
-- ============================================================================

-- Создаем таблицу комментариев
CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_item_id UUID NOT NULL REFERENCES public.project_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  mentioned_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "item_comments_select" ON public.item_comments FOR SELECT TO authenticated
  USING (
    -- Могут видеть комментарии если имеют доступ к проекту
    EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = item_comments.project_item_id
      AND (
        p.user_id = auth.uid()
        OR p.team_id IN (
          SELECT team_id FROM public.team_members 
          WHERE user_id = auth.uid() AND status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "item_comments_insert" ON public.item_comments FOR INSERT TO authenticated
  WITH CHECK (
    -- Могут добавлять комментарии если имеют доступ к проекту
    EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = project_item_id
      AND (
        p.user_id = auth.uid()
        OR p.team_id IN (
          SELECT team_id FROM public.team_members 
          WHERE user_id = auth.uid() AND status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "item_comments_update" ON public.item_comments FOR UPDATE TO authenticated
  USING (
    -- Автор может редактировать свои комментарии
    user_id = auth.uid()
    -- Админ или kierownik команды может редактировать все
    OR EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE pi.id = item_comments.project_item_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'kierownik')
      AND tm.status = 'active'
    )
  );

CREATE POLICY "item_comments_delete" ON public.item_comments FOR DELETE TO authenticated
  USING (
    -- Автор может удалять свои комментарии
    user_id = auth.uid()
    -- Админ или kierownik команды может удалять все
    OR EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE pi.id = item_comments.project_item_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'kierownik')
      AND tm.status = 'active'
    )
  );

-- Индексы
CREATE INDEX IF NOT EXISTS idx_item_comments_project_item ON public.item_comments(project_item_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_user ON public.item_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_resolved ON public.item_comments(resolved);
CREATE INDEX IF NOT EXISTS idx_item_comments_created ON public.item_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_comments_mentioned ON public.item_comments USING GIN(mentioned_user_ids);

-- Триггер обновления updated_at
CREATE TRIGGER item_comments_updated_at
  BEFORE UPDATE ON public.item_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Функция для уведомлений о новых комментариях
CREATE OR REPLACE FUNCTION notify_item_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Отправляем уведомление в real-time
  PERFORM pg_notify(
    'item_comment',
    json_build_object(
      'type', TG_OP,
      'project_item_id', NEW.project_item_id,
      'user_id', NEW.user_id,
      'mentioned_user_ids', NEW.mentioned_user_ids,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для уведомлений
DROP TRIGGER IF EXISTS item_comment_trigger ON public.item_comments;
CREATE TRIGGER item_comment_trigger
  AFTER INSERT OR UPDATE ON public.item_comments
  FOR EACH ROW EXECUTE FUNCTION notify_item_comment();

-- ============================================================================
-- КОНЕЦ МИГРАЦИИ
-- ============================================================================
