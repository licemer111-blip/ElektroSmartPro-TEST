# Bucket „project-documents” (Błąd: Bucket not found)

Jeśli przy dodawaniu pliku w **Materiały → Dokumentacja projektu** pojawia się błąd **Bucket not found** lub **The resource was not found**, bucket `project-documents` nie istnieje w Storage.

## Sposób 1: SQL w Dashboard (najszybszy)

1. Otwórz **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Wklej i uruchom poniższy SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  26214400,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

3. Kliknij **Run**. Potem spróbuj ponownie dodać plik w aplikacji.

Polityki RLS (funkcja + polityki na `storage.objects`) muszą być z migracji `20260201_project_documents_bucket.sql`. Jeśli migracje są włączone, uruchom je; jeśli wcześniej migracja się nie zastosowała, uruchom cały plik `20260201_project_documents_bucket.sql` w SQL Editor (bucket się nie nadpisze dzięki `ON CONFLICT DO NOTHING`).

## Sposób 2: Ręczne utworzenie bucketu w Storage

1. W Supabase Dashboard przejdź do **Storage**.
2. Kliknij **New bucket**.
3. Ustaw:
   - **Name:** `project-documents`
   - **Public:** wyłączone (private)
   - **File size limit:** 25 MB
   - **Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
4. Zapisz.

Następnie w **SQL Editor** uruchom tylko fragment migracji `20260201_project_documents_bucket.sql` od „Helper: czy użytkownik ma dostęp…” do końca (funkcja `user_has_project_storage_access` i polityki na `storage.objects`), żeby dostęp do plików działał według projektu.
