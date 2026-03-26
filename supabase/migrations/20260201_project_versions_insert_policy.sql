-- ============================================================================
-- 🔧 RLS: разрешить INSERT в project_versions и project_version_items
-- ============================================================================
-- Дата: 2026-02-01
-- Ошибка: при сохранении заметок (UPDATE projects) срабатывает триггер
--         project_auto_version_trigger → create_project_version() вставляет
--         в project_versions и project_version_items. Политик INSERT не было,
--         из-за чего весь UPDATE откатывался и показывалось "Nie udało się zapisać notatek".
-- ============================================================================

-- INSERT в project_versions: разрешить, если пользователь может редактировать проект
CREATE POLICY "project_versions_insert" ON public.project_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_versions.project_id
      AND (
        p.user_id = auth.uid()
        OR p.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
        OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
      )
    )
  );

-- INSERT в project_version_items: разрешить, если версия принадлежит проекту с доступом на редактирование
CREATE POLICY "project_version_items_insert" ON public.project_version_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_versions pv
      JOIN public.projects p ON p.id = pv.project_id
      WHERE pv.id = project_version_items.version_id
      AND (
        p.user_id = auth.uid()
        OR p.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
        OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
      )
    )
  );
