-- Dodaj UNIQUE constraint wymagany przez upsert ON CONFLICT w uploadKnrNormsJson
-- (catalog_code, table_number, column_number) jednoznacznie identyfikuje normę KNR

ALTER TABLE knr_norms
  ADD CONSTRAINT knr_norms_catalog_table_col_unique
  UNIQUE (catalog_code, table_number, column_number);
