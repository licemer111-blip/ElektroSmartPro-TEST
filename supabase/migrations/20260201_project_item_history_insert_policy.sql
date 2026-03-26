-- ============================================================================
-- 🔧 RLS: разрешить INSERT в project_item_history при добавлении позиций
-- ============================================================================
-- Дата: 2026-02-01
-- Ошибка: new row violates row-level security policy for table "project_item_history"
-- Причина: триггер log_project_item_change() вставляет в историю при INSERT в project_items,
--          но политика INSERT для project_item_history отсутствовала.
-- ============================================================================

CREATE POLICY "project_item_history_insert" ON public.project_item_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = project_item_history.project_item_id
      AND (
        p.user_id = auth.uid()
        OR p.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
        OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
      )
    )
  );
