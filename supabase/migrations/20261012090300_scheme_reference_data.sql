-- =====================================================================
-- Starter vocabulary + example schemes from the Eclectic Modern living room.
-- Extend the vocabulary through the admin, not by hand-writing free text.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.term(_facet public.term_facet, _slug text)
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT id FROM taxonomy_terms WHERE facet = _facet AND slug = _slug;
$$;

-- Parents first (families), then children.
INSERT INTO public.taxonomy_terms (facet, slug, label, hex, synonyms) VALUES
 ('category','seating','Seating',NULL,'{}'), ('category','tables','Tables',NULL,'{}'), ('category','storage','Storage',NULL,'{}'),
 ('category','lighting','Lighting',NULL,'{}'), ('category','decor','Decor',NULL,'{}'), ('category','instruments','Instruments',NULL,'{}'),
 ('color','purple','Purple',NULL,'{}'), ('color','green','Green',NULL,'{}'), ('color','brown','Brown',NULL,'{}'),
 ('color','metallic','Metallic',NULL,'{}'), ('color','neutral','Neutral',NULL,'{}'), ('color','orange','Orange',NULL,'{}'),
 ('material','textile','Textile',NULL,'{}'), ('material','wood','Wood',NULL,'{}'), ('material','metal','Metal',NULL,'{}'),
 ('material','stone','Stone',NULL,'{}'), ('material','natural-fibre','Natural fibre',NULL,'{}'), ('material','mineral','Mineral',NULL,'{}');

INSERT INTO public.taxonomy_terms (facet, slug, label, hex, synonyms, parent_id)
SELECT v.facet::public.term_facet, v.slug, v.label, v.hex, v.syn::text[], public.term(v.facet::public.term_facet, v.parent)
FROM (VALUES
 ('category','sofa','Sofa',NULL,'{couch,settee}','seating'),
 ('category','curved-sofa','Curved sofa',NULL,'{"crescent sofa"}','seating'),
 ('category','lounge-chair','Lounge chair',NULL,'{"accent chair",armchair,"reading chair"}','seating'),
 ('category','dining-chair','Dining chair',NULL,'{chair}','seating'),
 ('category','coffee-table','Coffee table',NULL,'{"cocktail table"}','tables'),
 ('category','side-table','Side table',NULL,'{"end table"}','tables'),
 ('category','console','Console',NULL,'{"console table",sideboard}','storage'),
 ('category','shelving','Shelving',NULL,'{bookcase,bookshelf}','storage'),
 ('category','pendant','Pendant light',NULL,'{pendant,chandelier}','lighting'),
 ('category','floor-lamp','Floor lamp',NULL,'{"standing lamp"}','lighting'),
 ('category','wall-sconce','Wall sconce',NULL,'{sconce,"wall light"}','lighting'),
 ('category','rug','Rug',NULL,'{carpet}','decor'),
 ('category','mirror','Mirror',NULL,'{}','decor'),
 ('category','cushion','Cushion',NULL,'{pillow}','decor'),
 ('category','planter','Planter',NULL,'{pot,"plant pot"}','decor'),
 ('category','piano','Piano',NULL,'{"upright piano"}','instruments'),
 ('color','plum','Plum','#6E3550','{aubergine,burgundy-purple}','purple'),
 ('color','emerald','Emerald','#2F5B4A','{"emerald green","bottle green","forest green"}','green'),
 ('color','sage','Sage','#9CAF88','{"sage green"}','green'),
 ('color','dark-walnut','Dark walnut','#5A3A26','{walnut,"dark brown"}','brown'),
 ('color','brass-gold','Brass gold','#B4975A','{brass,gold,"brushed gold"}','metallic'),
 ('color','chrome','Chrome','#C9CDD2','{silver,"polished steel"}','metallic'),
 ('color','smoke-grey','Smoke grey','#6B6862','{grey,"charcoal grey"}','neutral'),
 ('color','warm-greige','Warm greige','#CBBFAE','{greige,beige-grey}','neutral'),
 ('color','ivory','Ivory','#EFE8DC','{cream,off-white}','neutral'),
 ('color','rust','Rust','#A0522D','{terracotta,"burnt orange"}','orange'),
 ('material','velvet','Velvet',NULL,'{"crushed velvet"}','textile'),
 ('material','boucle','Bouclé',NULL,'{boucle}','textile'),
 ('material','linen','Linen',NULL,'{}','textile'),
 ('material','leather','Leather',NULL,'{}','textile'),
 ('material','walnut','Walnut',NULL,'{"walnut wood"}','wood'),
 ('material','oak','Oak',NULL,'{}','wood'),
 ('material','brass','Brass',NULL,'{}','metal'),
 ('material','chrome-steel','Chrome steel',NULL,'{chrome,steel}','metal'),
 ('material','marble','Marble',NULL,'{}','stone'),
 ('material','green-stone','Green stone',NULL,'{malachite,"verde marble"}','stone'),
 ('material','cane','Cane',NULL,'{rattan,wicker}','natural-fibre'),
 ('material','glass','Glass',NULL,'{"smoked glass"}','mineral'),
 ('material','plaster','Plaster',NULL,'{"venetian plaster"}','mineral'),
 ('material','ceramic','Ceramic',NULL,'{stoneware}','mineral')
) v(facet, slug, label, hex, syn, parent);

INSERT INTO public.taxonomy_terms (facet, slug, label, synonyms) VALUES
 ('style','eclectic-modern','Eclectic Modern','{}'), ('style','eclectic-luxe','Eclectic Luxe','{maximalist}'),
 ('style','biophilic-contemporary','Biophilic Contemporary','{biophilic}'), ('style','mid-century-modern','Mid-century Modern','{"mid century"}'),
 ('style','japandi','Japandi','{}'), ('style','scandinavian','Scandinavian','{scandi,nordic}'), ('style','industrial','Industrial','{}'),
 ('finish','brushed','Brushed','{}'), ('finish','polished','Polished','{}'), ('finish','matte','Matte','{matt}'), ('finish','smoked','Smoked','{}'),
 ('shape','curved','Curved','{rounded}'), ('shape','round','Round','{circular}'), ('shape','fluted','Fluted','{reeded}'), ('shape','arched','Arched','{}'),
 ('shape','sculptural','Sculptural','{organic}'),
 ('pattern','tufted','Tufted','{buttoned}'), ('pattern','patchwork','Patchwork','{}'), ('pattern','geometric','Geometric','{}'),
 ('mood','moody','Moody','{dark,"low light"}'), ('mood','cosy','Cosy','{cozy}'), ('mood','airy','Airy','{light,bright}'),
 ('room_type','living-room','Living room','{lounge,"sitting room"}'), ('room_type','bedroom','Bedroom','{}'),
 ('room_type','kitchen','Kitchen','{}'), ('room_type','bathroom','Bathroom','{}');

-- Example schemes (category · colour · style · material + other tags).
INSERT INTO public.furniture_schemes (category_id, color_id, style_id, material_id, label)
SELECT public.term('category', c), public.term('color', col), public.term('style', st), public.term('material', m), l
FROM (VALUES
 ('curved-sofa',  'plum',        'eclectic-modern', 'velvet',  'Plum curved velvet sofa'),
 ('lounge-chair', 'emerald',     'eclectic-modern', 'leather', 'Emerald leather & cane lounge chair'),
 ('coffee-table', 'dark-walnut', 'eclectic-modern', 'walnut',  'Walnut coffee table with green stone top'),
 ('floor-lamp',   'brass-gold',  'eclectic-modern', 'brass',   'Brushed brass floor lamp'),
 ('pendant',      'smoke-grey',  'eclectic-modern', 'glass',   'Smoked glass pendant cluster'),
 ('console',      'dark-walnut', 'eclectic-modern', 'walnut',  'Fluted walnut console'),
 ('mirror',       'brass-gold',  'eclectic-modern', 'brass',   'Round brass mirror'),
 ('lounge-chair', 'ivory',       'biophilic-contemporary', 'boucle', 'Sculptural bouclé lounge chair'),
 ('side-table',   'chrome',      'industrial',      'chrome-steel', 'Chrome side table')
) v(c, col, st, m, l);

INSERT INTO public.furniture_scheme_tags (scheme_id, term_id)
SELECT s.id, public.term(t.facet::public.term_facet, t.slug)
FROM (VALUES
 ('Plum curved velvet sofa', 'shape', 'curved'), ('Plum curved velvet sofa', 'mood', 'cosy'),
 ('Emerald leather & cane lounge chair', 'material', 'cane'),
 ('Walnut coffee table with green stone top', 'material', 'green-stone'),
 ('Brushed brass floor lamp', 'finish', 'brushed'),
 ('Smoked glass pendant cluster', 'finish', 'smoked'), ('Smoked glass pendant cluster', 'material', 'brass'),
 ('Fluted walnut console', 'shape', 'fluted'),
 ('Round brass mirror', 'shape', 'round'),
 ('Sculptural bouclé lounge chair', 'shape', 'sculptural')
) t(label, facet, slug)
JOIN public.furniture_schemes s ON s.label = t.label;

-- Example combinations.
INSERT INTO public.scheme_combinations (name, room_type_id, style_id, source) VALUES
 ('Eclectic Modern lounge', public.term('room_type','living-room'), public.term('style','eclectic-modern'), 'curated'),
 ('Sofa + walnut table',    public.term('room_type','living-room'), public.term('style','eclectic-modern'), 'observed'),
 ('Velvet sofa + bouclé chair + chrome', public.term('room_type','living-room'), NULL, 'ai_generated');

INSERT INTO public.scheme_combination_members (combination_id, scheme_id, role)
SELECT c.id, s.id, m.role
FROM (VALUES
 ('Eclectic Modern lounge', 'Plum curved velvet sofa', 'anchor'),
 ('Eclectic Modern lounge', 'Emerald leather & cane lounge chair', 'accent'),
 ('Eclectic Modern lounge', 'Walnut coffee table with green stone top', 'supporting'),
 ('Eclectic Modern lounge', 'Brushed brass floor lamp', 'lighting'),
 ('Sofa + walnut table', 'Plum curved velvet sofa', 'anchor'),
 ('Sofa + walnut table', 'Walnut coffee table with green stone top', 'supporting'),
 ('Velvet sofa + bouclé chair + chrome', 'Plum curved velvet sofa', 'anchor'),
 ('Velvet sofa + bouclé chair + chrome', 'Sculptural bouclé lounge chair', 'accent'),
 ('Velvet sofa + bouclé chair + chrome', 'Chrome side table', 'supporting')
) m(combo, scheme, role)
JOIN public.scheme_combinations c ON c.name = m.combo
JOIN public.furniture_schemes s ON s.label = m.scheme;

-- Example evidence.
INSERT INTO public.combination_signals (combination_id, signal, note)
SELECT c.id, s.signal::public.combination_signal, s.note
FROM (VALUES
 ('Eclectic Modern lounge', 'curated', 'Seed from the living-room design'),
 ('Eclectic Modern lounge', 'kept_in_design', NULL), ('Eclectic Modern lounge', 'kept_in_design', NULL),
 ('Eclectic Modern lounge', 'bought_together', NULL), ('Eclectic Modern lounge', 'expert_approved', NULL),
 ('Sofa + walnut table', 'kept_in_design', NULL), ('Sofa + walnut table', 'liked', NULL),
 ('Velvet sofa + bouclé chair + chrome', 'generated', NULL), ('Velvet sofa + bouclé chair + chrome', 'changed_in_design', NULL),
 ('Velvet sofa + bouclé chair + chrome', 'disliked', NULL), ('Velvet sofa + bouclé chair + chrome', 'expert_rejected', 'Cool chrome fights warm brass and walnut')
) s(combo, signal, note)
JOIN public.scheme_combinations c ON c.name = s.combo;

-- Cold-start rules (always stored with the smaller id first).
INSERT INTO public.compatibility_rules (term_a_id, term_b_id, verdict, strength, reason)
SELECT least(a, b), greatest(a, b), v, st, r FROM (VALUES
 (public.term('material','walnut'), public.term('material','brass'), 'works', 5, 'Warm wood with warm metal'),
 (public.term('material','velvet'), public.term('material','brass'), 'works', 4, 'Classic luxe pairing'),
 (public.term('color','plum'), public.term('color','emerald'), 'works', 4, 'Jewel-tone complements'),
 (public.term('material','brass'), public.term('material','chrome-steel'), 'avoid', 3, 'Mixing warm and cool metals reads unplanned'),
 (public.term('material','velvet'), public.term('material','boucle'), 'neutral', 2, 'Works only with a shared colour')
) x(a, b, v, st, r);

-- Style definition + its default palette.
INSERT INTO public.palettes (name, style_id) VALUES ('Eclectic Modern · jewel', public.term('style','eclectic-modern'));
INSERT INTO public.palette_colors (palette_id, position, color_id, role)
SELECT p.id, x.pos, public.term('color', x.slug), x.role
FROM public.palettes p, (VALUES (1,'plum','main'), (2,'emerald','accent'), (3,'dark-walnut','wood'), (4,'brass-gold','metal'), (5,'smoke-grey','neutral')) x(pos, slug, role)
WHERE p.name = 'Eclectic Modern · jewel';
INSERT INTO public.style_definitions (style_id, description, prompt_fragment, mood_keywords, default_palette_id)
SELECT public.term('style','eclectic-modern'),
       'Jewel tones on dark walnut with brass, layered textures, curated displays and lots of greenery.',
       'eclectic modern interior, plum and emerald velvet, dark walnut, brushed brass, textured plaster walls, abundant plants, warm low light',
       '{moody,cosy,curated}', id
FROM public.palettes WHERE name = 'Eclectic Modern · jewel';

-- Link the size database to categories.
UPDATE public.furniture_specs f SET category_term_id = public.term('category',
  CASE f.name WHEN 'curved sofa' THEN 'curved-sofa' WHEN '3-seat sofa' THEN 'sofa' WHEN 'l-shape sofa' THEN 'sofa'
              WHEN 'accent chair' THEN 'lounge-chair' WHEN 'coffee table' THEN 'coffee-table' WHEN 'side table' THEN 'side-table'
              WHEN 'console' THEN 'console' WHEN 'rug' THEN 'rug' WHEN 'round mirror' THEN 'mirror' WHEN 'floor lamp' THEN 'floor-lamp'
              WHEN 'cushion' THEN 'cushion' ELSE 'piano' END);

SELECT public.refresh_scheme_scores();
