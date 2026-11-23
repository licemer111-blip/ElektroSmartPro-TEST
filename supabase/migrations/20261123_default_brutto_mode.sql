-- New estimates start with gross prices. Existing rows keep their saved choice.
ALTER TABLE public.projects
  ALTER COLUMN brutto_mode SET DEFAULT true;
