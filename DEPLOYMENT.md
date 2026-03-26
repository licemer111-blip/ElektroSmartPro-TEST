# 🚀 Deployment Guide - ElektroSmart PRO

Kompletny przewodnik wdrożenia aplikacji na produkcję.

---

## 📋 Wymagania Wstępne

Przed rozpoczęciem upewnij się, że masz:

- [ ] Konto GitHub
- [ ] Konto Vercel (https://vercel.com)
- [ ] Konto Supabase (https://supabase.com)
- [ ] Konto Stripe (https://stripe.com)
- [ ] Node.js 18+ zainstalowany lokalnie

---

## 🗄️ KROK 1: Konfiguracja Bazy Danych (Supabase)

### 1.1 Utwórz Projekt

1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
2. Kliknij "New Project"
3. Wypełnij dane:
   - **Name:** elektrosmart-pro
   - **Database Password:** (zapisz bezpiecznie!)
   - **Region:** Europe (Frankfurt) - najbliżej Polski
4. Poczekaj ~2 minuty na utworzenie projektu

### 1.2 Uruchom Migracje

1. W Supabase Dashboard przejdź do: **SQL Editor**
2. Uruchom migracje w kolejności:

**Migracja 1: Schema**
```sql
-- Skopiuj zawartość z: supabase/migrations/001_initial_schema.sql
-- Wklej do SQL Editor i kliknij "Run"
```

**Migracja 2: RLS Policies**
```sql
-- Skopiuj zawartość z: supabase/migrations/002_rls_policies.sql
-- Wklej do SQL Editor i kliknij "Run"
```

**Migracja 3: Seed Data**
```sql
-- Skopiuj zawartość z: supabase/migrations/003_seed_data.sql
-- Wklej do SQL Editor i kliknij "Run"
```

### 1.3 Pobierz Klucze API

1. Przejdź do: **Settings → API**
2. Skopiuj i zapisz:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ TRZYMAJ W TAJEMNICY!)

---

## 💳 KROK 2: Konfiguracja Stripe

### 2.1 Utwórz Konto i Aktywuj

1. Zarejestruj się na [Stripe](https://stripe.com)
2. Wypełnij dane firmy
3. Zweryfikuj konto (może zająć 1-2 dni)

### 2.2 Tryb Testowy (Development)

**Dla lokalnego developmentu używaj TYLKO kluczy testowych:**

1. W Stripe Dashboard przełącz na **Test Mode** (przełącznik w prawym górnym rogu)
2. Przejdź do: **Developers → API keys**
3. Skopiuj:
   - `Publishable key` → `pk_test_...`
   - `Secret key` → `sk_test_...`

**Utwórz Tax Rates (Test Mode):**

1. Przejdź do: **Settings → Tax rates**
2. Kliknij "Create tax rate"

**Tax Rate 1 - VAT 8%:**
```
Display name: VAT 8% (Test)
Percentage: 8.00
Inclusive: No
```
Zapisz i skopiuj ID: `txr_...`

**Tax Rate 2 - VAT 23%:**
```
Display name: VAT 23% (Test)
Percentage: 23.00
Inclusive: No
```
Zapisz i skopiuj ID: `txr_...`

**Zaktualizuj kod:**

Otwórz `app/api/stripe/checkout/route.ts` i zamień linie 6-9:

```typescript
const STRIPE_TAX_RATES = {
  VAT_8: "txr_YOUR_TEST_8_PERCENT_ID",   // Wklej ID z poprzedniego kroku
  VAT_23: "txr_YOUR_TEST_23_PERCENT_ID", // Wklej ID z poprzedniego kroku
} as const;
```

### 2.3 Webhook (Development)

Dla lokalnego testowania:

```bash
# Zainstaluj Stripe CLI
npm install -g stripe

# Zaloguj się
stripe login

# Przekieruj webhooks na localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Skopiuj webhook secret (whsec_...) do .env.local
```

---

## 🌐 KROK 3: Deployment na Vercel

### 3.1 Push do GitHub

```bash
# Zainicjuj repo (jeśli jeszcze nie zrobione)
git init
git add .
git commit -m "Initial commit - ElektroSmart PRO v1.0"

# Utwórz repo na GitHub i push
git remote add origin https://github.com/your-username/elektrosmart-pro.git
git branch -M main
git push -u origin main
```

### 3.2 Import w Vercel

1. Zaloguj się do [Vercel](https://vercel.com)
2. Kliknij "Add New Project"
3. Import z GitHub → wybierz `elektrosmart-pro`
4. **Framework Preset:** Next.js (automatycznie wykryty)
5. **Root Directory:** `./` (domyślnie)

### 3.3 Dodaj Environment Variables (Test Mode)

W sekcji "Environment Variables" dodaj:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (TEST MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (zostaw puste, Vercel ustawi automatycznie)
NEXT_PUBLIC_BASE_URL=
```

⚠️ **Wybierz "Production" environment dla wszystkich zmiennych**

6. Kliknij **"Deploy"**
7. Poczekaj ~2 minuty na build

### 3.4 Skonfiguruj Stripe Webhook (Production)

Po udanym deployu:

1. Skopiuj URL Vercel: `https://your-app.vercel.app`
2. W Stripe Dashboard (Test Mode) przejdź do: **Developers → Webhooks**
3. Kliknij "Add endpoint"
4. **Endpoint URL:** `https://your-app.vercel.app/api/stripe/webhook`
5. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.finalized`
   - `invoice.payment_succeeded`
6. Kliknij "Add endpoint"
7. Skopiuj **Signing secret** (`whsec_...`)
8. Zaktualizuj w Vercel: Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET`
9. Redeploy aplikacji (Vercel → Deployments → Redeploy)

---

## ✅ KROK 4: Testowanie

### 4.1 Test Rejestracji

1. Otwórz: `https://your-app.vercel.app`
2. Kliknij "Zarejestruj się"
3. Utwórz konto testowe
4. Sprawdź email (Supabase wyśle link weryfikacyjny)
5. Zaloguj się

### 4.2 Test Demo Mode

1. Utwórz nowy projekt
2. Dodaj pozycje z katalogu
3. Sprawdź czy ceny są zamazane (blur)
4. Spróbuj utworzyć drugi projekt → powinien być zablokowany

### 4.3 Test Stripe Checkout (Test Mode)

1. Kliknij "Upgrade do PRO"
2. Wybierz VAT (8% lub 23%)
3. Kliknij "Przejdź do płatności"
4. Użyj testowej karty: `4242 4242 4242 4242`
   - Expiry: dowolna przyszła data
   - CVC: dowolne 3 cyfry
5. Dokończ płatność
6. Sprawdź czy:
   - Przekierowano do dashboard z sukcesem
   - Status zmienił się na PRO
   - Ceny są widoczne
   - Można tworzyć więcej projektów

### 4.4 Sprawdź Logi

**Vercel:**
```
Dashboard → Deployments → Latest → Function Logs
```
Szukaj: "✅ [Stripe Checkout]" i "✅ [Stripe Webhook]"

**Stripe:**
```
Dashboard → Webhooks → Your endpoint → Logs
```
Sprawdź czy eventy mają status "Succeeded"

---

## 🔴 KROK 5: Przejście na Live Mode (Produkcja)

⚠️ **Wykonaj TYLKO gdy jesteś gotowy na prawdziwe płatności!**

### 5.1 Aktywuj Stripe Live Mode

1. W Stripe Dashboard przełącz na **Live Mode**
2. Dokończ weryfikację firmy (jeśli nie zrobione)
3. Przejdź do: **Developers → API keys**
4. Skopiuj LIVE keys:
   - `pk_live_...`
   - `sk_live_...`

### 5.2 Utwórz Live Tax Rates

1. W Live Mode przejdź do: **Settings → Tax rates**
2. Utwórz dwa tax rates (tak jak w test mode)
3. Skopiuj LIVE Tax Rate IDs

### 5.3 Zaktualizuj Kod

W `app/api/stripe/checkout/route.ts` zamień na LIVE IDs:

```typescript
const STRIPE_TAX_RATES = {
  VAT_8: "txr_YOUR_LIVE_8_PERCENT_ID",
  VAT_23: "txr_YOUR_LIVE_23_PERCENT_ID",
} as const;
```

Commit i push:
```bash
git add app/api/stripe/checkout/route.ts
git commit -m "Production: Use live Stripe tax rates"
git push origin main
```

### 5.4 Zaktualizuj Vercel Environment Variables

1. Vercel Dashboard → Settings → Environment Variables
2. **Edytuj** (nie dodawaj nowych):
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` → `sk_live_...`
3. Usuń starą wartość `STRIPE_WEBHOOK_SECRET` (utworzymy nową)

### 5.5 Utwórz Live Webhook

1. Stripe Dashboard (Live Mode) → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Wybierz te same eventy co w test mode
4. Skopiuj nowy **Signing secret**
5. Dodaj w Vercel jako `STRIPE_WEBHOOK_SECRET`

### 5.6 Redeploy

Vercel automatycznie zrobi redeploy po pushu.

### 5.7 Test z Prawdziwą Kartą

⚠️ **To będzie prawdziwa płatność!**

1. Otwórz aplikację
2. Przejdź przez checkout
3. Użyj prawdziwej karty
4. Zweryfikuj płatność w Stripe Dashboard (Live Mode)

---

## 🔧 Troubleshooting

### Problem: Webhook nie działa

**Rozwiązanie:**
1. Sprawdź URL webhook w Stripe (czy zgadza się z Vercel)
2. Sprawdź `STRIPE_WEBHOOK_SECRET` w Vercel
3. Zobacz logi w Stripe Dashboard → Webhooks → Logs
4. Zobacz logi w Vercel → Function Logs

### Problem: Użytkownik nie został upgraded do PRO

**Rozwiązanie:**
1. Sprawdź Stripe Dashboard → Payments (czy płatność przeszła)
2. Sprawdź Stripe Dashboard → Webhooks (czy event został wysłany)
3. Sprawdź Vercel Function Logs (czy webhook był przetworzony)
4. Sprawdź Supabase → Table Editor → profiles (czy `is_pro = true`)

### Problem: Błąd "Missing userId in metadata"

**Rozwiązanie:**
1. Upewnij się że użytkownik jest zalogowany przed checkout
2. Sprawdź czy `userId` jest w session metadata (Stripe Dashboard → Payment → Metadata)

---

## 📊 Monitoring

### Codziennie (pierwsze 7 dni):

- [ ] Sprawdź Stripe Dashboard → Payments
- [ ] Sprawdź Vercel Analytics
- [ ] Sprawdź Vercel Function Logs (czy są błędy)
- [ ] Sprawdź Supabase Logs

### Co tydzień:

- [ ] Przejrzyj failed payments w Stripe
- [ ] Sprawdź webhook success rate (powinien być 100%)
- [ ] Backup bazy danych (Supabase ma automatyczne)

---

## 🔄 Rollback (jeśli coś pójdzie nie tak)

### Opcja 1: Powrót do Test Mode

1. Vercel → Environment Variables
2. Zmień Stripe keys z powrotem na `pk_test_...` i `sk_test_...`
3. Zmień webhook secret na testowy
4. Redeploy

### Opcja 2: Rollback do poprzedniego deployu

1. Vercel → Deployments
2. Znajdź poprzedni working deployment
3. Kliknij "..." → "Promote to Production"

---

## 📞 Wsparcie

**Dokumentacja:**
- Stripe: https://stripe.com/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs

**Support:**
- Stripe Support: https://support.stripe.com
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support

---

## ✅ Checklist Deploymentu

- [ ] Supabase projekt utworzony
- [ ] Migracje wykonane
- [ ] Stripe konto zweryfikowane
- [ ] Tax rates utworzone (test mode)
- [ ] Kod zaktualizowany z tax rate IDs
- [ ] Repo na GitHub
- [ ] Vercel projekt utworzony
- [ ] Environment variables dodane
- [ ] Webhook skonfigurowany
- [ ] Aplikacja przetestowana (test mode)
- [ ] Wszystko działa poprawnie
- [ ] (Opcjonalnie) Przełączono na Live Mode

---

**Powodzenia z deploymentem!** 🚀

**Version:** 1.0.0  
**Last Updated:** 2026-01-15
