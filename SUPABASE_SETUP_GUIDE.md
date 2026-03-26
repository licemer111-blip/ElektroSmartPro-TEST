# 🚀 Przewodnik Instalacji Bazy Danych - ElektroSmart PRO

## 📋 Spis Treści

1. [Wymagania](#wymagania)
2. [Szybki Start](#szybki-start)
3. [Szczegółowa Instrukcja](#szczegółowa-instrukcja)
4. [Weryfikacja](#weryfikacja)
5. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## ✅ Wymagania

- Konto w [Supabase](https://supabase.com) (darmowe lub płatne)
- Dostęp do **SQL Editor** w panelu Supabase
- ~5 minut czasu

---

## ⚡ Szybki Start

### Opcja A: Nowa Instalacja (Czysta Baza)

```sql
-- Uruchom TYLKO ten plik w Supabase SQL Editor:
supabase/FULL_SETUP.sql
```

### Opcja B: Reset + Instalacja (Jeśli masz już dane)

```sql
-- 1. Najpierw wyczyść bazę (UWAGA: usuwa wszystkie dane!)
supabase/HARD_RESET.sql

-- 2. Następnie zainstaluj od zera
supabase/FULL_SETUP.sql
```

---

## 📖 Szczegółowa Instrukcja

### Krok 1: Zaloguj się do Supabase

1. Wejdź na [https://supabase.com](https://supabase.com)
2. Zaloguj się do swojego konta
3. Wybierz projekt **ElektroSmart PRO** (lub utwórz nowy)

### Krok 2: Otwórz SQL Editor

1. W lewym menu kliknij **SQL Editor**
2. Kliknij **New Query** (Nowe zapytanie)

### Krok 3: Uruchom Skrypt Instalacyjny

#### Opcja A: Nowa Instalacja

1. Otwórz plik `supabase/FULL_SETUP.sql` w edytorze kodu
2. Skopiuj **całą zawartość** pliku
3. Wklej do **SQL Editor** w Supabase
4. Kliknij **Run** (lub Ctrl+Enter)
5. Poczekaj ~30 sekund na zakończenie

#### Opcja B: Reset Istniejącej Bazy

**⚠️ UWAGA: To usunie WSZYSTKIE dane z bazy!**

1. Otwórz plik `supabase/HARD_RESET.sql`
2. Skopiuj całą zawartość
3. Wklej do SQL Editor
4. Kliknij **Run**
5. Poczekaj na zakończenie (~5 sekund)
6. Następnie wykonaj **Opcję A** powyżej

### Krok 4: Sprawdź Wynik

Po uruchomieniu skryptu powinieneś zobaczyć:

```
✅ Success. No rows returned
```

Lub komunikaty typu:

```
NOTICE: Created 16 regions
NOTICE: Created 3 object types
NOTICE: Created 15 categories
NOTICE: Inserted 100+ catalog items
```

---

## 🔍 Weryfikacja

### 1. Sprawdź Tabele

W Supabase przejdź do **Table Editor** i sprawdź, czy istnieją tabele:

- ✅ `profiles`
- ✅ `regions` (16 wierszy)
- ✅ `object_types` (3 wiersze)
- ✅ `catalog_categories` (15 wierszy)
- ✅ `catalog_items` (~100 wierszy)
- ✅ `projects`
- ✅ `project_items`
- ✅ `kits` (3 wiersze)
- ✅ `kit_items` (~12 wierszy)
- ✅ `user_assemblies`
- ✅ `user_assembly_items`
- ✅ `assembly_categories`
- ✅ `project_categories`
- ✅ `feedback`
- ✅ `payments`

### 2. Sprawdź Dane

#### Regiony (16 województw)

```sql
SELECT * FROM regions ORDER BY name;
```

Powinno zwrócić 16 wierszy:
- Dolnośląskie (1.05)
- Kujawsko-Pomorskie (0.95)
- Lubelskie (0.90)
- ... itd.

#### Typy Obiektów (3 typy)

```sql
SELECT * FROM object_types;
```

Powinno zwrócić:
- Mieszkanie / Dom (VAT 8/23%)
- Biuro / Lokale (VAT 23%)
- Przemysł / Hala (VAT 23%)

#### Kategorie Katalogu (15 kategorii)

```sql
SELECT name, sort_order FROM catalog_categories ORDER BY sort_order;
```

Powinno zwrócić:
1. Demontaże
2. Prace Ziemne
3. Uziemienie/Odgrom
4. Trasy Kablowe
5. Okablowanie
6. Przygotowanie
7. Rozdzielnice
8. Oświetlenie
9. Awaryjne
10. Teletechnika
11. Security
12. Biuro
13. Pomiary
14. PPOŻ
15. Monitoring

#### Pozycje Katalogu (~100 pozycji)

```sql
SELECT COUNT(*) as total_items FROM catalog_items WHERE user_id IS NULL;
```

Powinno zwrócić ~100 pozycji (globalny katalog).

### 3. Test Funkcjonalności

#### A. Test Rejestracji Użytkownika

1. Uruchom aplikację lokalnie: `npm run dev`
2. Wejdź na [http://localhost:3000](http://localhost:3000)
3. Kliknij **Zarejestruj się**
4. Wypełnij formularz i zarejestruj nowe konto
5. Po zalogowaniu sprawdź w Supabase:

```sql
SELECT id, company_name, is_pro, max_projects FROM profiles;
```

Powinien pojawić się nowy profil z:
- `is_pro = false`
- `max_projects = 1`

#### B. Test Katalogu

1. Zaloguj się do aplikacji
2. Przejdź do **Dashboard → Katalog**
3. Powinieneś zobaczyć ~100 pozycji w 15 kategoriach

#### C. Test Tworzenia Projektu

1. Przejdź do **Dashboard → Projekty**
2. Kliknij **Nowy Projekt**
3. Wypełnij formularz:
   - Nazwa: "Test Mieszkanie"
   - Typ: "Mieszkanie / Dom"
   - Region: "Mazowieckie"
   - VAT: 8%
4. Kliknij **Utwórz**
5. Projekt powinien się pojawić na liście

#### D. Test Dodawania Pozycji

1. Otwórz utworzony projekt
2. Kliknij **Dodaj Pozycję**
3. Wybierz pozycję z katalogu (np. "Przewód YDYp 3x1.5")
4. Ustaw ilość: 10
5. Kliknij **Dodaj**
6. Pozycja powinna pojawić się w tabeli

---

## 🐛 Rozwiązywanie Problemów

### Problem 1: "relation does not exist"

**Przyczyna:** Tabele nie zostały utworzone.

**Rozwiązanie:**
1. Uruchom `FULL_SETUP.sql` ponownie
2. Sprawdź, czy nie było błędów w konsoli SQL Editor

### Problem 2: "permission denied for table"

**Przyczyna:** Brak polityk RLS lub nieprawidłowa konfiguracja.

**Rozwiązanie:**
1. Uruchom `HARD_RESET.sql`
2. Następnie `FULL_SETUP.sql`
3. Sprawdź, czy wszystkie polityki RLS zostały utworzone:

```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

### Problem 3: "No catalog items visible"

**Przyczyna:** Polityka RLS dla `catalog_items` blokuje dostęp.

**Rozwiązanie:**

Sprawdź politykę:

```sql
SELECT * FROM catalog_items WHERE user_id IS NULL LIMIT 5;
```

Jeśli zwraca 0 wierszy, uruchom:

```sql
DROP POLICY IF EXISTS "Users can view global and own catalog items" ON catalog_items;

CREATE POLICY "Users can view global and own catalog items" 
ON catalog_items FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);
```

### Problem 4: "Profile not created on signup"

**Przyczyna:** Trigger `on_auth_user_created` nie działa.

**Rozwiązanie:**

Sprawdź trigger:

```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Jeśli nie istnieje, uruchom:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Problem 5: "Too many items in catalog"

**Przyczyna:** Duplikaty pozycji.

**Rozwiązanie:**

Usuń duplikaty:

```sql
-- Usuń duplikaty (zachowaj najstarszy rekord)
DELETE FROM catalog_items a
USING catalog_items b
WHERE a.id > b.id
  AND a.user_id IS NULL
  AND b.user_id IS NULL
  AND a.name = b.name;

-- Sprawdź liczbę pozycji
SELECT COUNT(*) FROM catalog_items WHERE user_id IS NULL;
```

---

## 📊 Statystyki Bazy Danych

Po prawidłowej instalacji powinieneś mieć:

| Tabela | Liczba Wierszy | Opis |
|--------|----------------|------|
| `regions` | 16 | Województwa Polski |
| `object_types` | 3 | Typy obiektów (Mieszkanie, Biuro, Przemysł) |
| `catalog_categories` | 15 | Kategorie materiałów elektrycznych |
| `catalog_items` | ~100 | Globalny katalog pozycji |
| `kits` | 3 | Przykładowe zestawy robót |
| `kit_items` | ~12 | Pozycje w zestawach |
| `profiles` | 0+ | Profile użytkowników (rośnie po rejestracji) |
| `projects` | 0+ | Projekty (tworzone przez użytkowników) |
| `project_items` | 0+ | Pozycje w projektach |
| `user_assemblies` | 0+ | Własne zestawy użytkowników |
| `feedback` | 0+ | Zgłoszenia użytkowników |
| `payments` | 0+ | Historia płatności |

---

## 🔐 Bezpieczeństwo (RLS)

Wszystkie tabele mają włączone **Row Level Security (RLS)**:

- ✅ Użytkownicy widzą **tylko swoje** projekty
- ✅ Użytkownicy widzą **tylko swoje** pozycje katalogowe
- ✅ Użytkownicy widzą **globalny katalog** (user_id = NULL)
- ✅ Użytkownicy **nie mogą** edytować cudzych danych
- ✅ Regiony i typy obiektów są **publiczne** (tylko odczyt)

---

## 🎯 Co Dalej?

Po pomyślnej instalacji bazy danych:

1. ✅ Skonfiguruj zmienne środowiskowe (`.env.local`)
2. ✅ Uruchom aplikację: `npm run dev`
3. ✅ Zarejestruj się i przetestuj funkcjonalność
4. ✅ Skonfiguruj Stripe dla płatności (opcjonalnie)
5. ✅ Deploy na Vercel (produkcja)

---

## 📞 Wsparcie

Jeśli napotkasz problemy:

1. Sprawdź [Rozwiązywanie Problemów](#rozwiązywanie-problemów)
2. Sprawdź logi w **Supabase → Logs**
3. Sprawdź logi w konsoli przeglądarki (F12)
4. Uruchom `HARD_RESET.sql` + `FULL_SETUP.sql` ponownie

---

## 📝 Changelog

### v2.0 (2026-01-19)
- ✅ Kompletna restrukturyzacja skryptów
- ✅ Dodano `HARD_RESET.sql` (pełne czyszczenie)
- ✅ Dodano `FULL_SETUP.sql` (kompletna instalacja)
- ✅ Poprawiono polityki RLS dla `catalog_items`
- ✅ Dodano 15 kategorii (+ PPOŻ, Monitoring)
- ✅ Dodano ~100 pozycji katalogu
- ✅ Dodano 3 przykładowe zestawy (kits)
- ✅ Dodano wszystkie triggery i funkcje
- ✅ Dodano dokumentację w języku polskim

### v1.3 (2026-01-17)
- Dodano `project_categories` i `assembly_categories`
- Dodano pola klienta w projektach
- Poprawiono typy regionów (UUID → TEXT)

---

## ✨ Funkcje Bazy Danych

### 🔧 Funkcje Pomocnicze

1. **`handle_new_user()`** - Automatycznie tworzy profil po rejestracji
2. **`handle_updated_at()`** - Automatycznie aktualizuje `updated_at`
3. **`user_is_pro()`** - Sprawdza, czy użytkownik ma PRO

### 🔒 Polityki RLS

- **Profiles:** Użytkownik widzi tylko swój profil
- **Projects:** Użytkownik widzi tylko swoje projekty
- **Catalog Items:** Użytkownik widzi globalny katalog + swoje pozycje
- **Regions/Object Types:** Publiczne (tylko odczyt)
- **Feedback:** Każdy może dodać, użytkownik widzi swoje
- **Payments:** Użytkownik widzi swoje płatności

### 🎨 Triggery

- **on_auth_user_created** → Tworzy profil po rejestracji
- **handle_profiles_updated_at** → Aktualizuje `updated_at` w `profiles`
- **handle_projects_updated_at** → Aktualizuje `updated_at` w `projects`
- **handle_catalog_items_updated_at** → Aktualizuje `updated_at` w `catalog_items`
- **handle_kits_updated_at** → Aktualizuje `updated_at` w `kits`

---

**Powodzenia! 🚀**

Jeśli wszystko działa poprawnie, możesz przejść do konfiguracji Stripe i deployment na Vercel.
