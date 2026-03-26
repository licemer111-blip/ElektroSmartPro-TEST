# ⚡ БЫСТРЫЙ СТАРТ: Импорт Schneider Electric

## 📦 Что нужно:

1. Python 3.x
2. Файл `Cennik_SCHNEIDER_ELECTRIC.xlsm`

---

## 🚀 3 простых шага:

### **1. Установка**
```bash
pip install pandas openpyxl
```

### **2. Генерация SQL**
```bash
cd scripts
python import_schneider_catalog.py
```

**Результат:** Папка `schneider_import_sql/` с 27 SQL файлами

### **3. Импорт в Supabase**

1. Открой: https://supabase.com/dashboard
2. SQL Editor → New Query
3. Загружай файлы по очереди:
   - `schneider_part_001_of_027.sql` ✅
   - `schneider_part_002_of_027.sql` ✅
   - `schneider_part_003_of_027.sql` ✅
   - ... продолжай до 027

**Каждый файл = 5-10 секунд**

---

## ✅ Готово!

Зайди в `/dashboard/catalog` → должно быть **~14430 позиций**

---

## 📖 Подробнее:

Читай полную инструкцию: `README_SCHNEIDER_IMPORT.md`
