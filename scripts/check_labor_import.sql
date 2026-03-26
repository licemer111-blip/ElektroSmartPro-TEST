-- ============================================================================
-- CHECK LABOR SERVICES IMPORT PROGRESS
-- ============================================================================
-- Этот скрипт поможет проверить импорт услуг (robocizna) из отчетов Przedmiar
-- Запускай его после импорта для проверки
-- ============================================================================

-- 1. ОБЩЕЕ КОЛИЧЕСТВО УСЛУГ
SELECT 
  COUNT(*) as "Labor услуг в БД",
  COUNT(DISTINCT category_id) as "Категорий",
  COUNT(DISTINCT sub_category) as "Подкатегорий (Секторов)",
  ROUND(AVG(base_labor_price), 2) as "Средняя цена (PLN)"
FROM catalog_items 
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025';

-- Ожидаемый результат: ~80-150 услуг

-- ============================================================================

-- 2. РАЗБИВКА ПО СЕКТОРАМ
SELECT 
  sub_category as "Sektor",
  COUNT(*) as "Ilość usług",
  ROUND(AVG(base_labor_price), 2) as "Średnia cena (PLN)",
  ROUND(MIN(base_labor_price), 2) as "Min cena",
  ROUND(MAX(base_labor_price), 2) as "Max cena"
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
GROUP BY sub_category
ORDER BY COUNT(*) DESC;

-- Ожидаемый результат:
-- Hale i Magazyny:        ~30-40 usług
-- Biura i Usługi:         ~25-35 usług
-- Mieszkania (Deweloper): ~25-35 usług
-- Infrastruktura:         ~10-20 usług

-- ============================================================================

-- 3. РАЗБИВКА ПО ЕДИНИЦАМ ИЗМЕРЕНИЯ
SELECT 
  unit as "Jednostka",
  COUNT(*) as "Ilość usług",
  ROUND(AVG(base_labor_price), 2) as "Średnia cena (PLN)"
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
GROUP BY unit
ORDER BY COUNT(*) DESC;

-- Ожидаемый результат:
-- mb:   больше всего (układanie przewodów, korytkowanie)
-- szt.: много (montaż opraw, gniazd, itd.)
-- kpl.: наборы работ
-- m²:   powierzchniowe (malowanie, szlifowanie)
-- rbh:  roboczogodziny

-- ============================================================================

-- 4. ТОП-10 САМЫХ ДОРОГИХ УСЛУГ
SELECT 
  name as "Nazwa usługi",
  base_labor_price as "Cena (PLN)",
  unit as "Jednostka",
  sub_category as "Sektor"
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
ORDER BY base_labor_price DESC
LIMIT 10;

-- Ожидаемый результат: Сложные монтажи, BMS, Smart Home системы

-- ============================================================================

-- 5. ТОП-10 САМЫХ ДЕШЕВЫХ УСЛУГ
SELECT 
  name as "Nazwa usługi",
  base_labor_price as "Cena (PLN)",
  unit as "Jednostka",
  sub_category as "Sektor"
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
ORDER BY base_labor_price ASC
LIMIT 10;

-- Ожидаемый результат: Простые работы (wiercenie otworów, układanie kabli w gotowych korytkach)

-- ============================================================================

-- 6. ПРОВЕРКА ДУБЛИКАТОВ (не должно быть)
SELECT 
  name as "Nazwa usługi", 
  COUNT(*) as "Liczba duplikatów"
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
GROUP BY name
HAVING COUNT(*) > 1;

-- Ожидаемый результат: пустая таблица (дубликатов нет)

-- ============================================================================

-- 7. СРАВНЕНИЕ: МАТЕРИАЛЫ vs УСЛУГИ
SELECT 
  type as "Typ",
  COUNT(*) as "Ilość pozycji",
  ROUND(AVG(COALESCE(base_material_price, 0) + COALESCE(base_labor_price, 0)), 2) as "Średnia cena"
FROM catalog_items
WHERE market_comment IN ('Schneider Electric 2025', 'Przedmiar 2024/2025')
GROUP BY type
ORDER BY COUNT(*) DESC;

-- Ожидаемый результат:
-- material: ~13000 (Schneider)
-- labor:    ~80-150 (Przedmiar)

-- ============================================================================

-- 8. ОБЩАЯ СТАТИСТИКА КАТАЛОГА (все типы)
SELECT 
  'Всего позиций в каталоге' as metric,
  COUNT(*) as value
FROM catalog_items
UNION ALL
SELECT 
  'Материалы (materials)',
  COUNT(*)
FROM catalog_items
WHERE type = 'material'
UNION ALL
SELECT 
  'Услуги (labor)',
  COUNT(*)
FROM catalog_items
WHERE type = 'labor'
UNION ALL
SELECT 
  'Schneider Electric',
  COUNT(*)
FROM catalog_items
WHERE market_comment = 'Schneider Electric 2025'
UNION ALL
SELECT 
  'Przedmiar Labor',
  COUNT(*)
FROM catalog_items
WHERE market_comment = 'Przedmiar 2024/2025';

-- Ожидаемый результат:
-- Всего:      ~14500-14600
-- Materials:  ~13400
-- Labor:      ~100-200
-- Schneider:  ~13000
-- Przedmiar:  ~80-150

-- ============================================================================

-- 9. ПОИСК УСЛУГ ПО КЛЮЧЕВЫМ СЛОВАМ
-- Примеры: montaż, układanie, instalacja, demontaż

-- Montaż:
SELECT name, base_labor_price, unit, sub_category
FROM catalog_items
WHERE type = 'labor' 
  AND market_comment = 'Przedmiar 2024/2025'
  AND LOWER(name) LIKE '%montaż%'
ORDER BY base_labor_price DESC
LIMIT 5;

-- Układanie:
SELECT name, base_labor_price, unit, sub_category
FROM catalog_items
WHERE type = 'labor' 
  AND market_comment = 'Przedmiar 2024/2025'
  AND LOWER(name) LIKE '%układanie%'
ORDER BY base_labor_price DESC
LIMIT 5;

-- Instalacja:
SELECT name, base_labor_price, unit, sub_category
FROM catalog_items
WHERE type = 'labor' 
  AND market_comment = 'Przedmiar 2024/2025'
  AND LOWER(name) LIKE '%instalacja%'
ORDER BY base_labor_price DESC
LIMIT 5;

-- ============================================================================
-- ИСПОЛЬЗОВАНИЕ:
-- 1. Скопируй ВЕСЬ этот файл
-- 2. Вставь в Supabase SQL Editor
-- 3. Нажми Run
-- 4. Увидишь 9+ таблиц с детальной статистикой
-- ============================================================================
