# 📁 Scripts Directory

Эта папка содержит утилиты для импорта каталогов от поставщиков в ElektroSmart PRO.

---

## 📦 **Schneider Electric Import (Materials)**

Импорт прайс-листа Schneider Electric (~13000 позиций материалов) в глобальный каталог.

### **Основные файлы:**

| Файл | Назначение |
|------|------------|
| `QUICK_START.md` | ⚡ Быстрый старт (3 шага) |
| `README_SCHNEIDER_IMPORT.md` | 📖 Полная документация |
| `import_schneider_catalog.py` | 🐍 Основной скрипт импорта (Python) |
| `check_import_progress.sql` | 📊 Мониторинг прогресса импорта |
| `rollback_schneider.sql` | 🔄 Откат импорта (удаление всех Schneider позиций) |

---

## 📋 **Labor Services Import (Robocizna)**

Импорт промышленных услуг (robocizna/labor) из отчетов Przedmiar в каталог.

### **Основные файлы:**

| Файл | Назначение |
|------|------------|
| `README_LABOR_IMPORT.md` | 📖 Полная документация |
| `import_labor_services.py` | 🐍 Парсер Markdown → SQL для услуг |

### **Сгенерированные файлы (не в Git):**

- `schneider_import_sql/` - Папка с батчами SQL файлов (27 файлов по 500 позиций)
- `Cennik_SCHNEIDER_ELECTRIC.xlsm` - Исходный Excel прайс (user data)

---

## 🚀 **Как использовать:**

### **Вариант 1: Быстрый старт**
```bash
cd scripts
cat QUICK_START.md  # Читай и следуй инструкциям
```

### **Вариант 2: Полная инструкция**
```bash
cd scripts
cat README_SCHNEIDER_IMPORT.md  # Детальная документация
```

---

## 🎯 **Workflow импорта:**

### **Материалы (Materials):**

```
1. Excel Прайс (Schneider)
   ↓
2. Python скрипт (import_schneider_catalog.py)
   ↓
3. SQL Батчи (schneider_import_sql/*.sql)
   ↓
4. Supabase SQL Editor (выполнить по очереди)
   ↓
5. Проверка (check_import_progress.sql)
   ↓
6. Готово! (/dashboard/catalog → ~14430 позиций)
```

### **Услуги (Labor/Robocizna):**

```
1. Markdown Отчет (Przedmiar)
   ↓
2. Python скрипт (import_labor_services.py)
   ↓
3. SQL файл (import_labor_services.sql)
   ↓
4. Supabase SQL Editor (выполнить)
   ↓
5. Готово! (+80-150 usług w katalogu)
```

---

## 🛠️ **Требования:**

```bash
pip install pandas openpyxl
```

---

## 📊 **Результат:**

После успешного импорта:

### **Материалы (Schneider Electric):**
- ✅ **~13000 новых позиций** материалов в глобальном каталоге
- ✅ **Артикулы Schneider** в названиях (Ref: A9R41225)
- ✅ **Автоматический маппинг** на категории ElektroSmart
- ✅ **Нормализация единиц** (szt., mb, kpl., op., m², kg)
- ✅ **Ценовые диапазоны** (±10% от базовой цены)

### **Услуги (Robocizna):**
- ✅ **~80-150 услуг** в каталоге (type = 'labor')
- ✅ **Группировка по секторам** (Hale, Biura, Mieszkania, Infrastruktura)
- ✅ **Цены за работу** (robocizna) из отчетов Przedmiar
- ✅ **Готовые zestawy** для типовых объектов

---

## 🔄 **Обновление прайс-листа:**

Если Schneider выпустил новый прайс:

1. Удали старый: `rollback_schneider.sql`
2. Замени Excel файл
3. Запусти импорт заново: `python import_schneider_catalog.py`
4. Загрузи новые SQL батчи

**ON CONFLICT** автоматически обновит существующие позиции!

---

## 🐛 **Troubleshooting:**

### **Ошибка: "No module named 'pandas'"**
```bash
pip install pandas openpyxl
```

### **Ошибка: "File not found: Cennik_SCHNEIDER_ELECTRIC.xlsm"**
Помести Excel файл в папку `scripts/`

### **SQL Editor зависает**
- Уменьши `BATCH_SIZE` до 300 в скрипте
- Перезапусти генерацию

### **Импорт не завершается**
Используй `check_import_progress.sql` для мониторинга

---

## 📈 **Планы на будущее:**

### **Материалы:**
- [ ] Скрипт для импорта **ABB** прайсов
- [ ] Скрипт для импорта **Legrand** прайсов
- [ ] Скрипт для импорта **OBO Bettermann** прайсов
- [ ] Автоматический парсер цен с сайтов поставщиков
- [ ] Автообновление цен через API поставщиков

### **Услуги:**
- [x] Парсер Markdown отчетов (Przedmiar) ✅
- [ ] Парсер Excel отчетов (норматив работ)
- [ ] Парсер PDF прайсов (OCR + AI)
- [ ] Интеграция с AI Lab для автоматической генерации услуг

### **Общее:**
- [ ] CLI tool для управления импортами
- [ ] Web UI для загрузки прайсов (Admin Panel)
- [ ] Система версионирования каталога
- [ ] Автоматическое сравнение цен между поставщиками

---

## 📝 **Changelog:**

### v3.0 (2026-01-22)
- ✅ Добавлен импорт услуг (robocizna) из Markdown отчетов
- ✅ Парсер Przedmiar отчетов → SQL
- ✅ Группировка услуг по секторам (Hale, Biura, Mieszkania)
- ✅ README_LABOR_IMPORT.md с полной документацией

### v2.0 (2026-01-22)
- ✅ Добавлен батчевый режим (500 позиций на файл)
- ✅ SQL утилиты для мониторинга и отката
- ✅ QUICK_START.md для новичков

### v1.0 (2026-01-22)
- ✅ Первая версия импорта Schneider Electric
- ✅ Поддержка ~13000 позиций материалов

---

**Автор:** ElektroSmart PRO Team  
**Лицензия:** MIT
