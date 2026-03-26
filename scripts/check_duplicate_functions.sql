-- ============================================================================
-- ПРОВЕРКА ДУБЛИРУЮЩИХСЯ ФУНКЦИЙ
-- ============================================================================

-- Найти все функции search_catalog
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pronargs as num_args,
  oid
FROM pg_proc 
WHERE proname = 'search_catalog'
ORDER BY proname, pronargs;

-- Детальная информация
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as full_signature,
  pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'search_catalog'
ORDER BY n.nspname, p.proname;
