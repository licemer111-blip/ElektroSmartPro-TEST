import re
import os

# ============================================================================
# IMPORT LABOR SERVICES FROM PRZEDMIAR REPORT
# ============================================================================
# Этот скрипт парсит Markdown отчет с предмером работ и генерирует SQL
# для импорта услуг (robocizna/labor) в глобальный каталог
# ============================================================================

# НАСТРОЙКИ
INPUT_FILE = 'Przedmiar_Robót_Elektrycznych_Raport_2024_2025.md'
OUTPUT_FILE = 'import_labor_services.sql'

print(f"📂 Загружаю отчет: {INPUT_FILE}...")

# 1. Читаем файл отчета
try:
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        text = f.read()
    print(f"✅ Загружено {len(text)} символов")
except FileNotFoundError:
    print(f"❌ Файл не найден: {INPUT_FILE}")
    print(f"💡 Помести файл отчета в папку: scripts/")
    exit()

# 2. Функция для очистки цены (35 zł -> 35.0)
def extract_price(price_str):
    """Извлекает числовое значение цены из строки"""
    match = re.search(r'(\d+([.,]\d+)?)', price_str)
    if match:
        return float(match.group(1).replace(',', '.'))
    return 0.0

# 3. Функция нормализации единиц
def normalize_unit(unit_str):
    """Нормализует единицы измерения"""
    u = unit_str.lower().strip()
    
    if u in ['mb', 'metr', 'm']:
        return 'mb'
    if u in ['szt', 'sztuk', 'szt.']:
        return 'szt.'
    if u in ['kpl', 'komplet', 'kpl.']:
        return 'kpl.'
    if u in ['m2', 'm²']:
        return 'm²'
    if u in ['godz', 'h', 'roboczogodzina']:
        return 'rbh'
    
    return 'kpl.' # Default

# 4. Парсинг данных
print("🔍 Парсинг отчета...")

items = []
current_sector = "Inne usługi"
current_category = "Robocizna"

lines = text.split('\n')
current_item = None
current_unit = 'kpl.'
current_price = 0.0
current_description = ""

for i, line in enumerate(lines):
    line = line.strip()
    
    # Определяем сектор по заголовкам
    if "SEKTOR 1" in line or "Hale i Magazyny" in line:
        current_sector = "Hale i Magazyny"
        current_category = "Przemysł"
    elif "SEKTOR 2" in line or "Biura i Usługi" in line:
        current_sector = "Biura i Usługi"
        current_category = "Komercja"
    elif "SEKTOR 3" in line or "Mieszkania" in line or "Deweloper" in line:
        current_sector = "Mieszkania (Deweloper)"
        current_category = "Deweloperka"
    elif "Infrastruktura" in line or "SEKTOR 4" in line:
        current_sector = "Infrastruktura"
        current_category = "Infrastruktura"
    
    # Ищем название работы (заголовок уровня 3 или жирный текст)
    # Примеры:
    # ### Montaż koryt kablowych
    # **Montaż opraw oświetleniowych**
    if (line.startswith("###") or (line.startswith("**") and line.endswith("**"))) and len(line) > 5:
        # Сохраняем предыдущий элемент
        if current_item and current_price > 0:
            items.append({
                'name': current_item,
                'sector': current_sector,
                'category': current_category,
                'unit': current_unit,
                'price': current_price,
                'description': current_description
            })
            # Сброс
            current_price = 0.0
            current_description = ""
        
        # Новый элемент
        current_item = line.replace("###", "").replace("**", "").strip()
    
    # Ищем Единицу измерения
    # Пример: - **Jednostka:** mb, szt
    if "Jednostka:" in line or "jednostka:" in line:
        unit_match = re.search(r'[Jj]ednostka:\*?\*?\s*(.+)', line)
        if unit_match:
            raw_unit = unit_match.group(1).strip()
            # Берем первое слово (mb, szt, kpl)
            first_unit = raw_unit.split(',')[0].split(' ')[0].strip()
            current_unit = normalize_unit(first_unit)
    
    # Ищем Цену Работы (Robocizna)
    # Примеры:
    # - **Robocizna:** 35 zł/mb
    # - Układanie przewodów: 29 zł/mb
    # - Cena jednostkowa: 42 zł
    if "zł" in line and ("Robocizna" in line or "Cena jednostkowa" in line or "robocizna" in line):
        price = extract_price(line)
        if price > 0:
            current_price = price
    
    # Альтернативный вариант: подпункт с ценой
    # Пример: - Układanie przewodów w korytkach: 29 zł/mb
    elif "zł" in line and line.startswith("- ") and ":" in line and current_item:
        price = extract_price(line)
        if price > 0:
            sub_name = line.split(":")[0].replace("- ", "").replace("**", "").strip()
            # Это отдельная подуслуга - добавляем сразу
            items.append({
                'name': f"{current_item} - {sub_name}",
                'sector': current_sector,
                'category': current_category,
                'unit': current_unit,
                'price': price,
                'description': f"Część: {current_item}"
            })
    
    # Собираем описание (следующая строка после названия, если есть текст)
    if current_item and not line.startswith("#") and not line.startswith("-") and len(line) > 10 and "zł" not in line:
        if not current_description:
            current_description = line[:200] # Первые 200 символов

# Добавляем последний элемент
if current_item and current_price > 0:
    items.append({
        'name': current_item,
        'sector': current_sector,
        'category': current_category,
        'unit': current_unit,
        'price': current_price,
        'description': current_description
    })

print(f"✅ Найдено {len(items)} услуг")

# 5. Группировка по секторам (для статистики)
sectors = {}
for item in items:
    s = item['sector']
    if s not in sectors:
        sectors[s] = []
    sectors[s].append(item)

print(f"📊 Разбивка по секторам:")
for sector, sector_items in sectors.items():
    avg_price = sum([i['price'] for i in sector_items]) / len(sector_items)
    print(f"   - {sector}: {len(sector_items)} услуг (ср. цена: {avg_price:.2f} PLN)")

# 6. Генерация SQL
print(f"🔧 Генерация SQL...")

sql_lines = []
sql_lines.append("-- ============================================================================")
sql_lines.append("-- IMPORT LABOR SERVICES FROM PRZEDMIAR REPORT 2024/2025")
sql_lines.append(f"-- Generated: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
sql_lines.append(f"-- Total items: {len(items)}")
sql_lines.append("-- ============================================================================")
sql_lines.append("")

# Создаем категории (если их нет)
unique_categories = list(set([item['category'] for item in items]))
sql_lines.append("-- Step 1: Create categories if not exist")
for cat in unique_categories:
    cat_safe = cat.replace("'", "''")
    sql_lines.append(f"INSERT INTO public.catalog_categories (name)")
    sql_lines.append(f"SELECT '{cat_safe}'")
    sql_lines.append(f"WHERE NOT EXISTS (SELECT 1 FROM public.catalog_categories WHERE name = '{cat_safe}');")
    sql_lines.append("")

sql_lines.append("-- Step 2: Insert labor services")
sql_lines.append("INSERT INTO public.catalog_items (")
sql_lines.append("  name, category_id, sub_category, unit, base_labor_price, base_material_price,")
sql_lines.append("  description, type, is_active, last_verified_at, market_comment")
sql_lines.append(")")
sql_lines.append("VALUES")

values = []
for item in items:
    name_safe = item['name'].replace("'", "''")
    cat_safe = item['category'].replace("'", "''")
    sector_safe = item['sector'].replace("'", "''")
    desc_safe = (item['description'] or "").replace("'", "''")[:500] # Макс 500 символов
    
    val = f"""  (
    '{name_safe}', 
    (SELECT id FROM public.catalog_categories WHERE name = '{cat_safe}' LIMIT 1), 
    '{sector_safe}', 
    '{item['unit']}', 
    {item['price']:.2f}, 
    0.00,
    '{desc_safe}',
    'labor', 
    true, 
    NOW(), 
    'Przedmiar 2024/2025'
  )"""
    values.append(val)

sql_lines.append(",\n".join(values))
sql_lines.append("")
sql_lines.append("ON CONFLICT (name) DO UPDATE SET")
sql_lines.append("  base_labor_price = EXCLUDED.base_labor_price,")
sql_lines.append("  last_verified_at = NOW();")
sql_lines.append("")
sql_lines.append("-- ============================================================================")
sql_lines.append(f"-- SUCCESS: {len(items)} labor services ready to import")
sql_lines.append("-- ============================================================================")

# Сохраняем
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print(f"")
print(f"=" * 80)
print(f"✅ ГОТОВО! SQL файл создан")
print(f"=" * 80)
print(f"📁 Файл: {OUTPUT_FILE}")
print(f"📊 Услуг: {len(items)}")
print(f"")
print(f"🚀 СЛЕДУЮЩИЕ ШАГИ:")
print(f"   1. Открой Supabase SQL Editor")
print(f"   2. Скопируй содержимое файла '{OUTPUT_FILE}'")
print(f"   3. Выполни SQL запрос")
print(f"   4. Обнови /dashboard/catalog")
print(f"")
print(f"💡 СОВЕТ: ON CONFLICT обновит цены, если услуги уже есть в БД!")
