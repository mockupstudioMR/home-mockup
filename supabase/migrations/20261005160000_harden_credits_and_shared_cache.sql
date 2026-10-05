-- Harden credits and the shared material visual cache.
--
-- 1. Users could update their own business_profiles row, including
--    credits_balance and subscription_tier, and so give themselves credits.
-- 2. Users could insert their own credit_transactions rows.
-- 3. deduct_credits() accepted any user id from any caller and did not lock
--    the row, so one user could drain another's credits and two concurrent
--    calls could both pass the balance check.
-- 4. Any signed-in user could insert anonymous rows into the shared
--    material_visuals cache, and nobody could remove bad entries.

-- Privileged = service role, direct database access (no JWT), or an admin.
CREATE OR REPLACE FUNCTION public.is_privileged_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NULL
      OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      OR public.has_role(auth.uid(), 'admin');
$$;

-- 1. Billing fields can only be changed by privileged callers.
-- SECURITY INVOKER on purpose: current_user is then the role running the
-- statement. Writes from the app run as anon/authenticated; writes made inside
-- trusted SECURITY DEFINER functions such as deduct_credits() run as the
-- function owner and are allowed through.
CREATE OR REPLACE FUNCTION public.protect_business_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.is_privileged_caller() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.credits_balance := 5;          -- column default
    NEW.subscription_tier := 'free';   -- column default
  ELSE
    NEW.credits_balance := OLD.credits_balance;
    NEW.subscription_tier := OLD.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_business_billing_fields ON public.business_profiles;
CREATE TRIGGER protect_business_billing_fields
  BEFORE INSERT OR UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_business_billing_fields();

-- 2. The ledger is written only by deduct_credits() and the server.
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

-- 3. Users can only spend their own credits; the balance row is locked.
CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id UUID, _amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN FALSE;
  END IF;

  IF _user_id IS DISTINCT FROM auth.uid() AND NOT public.is_privileged_caller() THEN
    RAISE EXCEPTION 'You can only spend your own credits' USING ERRCODE = '42501';
  END IF;

  SELECT credits_balance INTO current_balance
  FROM business_profiles
  WHERE user_id = _user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN FALSE;
  END IF;

  UPDATE business_profiles
  SET credits_balance = credits_balance - _amount
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
  VALUES (_user_id, -_amount, 'usage', 'Offer sent');

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deduct_credits(UUID, INTEGER) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.deduct_credits(UUID, INTEGER) TO authenticated, service_role;

-- 4. Cache rows must be attributed to their creator; admins can remove them.
DROP POLICY IF EXISTS "Authenticated users can add cached visuals" ON public.material_visuals;
DROP POLICY IF EXISTS "Authenticated users can add their own cached visuals" ON public.material_visuals;
CREATE POLICY "Authenticated users can add their own cached visuals"
  ON public.material_visuals FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can delete cached visuals" ON public.material_visuals;
CREATE POLICY "Admins can delete cached visuals"
  ON public.material_visuals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT DELETE ON public.material_visuals TO authenticated;
