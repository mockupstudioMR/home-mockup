-- Every furniture set gets its top-view symbol: public/furniture-sets/<symbol>.svg in the app, built from the
-- piece symbols and the set's own offsets (qa/furniture-sets/build-set-symbols.ts). Empty means: the set's key.
ALTER TABLE public.furniture_groupings ADD COLUMN IF NOT EXISTS symbol text
  CHECK (symbol IS NULL OR symbol ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
UPDATE public.furniture_groupings SET symbol = key WHERE symbol IS NULL;
