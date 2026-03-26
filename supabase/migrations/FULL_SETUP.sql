-- ============================================================================
-- 🚀 FULL SETUP - Полная настройка базы данных ElektroSmart PRO
-- ============================================================================
-- Этот скрипт создаёт всю структуру базы данных с нуля:
-- 1. Все таблицы (profiles, projects, catalog, assemblies, etc.)
-- 2. RLS политики (безопасность)
-- 3. Триггеры (auto-create profile, updated_at)
-- 4. Дефолтные данные (regions, object_types)
-- 5. Каталог электрических работ (~100 позиций, 13 категорий)
-- ============================================================================

-- ============================================================================
-- ЧАСТЬ 1: СОЗДАНИЕ ТАБЛИЦ
-- ============================================================================

-- 1.1 Profiles (профили пользователей)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  nip TEXT,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Regions (województwa Polski)
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  coefficient NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Object Types (typy obiektów: mieszkanie, biuro, hala)
CREATE TABLE IF NOT EXISTS public.object_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_vat_rate INTEGER NOT NULL DEFAULT 23,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Projects (projekty kosztorysowe)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  client_nip TEXT,
  client_address TEXT,
  client_phone TEXT,
  client_email TEXT,
  location TEXT,
  region_id UUID REFERENCES public.regions(id),
  object_type_id UUID REFERENCES public.object_types(id),
  vat_rate INTEGER DEFAULT 23,
  adjustment_percentage NUMERIC DEFAULT 0,
  category_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Project Categories (kategorie projektów)
CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT project_categories_user_name_unique UNIQUE (user_id, name)
);

-- 1.6 Catalog Categories (kategorie katalogu)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type_id UUID NOT NULL REFERENCES public.object_types(id),
  name TEXT NOT NULL,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Catalog Items (pozycje katalogu - GLOBALNE gdy user_id IS NULL)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  base_labor_price NUMERIC NOT NULL DEFAULT 0,
  base_material_price NUMERIC NOT NULL DEFAULT 0,
  is_assembly_parent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 Project Items (pozycje w projekcie)
CREATE TABLE IF NOT EXISTS public.project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  labor_price NUMERIC NOT NULL DEFAULT 0,
  material_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 User Assemblies (zestawy użytkownika)
CREATE TABLE IF NOT EXISTS public.user_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 User Assembly Items (pozycje w zestawach)
CREATE TABLE IF NOT EXISTS public.user_assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.user_assemblies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('material', 'labor')),
  price NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- 1.11 Assembly Categories (kategorie zestawów)
CREATE TABLE IF NOT EXISTS public.assembly_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT assembly_categories_user_name_unique UNIQUE (user_id, name)
);

-- 1.12 Feedback (opinie użytkowników)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.13 Payments (płatności Stripe)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'pln',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CZĘŚĆ 2: WŁĄCZENIE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assembly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CZĘŚĆ 3: POLITYKI RLS (kto co może widzieć/edytować)
-- ============================================================================

-- 3.1 Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3.2 Projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- 3.3 Project Items
DROP POLICY IF EXISTS "Users can view own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can insert own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can update own project items" ON public.project_items;
DROP POLICY IF EXISTS "Users can delete own project items" ON public.project_items;

CREATE POLICY "Users can view own project items" ON public.project_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_items.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own project items" ON public.project_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_items.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own project items" ON public.project_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_items.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project items" ON public.project_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_items.project_id AND projects.user_id = auth.uid()));

-- 3.4 Catalog Items - KRYTYCZNA POLITYKA! Pozwala widzieć globalne (user_id IS NULL) i własne
DROP POLICY IF EXISTS "Users can view their own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can view global and own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can insert their own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can update their own catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Users can delete their own catalog items" ON public.catalog_items;

CREATE POLICY "Users can view global and own catalog items"
  ON public.catalog_items FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own catalog items"
  ON public.catalog_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalog items"
  ON public.catalog_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalog items"
  ON public.catalog_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3.5 Catalog Categories - wszyscy mogą widzieć
DROP POLICY IF EXISTS "Anyone can view catalog categories" ON public.catalog_categories;
CREATE POLICY "Anyone can view catalog categories" ON public.catalog_categories FOR SELECT USING (true);

-- 3.6 User Assemblies
DROP POLICY IF EXISTS "Users can view own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can insert own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can update own assemblies" ON public.user_assemblies;
DROP POLICY IF EXISTS "Users can delete own assemblies" ON public.user_assemblies;

CREATE POLICY "Users can view own assemblies" ON public.user_assemblies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assemblies" ON public.user_assemblies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assemblies" ON public.user_assemblies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assemblies" ON public.user_assemblies FOR DELETE USING (auth.uid() = user_id);

-- 3.7 User Assembly Items
DROP POLICY IF EXISTS "Users can view own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can insert own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can update own assembly items" ON public.user_assembly_items;
DROP POLICY IF EXISTS "Users can delete own assembly items" ON public.user_assembly_items;

CREATE POLICY "Users can view own assembly items" ON public.user_assembly_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_assemblies WHERE user_assemblies.id = user_assembly_items.assembly_id AND user_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can insert own assembly items" ON public.user_assembly_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_assemblies WHERE user_assemblies.id = user_assembly_items.assembly_id AND user_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can update own assembly items" ON public.user_assembly_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_assemblies WHERE user_assemblies.id = user_assembly_items.assembly_id AND user_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can delete own assembly items" ON public.user_assembly_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_assemblies WHERE user_assemblies.id = user_assembly_items.assembly_id AND user_assemblies.user_id = auth.uid()));

-- 3.8 Assembly Categories
DROP POLICY IF EXISTS "Users can view their own assembly categories" ON public.assembly_categories;
DROP POLICY IF EXISTS "Users can insert their own assembly categories" ON public.assembly_categories;
DROP POLICY IF EXISTS "Users can update their own assembly categories" ON public.assembly_categories;
DROP POLICY IF EXISTS "Users can delete their own assembly categories" ON public.assembly_categories;

CREATE POLICY "Users can view their own assembly categories" ON public.assembly_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assembly categories" ON public.assembly_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assembly categories" ON public.assembly_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assembly categories" ON public.assembly_categories FOR DELETE USING (auth.uid() = user_id);

-- 3.9 Project Categories
DROP POLICY IF EXISTS "Users can view their own project categories" ON public.project_categories;
DROP POLICY IF EXISTS "Users can insert their own project categories" ON public.project_categories;
DROP POLICY IF EXISTS "Users can update their own project categories" ON public.project_categories;
DROP POLICY IF EXISTS "Users can delete their own project categories" ON public.project_categories;

CREATE POLICY "Users can view their own project categories" ON public.project_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own project categories" ON public.project_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own project categories" ON public.project_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own project categories" ON public.project_categories FOR DELETE USING (auth.uid() = user_id);

-- 3.10 Feedback
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;

CREATE POLICY "Users can insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- 3.11 Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- CZĘŚĆ 4: TRIGGERY (automatyczne akcje)
-- ============================================================================

-- 4.1 Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.user_assemblies;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_assemblies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- CZĘŚĆ 5: DEFA ULTNE DANE (regions, object_types)
-- ============================================================================

-- 5.1 Regions (16 województw Polski z współczynnikami)
INSERT INTO public.regions (name, coefficient) VALUES
  ('Dolnośląskie', 1.0),
  ('Kujawsko-Pomorskie', 0.95),
  ('Lubelskie', 0.90),
  ('Lubuskie', 0.92),
  ('Łódzkie', 0.93),
  ('Małopolskie', 1.05),
  ('Mazowieckie', 1.10),
  ('Opolskie', 0.91),
  ('Podkarpackie', 0.88),
  ('Podlaskie', 0.89),
  ('Pomorskie', 1.02),
  ('Śląskie', 1.03),
  ('Świętokrzyskie', 0.87),
  ('Warmińsko-Mazurskie', 0.90),
  ('Wielkopolskie', 0.98),
  ('Zachodniopomorskie', 0.96)
ON CONFLICT (name) DO NOTHING;

-- 5.2 Object Types (typy obiektów z VAT)
INSERT INTO public.object_types (name, default_vat_rate) VALUES
  ('Mieszkanie / Dom (VAT 8/23%)', 8),
  ('Biuro / Lokale (VAT 23%)', 23),
  ('Przemysł / Hala (VAT 23%)', 23)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CZĘŚĆ 6: KATALOG ELEKTRYCZNY (~100 pozycji, 13 kategorii)
-- ============================================================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_demontaze UUID;
  cat_ziemne UUID;
  cat_uziemienie UUID;
  cat_trasy UUID;
  cat_okablowanie UUID;
  cat_przygotowanie UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
  cat_awaryjne UUID;
  cat_teletechnika UUID;
  cat_security UUID;
  cat_biuro UUID;
  cat_pomiary UUID;
BEGIN
  -- Pobierz pierwszy object_type
  SELECT id INTO default_object_type_id 
  FROM object_types 
  LIMIT 1;

  -- Utwórz kategorie
  INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES
    (default_object_type_id, 'Demontaże', 'trash-2', 1),
    (default_object_type_id, 'Prace Ziemne', 'shovel', 2),
    (default_object_type_id, 'Uziemienie/Odgrom', 'zap', 3),
    (default_object_type_id, 'Trasy Kablowe', 'cable', 4),
    (default_object_type_id, 'Okablowanie', 'cable', 5),
    (default_object_type_id, 'Przygotowanie', 'hammer', 6),
    (default_object_type_id, 'Rozdzielnice', 'box', 7),
    (default_object_type_id, 'Oświetlenie', 'lightbulb', 8),
    (default_object_type_id, 'Awaryjne', 'alert-triangle', 9),
    (default_object_type_id, 'Teletechnika', 'wifi', 10),
    (default_object_type_id, 'Security', 'shield', 11),
    (default_object_type_id, 'Biuro', 'briefcase', 12),
    (default_object_type_id, 'Pomiary', 'activity', 13)
  ON CONFLICT DO NOTHING;

  -- Pobierz ID kategorii
  SELECT id INTO cat_demontaze FROM catalog_categories WHERE name = 'Demontaże' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_ziemne FROM catalog_categories WHERE name = 'Prace Ziemne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_uziemienie FROM catalog_categories WHERE name = 'Uziemienie/Odgrom' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_awaryjne FROM catalog_categories WHERE name = 'Awaryjne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_teletechnika FROM catalog_categories WHERE name = 'Teletechnika' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_biuro FROM catalog_categories WHERE name = 'Biuro' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_pomiary FROM catalog_categories WHERE name = 'Pomiary' AND object_type_id = default_object_type_id;

  -- UWAGA: user_id NIE jest podawane = będzie NULL = GLOBALNY KATALOG (widoczny dla wszystkich)

  -- GRUPA 1: DEMONTAŻE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_demontaze, 'Demontaż starej instalacji n/t (przewody)', 'Demontaż instalacji natynkowej', 'm', 5.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż starej instalacji p/t (kucie bruzd)', 'Demontaż instalacji podtynkowej z kuciem', 'm', 15.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż osprzętu (gniazda/włączniki)', 'Demontaż gniazdek i włączników', 'szt', 8.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż lamp i opraw oświetleniowych', 'Demontaż lamp', 'szt', 15.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż starej rozdzielnicy/licznika', 'Demontaż rozdzielnicy', 'szt', 150.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż koryt i drabin kablowych', 'Demontaż tras kablowych', 'm', 20.00, 0.00, false, true),
    (cat_demontaze, 'Wykucie starych puszek ze ściany', 'Wykucie puszek podtynkowych', 'szt', 10.00, 0.00, false, true),
    (cat_demontaze, 'Utylizacja gruzu i elektrośmieci (kontener)', 'Wywóz gruzu i odpadów', 'kpl', 800.00, 0.00, false, true);

  -- GRUPA 2: PRACE ZIEMNE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_ziemne, 'Wykop ręczny rowu kablowego 0.8m (grunt kat. III)', 'Wykop ręczny pod kabel', 'm', 90.00, 0.00, false, true),
    (cat_ziemne, 'Wykop mechaniczny (minikoparka)', 'Wykop mechaniczny', 'h', 160.00, 0.00, false, true),
    (cat_ziemne, 'Podsypka piaskowa pod kabel (10cm)', 'Podsypka piaskowa', 'm', 12.00, 15.00, false, true),
    (cat_ziemne, 'Układanie folii ostrzegawczej (niebieska/czerwona)', 'Folia ostrzegawcza', 'm', 5.00, 3.00, false, true),
    (cat_ziemne, 'Układanie rury osłonowej AROt fi 75/110', 'Rura osłonowa', 'm', 25.00, 18.00, false, true),
    (cat_ziemne, 'Układanie kabla YKY 5x16 mm2', 'Kabel zasilający YKY 5x16', 'm', 25.00, 55.00, false, true),
    (cat_ziemne, 'Układanie kabla YKY 4x120 mm2 (sektor)', 'Kabel sektorowy YKY 4x120', 'm', 60.00, 220.00, false, true),
    (cat_ziemne, 'Montaż studni kablowej SK-1', 'Studnia kablowa', 'szt', 450.00, 1200.00, false, true),
    (cat_ziemne, 'Przewiert sterowany pod drogą (do fi 110)', 'Przewiert HDD', 'm', 180.00, 0.00, false, true);

  -- GRUPA 3: UZIEMIENIE/ODGROM
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_uziemienie, 'Układanie bednarki ocynkowanej 30x4 (w wykopie)', 'Bednarka uziemiająca', 'm', 25.00, 18.00, false, true),
    (cat_uziemienie, 'Montaż uziomu szpilkowego (pogrążanie wibromłotem) 3m', 'Uziom szpilkowy 3m', 'kpl', 180.00, 140.00, false, true),
    (cat_uziemienie, 'Spawanie połączeń bednarki + izolacja bitumiczna', 'Spawanie bednarki', 'szt', 45.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż złącza kontrolnego w elewacji/studzience', 'Złącze kontrolne', 'szt', 85.00, 120.00, false, true),
    (cat_uziemienie, 'Montaż uchwytów dachowych (gąsiory/dachówka)', 'Uchwyty dachowe', 'szt', 35.00, 25.00, false, true),
    (cat_uziemienie, 'Montaż zwodów poziomych (drut Al/FeZn) na dachu', 'Zwody poziome', 'm', 30.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż zwodów pionowych (odprowadzenie po elewacji)', 'Zwody pionowe', 'm', 35.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż masztu odgromowego (wolnostojący/iglica)', 'Maszt odgromowy', 'szt', 250.00, 400.00, false, true),
    (cat_uziemienie, 'Naciąg drutu odgromowego (prostowanie)', 'Naciąg drutu', 'm', 10.00, 0.00, false, true);

  -- GRUPA 4: TRASY KABLOWE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_trasy, 'Montaż korytka siatkowego (BAKS) do 200mm', 'Korytko siatkowe BAKS', 'm', 40.00, 45.00, false, true),
    (cat_trasy, 'Montaż korytka pełnego metalowego do 400mm', 'Korytko metalowe', 'm', 65.00, 95.00, false, true),
    (cat_trasy, 'Montaż drabiny kablowej (szachty pionowe)', 'Drabina kablowa', 'm', 85.00, 120.00, false, true),
    (cat_trasy, 'Montaż rurek PVC natynkowo (uchwyty)', 'Rurka PVC natynkowa', 'm', 22.00, 8.00, false, true),
    (cat_trasy, 'Montaż rur stalowych (instalacje industrialne)', 'Rura stalowa', 'm', 55.00, 45.00, false, true),
    (cat_trasy, 'Wykonanie przepustu pożarowego HILTI (EI120)', 'Przepust pożarowy', 'szt', 250.00, 200.00, false, true);

  -- GRUPA 5: OKABLOWANIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_okablowanie, 'Przewód YDYp 3x1.5 (oświetlenie)', 'Przewód oświetleniowy', 'm', 7.50, 3.80, false, true),
    (cat_okablowanie, 'Przewód YDYp 3x2.5 (gniazda)', 'Przewód gniazdowy', 'm', 8.00, 5.20, false, true),
    (cat_okablowanie, 'Przewód YDYp 5x4 / 5x6 (kuchnia/siła)', 'Przewód siłowy', 'm', 12.00, 18.00, false, true),
    (cat_okablowanie, 'Przewód NHXH (ognioodporny E90) 3x1.5', 'Przewód ognioodporny', 'm', 14.00, 9.50, false, true),
    (cat_okablowanie, 'Przewód sterowniczy LiYCY (ekranowany)', 'Przewód sterowniczy', 'm', 9.00, 6.50, false, true),
    (cat_okablowanie, 'Szynoprzewód oświetleniowy (sklepy/hale)', 'Szynoprzewód oświetleniowy', 'm', 55.00, 140.00, false, true),
    (cat_okablowanie, 'Szynoprzewód zasilający (Power Busbar) 100A+', 'Szynoprzewód zasilający', 'm', 120.00, 450.00, false, true);

  -- GRUPA 6: PRZYGOTOWANIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_przygotowanie, 'Bruzdowanie w żelbecie (wielka płyta)', 'Bruzdowanie w betonie', 'm', 70.00, 0.00, false, true),
    (cat_przygotowanie, 'Wiercenie koroną diamentową (na mokro) w betonie', 'Wiercenie koroną', 'szt', 120.00, 0.00, false, true),
    (cat_przygotowanie, 'Osadzenie puszki w płytkach (łazienka/kuchnia)', 'Puszka w płytkach', 'szt', 45.00, 0.00, false, true),
    (cat_przygotowanie, 'Osadzenie puszki podłogowej (wylewka)', 'Puszka podłogowa', 'szt', 80.00, 0.00, false, true),
    (cat_przygotowanie, 'Montaż puszki hermetycznej natynkowej IP55', 'Puszka hermetyczna', 'szt', 35.00, 25.00, false, true);

  -- GRUPA 7: ROZDZIELNICE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_rozdzielnice, 'Montaż obudowy podtynkowej 4x12 (48 mod)', 'Rozdzielnica podtynkowa 48M', 'szt', 350.00, 250.00, false, true),
    (cat_rozdzielnice, 'Montaż szafy wolnostojącej (Hala/Przemysł)', 'Szafa przemysłowa', 'szt', 1200.00, 3500.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Moduł 1-faz (S-ka)', 'Wyłącznik 1-fazowy', 'szt', 35.00, 25.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Różnicówka (RCD) 3-faz', 'Wyłącznik różnicowo-prądowy', 'szt', 90.00, 190.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Ogranicznik przepięć (SPD)', 'Ogranicznik przepięć', 'szt', 100.00, 450.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Stycznik / Przekaźnik', 'Stycznik modułowy', 'szt', 50.00, 80.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Zasilacz buforowy + AKU', 'Zasilacz buforowy', 'kpl', 150.00, 350.00, false, true),
    (cat_rozdzielnice, 'Montaż licznika energii (podlicznik)', 'Licznik energii', 'szt', 85.00, 250.00, false, true);

  -- GRUPA 8: OŚWIETLENIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_oswietlenie, 'Montaż profilu LED wpuszczanego (frezowanie)', 'Profil LED wpuszczany', 'm', 65.00, 55.00, false, true),
    (cat_oswietlenie, 'Wklejenie taśmy LED + klosz + lutowanie', 'Taśma LED z montażem', 'm', 45.00, 35.00, false, true),
    (cat_oswietlenie, 'Montaż zasilacza LED (w szafce/suficie)', 'Zasilacz LED', 'szt', 50.00, 90.00, false, true),
    (cat_oswietlenie, 'Montaż lampy High Bay (Hala - wysokość > 4m)', 'Lampa High Bay', 'szt', 180.00, 600.00, false, true),
    (cat_oswietlenie, 'Montaż panelu LED 60x60 (sufit kasetonowy)', 'Panel LED 60x60', 'szt', 65.00, 120.00, false, true),
    (cat_oswietlenie, 'Montaż oprawy DALI (sterowalna)', 'Oprawa DALI', 'szt', 95.00, 0.00, false, true),
    (cat_oswietlenie, 'Montaż żyrandola ozdobnego (duży gabaryt)', 'Żyrandol ozdobny', 'szt', 300.00, 0.00, false, true);

  -- GRUPA 9: AWARYJNE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_awaryjne, 'Montaż oprawy ewakuacyjnej "Wyjście" (sufit/ściana)', 'Oprawa ewakuacyjna', 'szt', 95.00, 280.00, false, true),
    (cat_awaryjne, 'Montaż modułu awaryjnego w lampie (przeróbka)', 'Moduł awaryjny', 'szt', 140.00, 180.00, false, true),
    (cat_awaryjne, 'Pomiary natężenia oświetlenia ewakuacyjnego', 'Pomiary oświetlenia', 'szt', 35.00, 0.00, false, true);

  -- GRUPA 10: TELETECHNIKA
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_teletechnika, 'Układanie skrętki UTP/FTP Cat.6A / Cat.7', 'Kabel UTP/FTP', 'm', 8.00, 5.50, false, true),
    (cat_teletechnika, 'Montaż gniazda RJ45 (Keystone)', 'Gniazdo RJ45', 'szt', 45.00, 40.00, false, true),
    (cat_teletechnika, 'Montaż Access Pointa WiFi (sufit + konfiguracja)', 'Access Point WiFi', 'szt', 150.00, 800.00, false, true),
    (cat_teletechnika, 'Montaż szafy RACK 42U (stojąca)', 'Szafa RACK 42U', 'szt', 900.00, 2800.00, false, true),
    (cat_teletechnika, 'Zarobienie Patch Panelu 24-port (krosowanie)', 'Patch Panel 24p', 'szt', 60.00, 200.00, false, true),
    (cat_teletechnika, 'Certyfikacja sieci LAN (Pomiary dynamiczne/Fluke)', 'Certyfikacja LAN', 'szt', 35.00, 0.00, false, true),
    (cat_teletechnika, 'Spawanie światłowodu (za włókno)', 'Spawanie światłowodu', 'szt', 70.00, 0.00, false, true),
    (cat_teletechnika, 'Montaż przełącznicy światłowodowej ODF', 'Przełącznica ODF', 'szt', 180.00, 250.00, false, true);

  -- GRUPA 11: SECURITY
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_security, 'Montaż kamery IP (kopułka/tuba)', 'Kamera IP', 'szt', 160.00, 700.00, false, true),
    (cat_security, 'Montaż kamery obrotowej PTZ', 'Kamera PTZ', 'szt', 350.00, 2500.00, false, true),
    (cat_security, 'Montaż rejestratora NVR + dyski', 'Rejestrator NVR', 'kpl', 250.00, 1500.00, false, true),
    (cat_security, 'Montaż czujki dymu SAP (system pożarowy)', 'Czujka dymu', 'szt', 85.00, 220.00, false, true),
    (cat_security, 'Montaż ROP (Ręczny Ostrzegacz Pożarowy)', 'ROP', 'szt', 90.00, 280.00, false, true),
    (cat_security, 'Montaż klawiatury alarmowej LCD', 'Klawiatura alarmowa', 'szt', 140.00, 550.00, false, true),
    (cat_security, 'Montaż czujki ruchu PIR/MW (Alarm)', 'Czujka ruchu', 'szt', 75.00, 120.00, false, true),
    (cat_security, 'Montaż czytnika kart (Kontrola Dostępu)', 'Czytnik kart', 'szt', 130.00, 400.00, false, true),
    (cat_security, 'Montaż zwory elektromagnetycznej 300kg', 'Zwora elektromagnetyczna', 'szt', 200.00, 350.00, false, true);

  -- GRUPA 12: BIURO
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_biuro, 'Montaż Floorboxa (puszka podłogowa) komplet', 'Floorbox', 'szt', 200.00, 450.00, false, true),
    (cat_biuro, 'Uzbrojenie Floorboxa (2x230V + 2xRJ45)', 'Uzbrojenie Floorboxa', 'kpl', 60.00, 120.00, false, true),
    (cat_biuro, 'Podłączenie klimatyzatora / Fankoila', 'Podłączenie klimatyzacji', 'szt', 150.00, 0.00, false, true),
    (cat_biuro, 'Montaż kolumny zasilającej aluminiowej', 'Kolumna zasilająca', 'szt', 250.00, 900.00, false, true);

  -- GRUPA 13: POMIARY
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_pomiary, 'Pomiar rezystancji izolacji (obwód 1-faz)', 'Pomiar izolacji 1-faz', 'szt', 18.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar rezystancji izolacji (obwód 3-faz)', 'Pomiar izolacji 3-faz', 'szt', 28.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar impedancji pętli zwarcia', 'Pomiar pętli zwarcia', 'szt', 18.00, 0.00, false, true),
    (cat_pomiary, 'Badanie wyłączników RCD (czas/prąd)', 'Badanie RCD', 'szt', 28.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar natężenia oświetlenia (stanowisko pracy)', 'Pomiar oświetlenia', 'szt', 25.00, 0.00, false, true),
    (cat_pomiary, 'Pomiary LAN (mapa połączeń)', 'Pomiary LAN', 'szt', 15.00, 0.00, false, true),
    (cat_pomiary, 'Dokumentacja powykonawcza (schematy, protokoły)', 'Dokumentacja', 'kpl', 600.00, 0.00, false, true);

END $$;

-- ============================================================================
-- ✅ FULL SETUP ЗАВЕРШЁН!
-- ============================================================================
-- Baza danych gotowa do użycia:
-- - 13 tabel utworzonych
-- - RLS włączony i skonfigurowany
-- - Triggery działają (auto-create profile, updated_at)
-- - 16 województw + 3 typy obiektów
-- - ~100 pozycji w katalogu (13 kategorii)
--
-- NASTĘPNE KROKI:
-- 1. Zaloguj się do aplikacji (profil utworzy się automatycznie)
-- 2. Sprawdź stronę Katalog (powinny być widoczne wszystkie pozycje)
-- 3. Utwórz projekt testowy
-- 4. Dodaj pozycje z katalogu do projektu
-- 5. Przetestuj zestawy (assemblies)
--
-- Jeśli coś nie działa - sprawdź logi w konsoli przeglądarki (F12)
-- ============================================================================
