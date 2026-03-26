# ⚡ БЫСТРЫЙ СТАРТ: Импорт услуг (Robocizna)

## 📦 Что нужно:

1. Python 3.x
2. Markdown файл с отчетом Przedmiar

---

## 🚀 3 простых шага:

### **1. Подготовь файл отчета**
```
scripts/
├── import_labor_services.py
└── Przedmiar_Robót_Elektrycznych_Raport_2024_2025.md  ← Твой файл
```

**Формат файла (Markdown):**
```markdown
## SEKTOR 1: Hale i Magazyny

### Montaż koryt kablowych
- **Jednostka:** mb
- **Robocizna:** 35 zł/mb

### Montaż opraw LED
- **Jednostka:** szt
- **Robocizna:** 120 zł/szt
```

### **2. Запусти скрипт**
```bash
cd scripts
python import_labor_services.py
```

**Результат:** Файл `import_labor_services.sql`

### **3. Импортируй в Supabase**

1. Открой: https://supabase.com/dashboard
2. SQL Editor → New Query
3. Скопируй содержимое `import_labor_services.sql`
4. Нажми **Run** ✅

---

## ✅ Готово!

Зайди в `/dashboard/catalog` → фильтр "Robocizna" → увидишь новые услуги!

---

## 💡 Совет:

Если отчет в формате PDF или Excel:
1. Зайди в `/dashboard/ai-lab`
2. Загрузи файл
3. AI создаст Markdown → скопируй и сохрани
4. Запусти скрипт

---

## 📖 Подробнее:

Читай полную инструкцию: `README_LABOR_IMPORT.md`
