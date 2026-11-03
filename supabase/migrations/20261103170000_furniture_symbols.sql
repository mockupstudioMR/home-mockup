-- Every piece gets its top-view symbol: public/furniture-symbols/<symbol>.svg in the app, drawn with the back of the
-- piece at the top. The plan draws each piece with its symbol, turned the way it faces, instead of drawing it afresh.
-- A row without a symbol gets one from its name in the app (layoutRules.symbolForName), else "generic".
ALTER TABLE public.furniture_specs ADD COLUMN IF NOT EXISTS symbol text
  CHECK (symbol IS NULL OR symbol ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

UPDATE public.furniture_specs f SET symbol = v.symbol
FROM (VALUES
 ('3-seat sofa', 'standard', 'sofa-3'),
 ('curved sofa', '3-seat', 'sofa-curved'),
 ('l-shape sofa', 'standard', 'sofa-l'),
 ('accent chair', 'standard', 'armchair'),
 ('dining chair', 'standard', 'dining-chair'),
 ('desk chair', 'standard', 'desk-chair'),
 ('bench', 'standard', 'bench'),
 ('piano bench', 'standard', 'piano-bench'),
 ('coffee table', 'standard', 'coffee-table'),
 ('side table', 'standard', 'side-table'),
 ('dining table', '4-seat', 'dining-table'),
 ('dining table', '6-seat', 'dining-table'),
 ('desk', 'standard', 'desk'),
 ('bed', 'double', 'bed-double'),
 ('bed', 'king', 'bed-king'),
 ('bed', 'single', 'bed-single'),
 ('nightstand', 'standard', 'nightstand'),
 ('wardrobe', 'standard', 'wardrobe'),
 ('dresser', 'standard', 'dresser'),
 ('tv unit', 'standard', 'tv-unit'),
 ('bookshelf', 'standard', 'bookshelf'),
 ('sideboard', 'standard', 'sideboard'),
 ('console', 'slim', 'console'),
 ('upright piano', 'standard', 'piano-upright'),
 ('rug', 'large', 'rug'),
 ('rug', 'medium', 'rug'),
 ('floor lamp', 'standard', 'floor-lamp'),
 ('curved sofa', '2-seat', 'sofa-curved'),
 ('curved sofa', '4-seat', 'sofa-curved'),
 ('upright piano', 'compact', 'piano-upright'),
 ('upright piano', 'tall', 'piano-upright'),
 ('digital piano', 'standard', 'piano-digital'),
 ('baby grand piano', 'standard', 'piano-grand'),
 ('round mirror', 'standard', 'mirror-round'),
 ('cushion', 'standard', 'cushion')
) AS v(name, variant, symbol)
WHERE f.name = v.name AND f.variant = v.variant AND f.symbol IS NULL;
