-- Dodaj kolumnę synonyms (JSONB) do knr_norms
-- Przechowuje listę słów kluczowych/synonimów żargonu elektrycznego
-- Używana do wyszukiwania pełnotekstowego i fuzzy-match w ES-Engine

ALTER TABLE knr_norms
  ADD COLUMN IF NOT EXISTS synonyms JSONB DEFAULT '[]'::jsonb;

-- GIN index dla szybkiego wyszukiwania po synonimach
CREATE INDEX IF NOT EXISTS idx_knr_norms_synonyms_gin
  ON knr_norms USING GIN (synonyms);

-- Zaktualizuj search_vector aby uwzględniał synonimy
-- (jeśli tabela ma tsvector column — dodaj do niego synonimy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knr_norms' AND column_name = 'search_vector'
  ) THEN
    -- Regenerate search_vector trigger to include synonyms text
    EXECUTE '
      CREATE OR REPLACE FUNCTION knr_norms_search_vector_update()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector(''simple'', COALESCE(NEW.catalog_code, '''')), ''A'') ||
          setweight(to_tsvector(''simple'', COALESCE(NEW.full_code, '''')), ''A'') ||
          setweight(to_tsvector(''simple'', COALESCE(NEW.description, '''')), ''B'') ||
          setweight(to_tsvector(''simple'', COALESCE(NEW.section, '''')), ''C'') ||
          setweight(to_tsvector(''simple'', COALESCE(array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.synonyms, ''[]''::jsonb))),
            '' ''
          ), '''')), ''C'');
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    ';
  END IF;
END $$;
