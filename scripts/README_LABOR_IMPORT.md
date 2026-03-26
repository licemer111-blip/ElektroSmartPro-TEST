# 📋 IMPORT LABOR SERVICES (Robocizna)

Этот скрипт импортирует промышленные услуги (robocizna/labor) из отчета Przedmiar в глобальный каталог ElektroSmart PRO.

---

## 📁 **Файлы:**

| Файл | Назначение |
|------|------------|
| `import_labor_services.py` | 🐍 Основной скрипт импорта |
| `check_labor_import.sql` | 📊 Проверка прогресса импорта |
| `rollback_labor.sql` | 🔄 Откат импорта (удаление услуг) |

---

## 📋 **Требования:**

```bash
pip install pandas  # (опционально, если нужна дополнительная обработка)
```

Python 3.x встроенные библиотеки: `re`, `os`, `datetime`

---

## 🚀 **Использование:**

### **Шаг 1: Подготовь отчет Markdown**

Помести файл отчета в папку `scripts/`:
```
scripts/
├── import_labor_services.py
└── Przedmiar_Robót_Elektrycznych_Raport_2024_2025.md  ← Твой файл
```

**Формат отчета (Markdown):**
```markdown
## SEKTOR 1: Hale i Magazyny

### Montaż koryt kablowych siatkowych
- **Jednostka:** mb
- **Robocizna:** 35 zł/mb
- Opis: Instalacja koryt kablowych...

### Montaż opraw LED
- **Jednostka:** szt
- **Robocizna:** 120 zł/szt
```

### **Шаг 2: Запусти скрипт**

```bash
cd scripts
python import_labor_services.py
```

**Результат:**
```
📂 Загружаю отчет: Przedmiar_Robót_Elektrycznych_Raport_2024_2025.md...
✅ Загружено 45320 символов
🔍 Парсинг отчета...
✅ Найдено 87 услуг
📊 Разбивка по секторам:
   - Hale i Magazyny: 32 услуг (ср. цена: 45.20 PLN)
   - Biura i Usługi: 28 услуг (ср. цена: 38.50 PLN)
   - Mieszkania (Deweloper): 27 услуг (ср. цена: 52.10 PLN)
🔧 Генерация SQL...

================================================================================
✅ ГОТОВО! SQL файл создан
================================================================================
📁 Файл: import_labor_services.sql
📊 Услуг: 87
```

### **Шаг 3: Импортируй в Supabase**

1. Зайди в **Supabase Dashboard** → SQL Editor
2. Открой файл `import_labor_services.sql`
3. Скопируй содержимое и нажми **Run**
4. ✅ Дождись "Success" (~2-5 секунд)

---

## 🎯 **Что делает скрипт:**

1. ✅ Читает Markdown отчет с предмером работ
2. ✅ Парсит структуру:
   - Заголовки секторов (`### SEKTOR 1`)
   - Названия услуг (жирный текст или заголовки)
   - Единицы измерения (`- **Jednostka:** mb`)
   - Цены за работу (`- **Robocizna:** 35 zł/mb`)
3. ✅ Нормализует единицы (mb, szt., kpl., m², rbh)
4. ✅ Группирует по секторам:
   - Hale i Magazyny → Категория "Przemysł"
   - Biura i Usługi → Категория "Komercja"
   - Mieszkania → Категория "Deweloperka"
   - Infrastruktura → Категория "Infrastruktura"
5. ✅ Генерирует SQL для вставки в БД
6. ✅ ON CONFLICT обновляет цены, если услуга уже есть

---

## 📊 **Пример вывода SQL:**

```sql
-- Step 1: Create categories if not exist
INSERT INTO public.catalog_categories (name)
SELECT 'Przemysł'
WHERE NOT EXISTS (SELECT 1 FROM public.catalog_categories WHERE name = 'Przemysł');

-- Step 2: Insert labor services
INSERT INTO public.catalog_items (
  name, category_id, sub_category, unit, base_labor_price, base_material_price,
  description, type, is_active, last_verified_at, market_comment
)
VALUES
  (
    'Montaż koryt kablowych siatkowych', 
    (SELECT id FROM public.catalog_categories WHERE name = 'Przemysł' LIMIT 1), 
    'Hale i Magazyny', 
    'mb', 
    35.00, 
    0.00,
    'Instalacja koryt kablowych w halach przemysłowych',
    'labor', 
    true, 
    NOW(), 
    'Przedmiar 2024/2025'
  ),
  ...
```

---

## ⚙️ **Настройка:**

### **Изменить имя входного файла:**

Открой `import_labor_services.py` и измени строку 11:

```python
INPUT_FILE = 'Twój_Plik_Przedmiar.md'
```

### **Изменить категории:**

Измени маппинг категорий (строки ~95-105):

```python
if "SEKTOR 1" in line:
    current_sector = "Twoja Kategoria"
    current_category = "Twoja Nadkategoria"
```

### **Добавить новые единицы измерения:**

Добавь в функцию `normalize_unit()` (строка ~40):

```python
if u in ['twoja_jednostka', 'alias']:
    return 'jednostka'
```

---

## 📈 **Результат:**

После импорта в каталоге будут:
- 🟢 **Materiały (Schneider):** ~13000 pozycji
- 🔵 **+ Usługi (Labor):** ~80-150 pozycji
- **ИТОГО:** ~13150+ pozycji w katalogu

**Struktura usług:**
```
Przemysł (Hale):           ~30-40 usług
Komercja (Biura):          ~25-35 usług
Deweloperka (Mieszkania):  ~25-35 usług
Infrastruktura:            ~10-20 usług
```

---

## 💡 **Советы:**

### **1. Проверка импорта**

После импорта проверь количество:

```sql
-- Проверка: сколько labor позиций в БД?
SELECT COUNT(*) FROM catalog_items 
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025';
```

**Ожидаемый результат:** ~80-150 услуг

### **2. Проверка цен**

Топ-10 самых дорогих услуг:

```sql
SELECT name, base_labor_price, unit
FROM catalog_items
WHERE type = 'labor' AND market_comment = 'Przedmiar 2024/2025'
ORDER BY base_labor_price DESC
LIMIT 10;
```

### **3. Обновление цен**

Если прайс обновился, просто запусти скрипт заново.

**ON CONFLICT** автоматически обновит цены!

---

## 🐛 **Troubleshooting:**

### **Ошибка: "Файл не найден"**

**Причина:** Файл Markdown не в папке `scripts/`

**Решение:** Помести файл в папку scripts/ или измени `INPUT_FILE`

### **Ошибка: "Найдено 0 услуг"**

**Причина:** Формат Markdown не соответствует ожидаемому

**Решение:** Проверь, что в файле есть:
- Заголовки секторов (`### SEKTOR 1`)
- Строки с ценами (`- **Robocizna:** 35 zł`)

### **Проблемы с кодировкой**

Если видишь кракозябры:
```python
with open(INPUT_FILE, 'r', encoding='cp1250') as f:  # Для Windows PL
```

---

## 🔄 **Обновление отчета:**

### **Вариант 1: AI Lab (рекомендуется)**

1. Зайди в `/dashboard/ai-lab`
2. Загрузи PDF/Excel с новым предмером
3. AI автоматически создаст список работ
4. Экспортируй → Markdown
5. Запусти скрипт

### **Вариант 2: Ручной парсинг**

1. Открой новый PDF/Excel
2. Скопируй содержимое в Markdown файл
3. Соблюдай формат:
   ```markdown
   ### Название работы
   - **Jednostka:** mb
   - **Robocizna:** 35 zł/mb
   ```
4. Запусти скрипт

---

## 🎯 **После импорта:**

### **Шаг 1: Проверь каталог**

Зайди в `/dashboard/catalog` → фильтр "Только Robocizna"

### **Шаг 2: Создай зestaw (готовый набор)**

Используй новые услуги в Zestawach:
1. Zestaw "Instalacja hali 500m²"
2. Dodaj usługi: Montaż koryt, układanie przewodów, oprawy LED...
3. Zapisz

### **Шаг 3: Используй в проектах**

Dodaj Zestaw do projektu → автоматически подтянутся все услуги с ценами!

---

## 📊 **SQL Утилиты:**

### **check_labor_import.sql**

Проверка импорта услуг в реальном времени:

```sql
-- Запусти в Supabase SQL Editor
-- Увидишь:
-- 1. Общее количество услуг
-- 2. Разбивка по секторам
-- 3. Разбивка по единицам
-- 4. Топ-10 самых дорогих услуг
-- 5. Топ-10 самых дешевых услуг
-- 6. Проверка дубликатов
-- 7. Сравнение материалы vs услуги
-- 8. Общая статистика каталога
-- 9. Поиск по ключевым словам
```

**Когда использовать:**
- После каждого импорта для проверки
- Для анализа структуры цен
- Для поиска конкретных услуг

### **rollback_labor.sql**

Безопасное удаление всех услуг Przedmiar:

```sql
-- Шаг 1: Проверка (сколько удалится)
-- Шаг 2: Детальная статистика
-- Шаг 3: DELETE (раскомментируй)
-- Шаг 4: Проверка после удаления (должно быть 0)
```

**Когда использовать:**
- Нужно переимпортировать услуги с нуля
- Изменился формат отчета
- Обновились цены (или просто запусти импорт заново с ON CONFLICT)

---

**Автор:** ElektroSmart PRO Team  
**Дата:** 22 stycznia 2026  
**Версия:** 1.0
