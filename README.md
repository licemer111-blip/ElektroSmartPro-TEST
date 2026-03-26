# ⚡ ElektroSmart PRO v3.5

**Profesjonalna aplikacja SaaS do kosztorysowania elektrycznego dla polskiego rynku**

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?style=flat&logo=stripe)](https://stripe.com/)

---

## 🎯 O Projekcie

**ElektroSmart PRO** to nowoczesna aplikacja webowa do tworzenia profesjonalnych kosztorysów elektrycznych z CRM, analityką biznesową i współpracą zespołową. Stworzona specjalnie dla polskiego rynku z uwzględnieniem lokalnych przepisów VAT i regionalnych współczynników cenowych.

### ✨ Główne Funkcje

- 📊 **Tworzenie Kosztorysów** - Intuicyjny kreator z podziałem na robociznę i materiały
- 🗂️ **Katalog Materiałów** - Rozbudowana baza 1200+ pozycji elektrycznych
- 🤖 **AI Lab** - Analiza PDF/Excel, Vision Mode dla rzutów budowlanych
- 🔍 **Inteligentna Wyszukiwarka** - Fulltext search z obsługą błędów pisowni
- 🔧 **Zestawy (Assemblies)** - Gotowe zestawy robót z AI Generator
- 👥 **CRM Klientów** - Baza klientów z historią projektów (NEW v3.5)
- 📈 **Analityka Biznesowa** - Wykresy przychodów, top klienci (NEW v3.5)
- 👨‍👩‍👧‍👦 **Współpraca Zespołowa** - Wspólne edytowanie projektów (NEW v3.5)
- 🔔 **Przypomnienia Deadlines** - Email + push notifications (NEW v3.5)
- 📦 **Bulk Operacje** - Masowe usuwanie/archiwizowanie (NEW v3.5)
- 🌍 **Współczynniki Regionalne** - Automatyczne dostosowanie cen do 16 województw
- 💰 **VAT 8% / 23%** - Wsparcie dla budownictwa mieszkaniowego i komercyjnego
- 📄 **Eksport PDF/Excel** - Profesjonalne kosztorysy z Twoim logo
- 🧮 **11 Kalkulatorów** - Przekroje kabli, prąd zwarcia, PV, oświetlenie
- 💳 **Subskrypcja PRO** - Integracja z Stripe (płatności cykliczne)

---

## 🏗️ Architektura

### Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Lucide React Icons

**Backend:**
- Supabase (PostgreSQL, Auth, Realtime, RLS)
- Server Actions
- Stripe API

**Deployment:**
- Vercel (hosting)
- Supabase Cloud (database)
- Stripe (payments)

### Struktura Bazy Danych

```
profiles          → Profile użytkowników (is_pro, subscription_id)
projects          → Projekty kosztorysowe
project_items     → Pozycje w projektach
catalog_items     → Katalog materiałów (visibility: personal/team)
user_assemblies   → Zestawy robót użytkowników
user_assembly_items → Pozycje w zestawach
clients           → CRM - baza klientów (NEW v3.5)
teams             → Zespoły (współpraca)
team_members      → Członkowie zespołów
regions           → Województwa (współczynniki cenowe)
object_types      → Typy obiektów (VAT 8% / 23%)
payments          → Historia płatności (admin)
```

---

## 🚀 Szybki Start

### Wymagania

- Node.js 18+
- npm lub yarn
- Konto Supabase
- Konto Stripe

### 1. Klonowanie Repozytorium

```bash
git clone https://github.com/your-username/elektrosmart-pro.git
cd elektrosmart-pro
```

### 2. Instalacja Zależności

```bash
npm install
```

### 3. Konfiguracja Zmiennych Środowiskowych

Utwórz plik `.env.local` w głównym katalogu:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Test Mode dla development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Konfiguracja Bazy Danych

1. Utwórz projekt w [Supabase](https://supabase.com)
2. Uruchom migracje z folderu `supabase/migrations/` w kolejności:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`

### 5. Uruchomienie Aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment

### Vercel (Recommended)

1. **Push do GitHub:**
```bash
git push origin main
```

2. **Import w Vercel:**
   - Połącz repozytorium GitHub
   - Dodaj zmienne środowiskowe (Production)
   - Deploy

3. **Konfiguracja Stripe Webhook:**
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

### Szczegółowe Instrukcje

Zobacz pełny przewodnik w pliku: **`DEPLOYMENT.md`**

---

## 🔐 Bezpieczeństwo

- ✅ **Supabase RLS** - Row Level Security dla wszystkich tabel
- ✅ **Stripe Webhooks** - Weryfikacja podpisu dla wszystkich eventów
- ✅ **Environment Variables** - Wszystkie klucze API w zmiennych środowiskowych
- ✅ **Server Actions** - Bezpieczne operacje po stronie serwera
- ✅ **TypeScript** - Pełna typizacja dla bezpieczeństwa typów

---

## 💼 Model Biznesowy

### Demo Mode (Darmowy)
- ✅ 1 aktywny projekt
- ❌ Ceny ukryte (blur)
- ❌ Brak eksportu PDF
- ✅ Pełny dostęp do katalogu

### PRO Mode (159 PLN/miesiąc + VAT)
- ✅ Nielimitowane projekty
- ✅ Pełne ceny
- ✅ Eksport PDF z logo
- ✅ Wsparcie priorytetowe

---

## 📊 Kluczowa Logika Biznesowa

### 1. Split Pricing
Każda pozycja ma osobne kolumny:
- `labor_price` (robocizna)
- `material_price` (materiały)

### 2. Współczynniki Regionalne
Cena finalna = Cena bazowa × Współczynnik województwa

### 3. VAT
- **8%** - Budownictwo mieszkaniowe
- **23%** - Działalność komercyjna

### 4. Zestawy (Assemblies)
Złożone pozycje (np. "Punkt gniazda") rozwijane do pojedynczych `project_items`

---

## 🛠️ Komendy

```bash
# Development
npm run dev          # Uruchom dev server

# Build
npm run build        # Build produkcyjny
npm run start        # Uruchom build

# Linting
npm run lint         # ESLint check
```

---

## 📁 Struktura Projektu

```
elektrosmart-pro/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Strony auth (login, register)
│   ├── dashboard/         # Dashboard (projekty, katalog)
│   ├── api/               # API routes (Stripe, webhooks)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── catalog/          # Katalog materiałów
│   ├── project/          # Kreator projektów
│   ├── subscription/     # Stripe checkout
│   └── ui/               # Shadcn UI components
├── lib/                   # Utilities
│   ├── stripe.ts         # Stripe config
│   ├── supabase-admin.ts # Supabase admin client
│   └── types/            # TypeScript types
├── supabase/             # Database
│   └── migrations/       # SQL migrations
├── utils/                # Helper functions
└── public/               # Static assets
```

---

## 📚 Dokumentacja

### **Dla Developerów:**
- 📖 [`docs/CATALOG_SEARCH.md`](docs/CATALOG_SEARCH.md) - Pełna dokumentacja systemu wyszukiwania
- ⚡ [`docs/QUICK_START_SEARCH.md`](docs/QUICK_START_SEARCH.md) - Szybki start (5 min)
- 🎣 [`docs/USE_CATALOG_SEARCH_HOOK.md`](docs/USE_CATALOG_SEARCH_HOOK.md) - React Hook dla wyszukiwania
- 🎨 [`docs/CATALOG_SEARCH_COMPONENTS.md`](docs/CATALOG_SEARCH_COMPONENTS.md) - Gotowe komponenty wyszukiwania
- 🔖 [`docs/CATALOG_SEARCH_WITH_TABS.md`](docs/CATALOG_SEARCH_WITH_TABS.md) - Komponenty z Tabs (Labor/Materiały)
- 🔨 [`docs/SEARCH_WITH_LABOR_PRIORITY.md`](docs/SEARCH_WITH_LABOR_PRIORITY.md) - Wyszukiwanie z priorytetem usług
- 🎨 [`docs/CATALOG_DISPLAY_UTILS.md`](docs/CATALOG_DISPLAY_UTILS.md) - Utilities do wyświetlania (parsing Ref codes)
- ⚡ [`docs/PERFORMANCE_FIX_GLOBAL_CATALOG.md`](docs/PERFORMANCE_FIX_GLOBAL_CATALOG.md) - Critical performance fix (10s → <1s)
- ⚙️ [`docs/GRANULAR_CATALOG_CONTROL.md`](docs/GRANULAR_CATALOG_CONTROL.md) - Two toggles: Base Global + Schneider
- 📘 [`docs/CATALOG_API_SIMPLE.md`](docs/CATALOG_API_SIMPLE.md) - Uproszczone API dla wyszukiwania
- ⚡ [`docs/QUICK_FIX_GUIDE.md`](docs/QUICK_FIX_GUIDE.md) - Szybkie naprawy błędów (ściągawka)
- ❌ [`docs/COMMON_MISTAKES.md`](docs/COMMON_MISTAKES.md) - Częste błędy i jak ich unikać
- 🚀 [`docs/SEARCH_PERFORMANCE.md`](docs/SEARCH_PERFORMANCE.md) - Optymalizacja wydajności wyszukiwania
- ⚡ [`docs/QUICK_SEARCH_FIX.md`](docs/QUICK_SEARCH_FIX.md) - Szybka naprawa wolnego wyszukiwania
- 🔍 [`docs/SEARCH_DIAGNOSTICS.md`](docs/SEARCH_DIAGNOSTICS.md) - Diagnostyka i troubleshooting wyszukiwania
- 📊 [`docs/INTERPRET_EXPLAIN_ANALYZE.md`](docs/INTERPRET_EXPLAIN_ANALYZE.md) - Interpretacja wyników EXPLAIN ANALYZE
- 📋 [`docs/POSTGRES_COLUMN_NAMES.md`](docs/POSTGRES_COLUMN_NAMES.md) - Prawidłowe nazwy kolumn w PostgreSQL
- 🔧 [`docs/FIX_DUPLICATE_FUNCTIONS.md`](docs/FIX_DUPLICATE_FUNCTIONS.md) - Naprawa duplikatów funkcji SQL
- 🔧 [`docs/FIX_ENUM_TYPE_ERROR.md`](docs/FIX_ENUM_TYPE_ERROR.md) - Naprawa błędu ENUM → TEXT w funkcjach
- 🔧 [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deployment & Setup

### **Import Katalogów:**
- 📦 [`scripts/README.md`](scripts/README.md) - Przegląd narzędzi importu
- 🐍 [`scripts/README_SCHNEIDER_IMPORT.md`](scripts/README_SCHNEIDER_IMPORT.md) - Import Schneider Electric (~13k pozycji)
- 📋 [`scripts/README_LABOR_IMPORT.md`](scripts/README_LABOR_IMPORT.md) - Import usług z Przedmiarów

---

## 🤝 Wsparcie

Jeśli masz pytania lub napotkasz problemy:

1. Sprawdź dokumentację w folderze `docs/`
2. Przejrzyj logi w Vercel Dashboard
3. Sprawdź Stripe Dashboard → Webhooks

---

## 📄 Licencja

Proprietary - Wszystkie prawa zastrzeżone

---

## 🎯 Roadmap

- [ ] Eksport do Excel
- [ ] Szablony kosztorysów
- [ ] Współpraca zespołowa (multi-user)
- [ ] Integracja z systemami księgowymi
- [ ] Aplikacja mobilna

---

**Stworzone z ❤️ dla polskich elektryków**

**Version:** 3.0.0 (Fulltext Search + Import System)  
**Last Updated:** 2026-01-22
