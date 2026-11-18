-- Each piece's four sides: what its front, back, left and right are, and the free floor it needs behind and at
-- each side (min_clearance_cm stays the front). Front is the side you use: a sofa's seats, a desk's knee space, a
-- piano's keyboard, a wardrobe's doors, a coffee table's side facing the seating. Back is the other side, usually
-- on the wall. Left and right are as seen standing in front of the piece, looking at it (a piano's bass end is
-- on the left). symbol_front says which edge of the piece's symbol drawing is its front (they're drawn at the bottom).
ALTER TABLE public.furniture_specs
  ADD COLUMN IF NOT EXISTS front_label        text,
  ADD COLUMN IF NOT EXISTS back_label         text,
  ADD COLUMN IF NOT EXISTS left_label         text,
  ADD COLUMN IF NOT EXISTS right_label        text,
  ADD COLUMN IF NOT EXISTS back_clearance_cm  integer NOT NULL DEFAULT 0 CHECK (back_clearance_cm >= 0),
  ADD COLUMN IF NOT EXISTS left_clearance_cm  integer NOT NULL DEFAULT 0 CHECK (left_clearance_cm >= 0),
  ADD COLUMN IF NOT EXISTS right_clearance_cm integer NOT NULL DEFAULT 0 CHECK (right_clearance_cm >= 0),
  ADD COLUMN IF NOT EXISTS symbol_front       text NOT NULL DEFAULT 'bottom' CHECK (symbol_front IN ('bottom', 'top', 'left', 'right'));

-- Fill the sides of every piece by its name (all its sizes); rows someone already filled are left alone.
UPDATE public.furniture_specs f
SET front_label = v.front_label, back_label = v.back_label, left_label = v.left_label, right_label = v.right_label,
    back_clearance_cm = v.back_cm, left_clearance_cm = v.left_cm, right_clearance_cm = v.right_cm
FROM (VALUES
 ('3-seat sofa', 'seats', 'backrest', 'arm', 'arm', 0, 0, 0),
 ('curved sofa', 'seats', 'curved backrest', 'arm', 'arm', 0, 0, 0),
 ('l-shape sofa', 'seats', 'backrest', 'chaise end', 'arm', 0, 0, 0),
 ('accent chair', 'seat', 'backrest', 'arm', 'arm', 0, 0, 0),
 ('dining chair', 'seat', 'backrest', 'side', 'side', 30, 0, 0),
 ('desk chair', 'seat', 'backrest', 'side', 'side', 30, 0, 0),
 ('bench', 'long side', 'long side', 'end', 'end', 0, 0, 0),
 ('piano bench', 'side towards the piano', 'side you sit down from', 'end', 'end', 40, 0, 0),
 ('coffee table', 'long side towards the seating', 'long side', 'end', 'end', 40, 30, 30),
 ('side table', 'any side (round)', 'any side', 'any side', 'any side', 0, 0, 0),
 ('dining table', 'long side (seats)', 'long side (seats)', 'end (head of the table)', 'end (head of the table)', 80, 60, 60),
 ('desk', 'where you sit (knee space)', 'against the wall', 'end', 'end', 0, 0, 0),
 ('bed', 'foot end', 'headboard', 'side (getting in)', 'side (getting in)', 0, 60, 60),
 ('nightstand', 'drawer', 'against the wall', 'side', 'side', 0, 0, 0),
 ('wardrobe', 'doors', 'against the wall', 'side panel', 'side panel', 0, 0, 0),
 ('dresser', 'drawers', 'against the wall', 'side', 'side', 0, 0, 0),
 ('tv unit', 'screen side, towards the seating', 'against the wall', 'end', 'end', 0, 0, 0),
 ('bookshelf', 'shelves', 'against the wall', 'side', 'side', 0, 0, 0),
 ('sideboard', 'doors and drawers', 'against the wall', 'end', 'end', 0, 0, 0),
 ('console', 'front', 'against the wall', 'end', 'end', 0, 0, 0),
 ('upright piano', 'keyboard', 'against the wall', 'bass end', 'treble end', 0, 0, 0),
 ('digital piano', 'keyboard', 'against the wall', 'bass end', 'treble end', 0, 0, 0),
 ('baby grand piano', 'keyboard', 'curved tail', 'straight side (bass)', 'curved side (lid opens here)', 50, 30, 50),
 ('rug', 'any side', 'any side', 'any side', 'any side', 0, 0, 0),
 ('round mirror', 'mirror', 'against the wall', 'edge', 'edge', 0, 0, 0),
 ('floor lamp', 'any side (round)', 'any side', 'any side', 'any side', 0, 0, 0),
 ('cushion', 'any side', 'any side', 'any side', 'any side', 0, 0, 0)
) AS v(name, front_label, back_label, left_label, right_label, back_cm, left_cm, right_cm)
WHERE lower(f.name) = v.name AND f.front_label IS NULL;

-- A coffee table has a front now: its long side faces the seating, so it turns with the sofa.
UPDATE public.furniture_specs SET facing = 'anchor' WHERE lower(name) = 'coffee table' AND facing = 'free';
UPDATE public.furniture_grouping_members m SET faces = 'toward_wall'
FROM public.furniture_groupings g
WHERE m.grouping_id = g.id AND g.key IN ('tv-lounge', 'conversation') AND lower(m.spec_name) = 'coffee table' AND m.faces = 'none';
