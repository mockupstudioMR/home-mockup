-- Allow admins to delete and update shop products
CREATE POLICY "Admins can manage all products"
ON public.shop_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
