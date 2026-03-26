-- ============================================================================
-- CHECK SCHNEIDER ELECTRIC IMPORT PROGRESS
-- ============================================================================
-- Этот скрипт поможет отследить прогресс импорта в реальном времени
-- Запускай его после каждых 5-10 файлов
-- ============================================================================

-- 1. ОБЩЕЕ КОЛИЧЕСТВО SCHNEIDER ПОЗИЦИЙ
SELECT 
  COUNT(*) as "Schneider Electric позиций в БД",
  ROUND(COUNT(*) * 100.0 / 13003, 2) as "Прогресс (%)"
FROM catalog_items 
WHERE market_comment = 'Schneider Electric 2025';

-- Ожидаемый результат: ~13003 позиций (100%)

-- ============================================================================

-- 2. РАЗБИВКА ПО КАТЕГОРИЯМ
SELECT 
  cc.name as "Категория",
  COUNT(*) as "Кол-во позиций",
  ROUND(AVG(ci.base_material_price), 2) as "Средняя цена"
FROM catalog_items ci
LEFT JOIN catalog_categories cc ON ci.category_id = cc.id
WHERE ci.market_comment = 'Schneider Electric 2025'
GROUP BY cc.name
ORDER BY COUNT(*) DESC;

-- Ожидаемый результат:
-- Rozdzielnice:      ~6500
-- Osprzęt i punkty:  ~3200
-- Automatyka:        ~1800
-- Trasy Kablowe:     ~900
-- Oświetlenie:       ~400
-- PPOŻ:              ~150
-- Monitoring:        ~50
-- Biuro:             остальное

-- ============================================================================

-- 3. ПРОВЕРКА ДУБЛИКАТОВ (не должно быть)
SELECT 
  name, 
  COUNT(*) as duplicates
FROM catalog_items
WHERE market_comment = 'Schneider Electric 2025'
GROUP BY name
HAVING COUNT(*) > 1;

-- Ожидаемый результат: пустая таблица (дубликатов нет)

-- ============================================================================

-- 4. ТОП-10 САМЫХ ДОРОГИХ ПОЗИЦИЙ
SELECT 
  name,
  unit,
  base_material_price as "Цена (PLN)"
FROM catalog_items
WHERE market_comment = 'Schneider Electric 2025'
ORDER BY base_material_price DESC
LIMIT 10;

-- ============================================================================

-- 5. ОБЩАЯ СТАТИСТИКА КАТАЛОГА (все бренды)
SELECT 
  'Всего позиций в каталоге' as metric,
  COUNT(*) as value
FROM catalog_items
UNION ALL
SELECT 
  'Из них Schneider Electric',
  COUNT(*)
FROM catalog_items
WHERE market_comment = 'Schneider Electric 2025'
UNION ALL
SELECT 
  'Остальные бренды',
  COUNT(*)
FROM catalog_items
WHERE market_comment IS NULL OR market_comment != 'Schneider Electric 2025';

-- Ожидаемый результат:
-- Всего:            ~14430
-- Schneider:        ~13000
-- Остальные:        ~1430

-- ============================================================================
-- ИСПОЛЬЗОВАНИЕ:
-- 1. Скопируй ВЕСЬ этот файл
-- 2. Вставь в Supabase SQL Editor
-- 3. Нажми Run
-- 4. Увидишь 5 таблиц с детальной статистикой
-- ============================================================================
