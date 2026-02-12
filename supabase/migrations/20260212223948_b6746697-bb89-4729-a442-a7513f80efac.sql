
ALTER TABLE public.design_items
  DROP CONSTRAINT design_items_matched_product_id_fkey;

ALTER TABLE public.design_items
  ADD CONSTRAINT design_items_matched_product_id_fkey
  FOREIGN KEY (matched_product_id) REFERENCES public.shop_products(id) ON DELETE SET NULL;
