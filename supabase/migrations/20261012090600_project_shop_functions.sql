-- =====================================================================
-- Step 5.0 "Where do you want to shop?": add a shop link to a project.
-- A shop another user already added (still pending, so not visible to this user)
-- is reused by domain instead of failing on the unique domain index.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.add_project_shop(_project uuid, _url text)
RETURNS TABLE (id uuid, name text, domain text, url text, status public.shop_status, product_count integer, last_scraped_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _clean text := trim(_url);
  _full  text;
  _domain text;
  _shop uuid;
BEGIN
  IF NOT public.is_project_owner(_project) THEN RAISE EXCEPTION 'only the project owner can add shops'; END IF;
  IF _clean = '' THEN RAISE EXCEPTION 'paste a shop link'; END IF;
  _full := CASE WHEN _clean ~* '^https?://' THEN _clean ELSE 'https://' || _clean END;
  _domain := lower(regexp_replace(regexp_replace(_full, '^https?://(www\.)?', '', 'i'), '[/?#].*$', ''));
  IF _domain !~ '^[a-z0-9.-]+\.[a-z]{2,}$' THEN RAISE EXCEPTION 'that does not look like a shop link'; END IF;

  SELECT s.id INTO _shop FROM shops s WHERE lower(s.domain) = _domain;
  IF _shop IS NULL THEN
    INSERT INTO shops (name, domain, url, kind, status, added_by)
    VALUES (_domain, _domain, _full, 'user_added', 'pending', auth.uid())
    RETURNING shops.id INTO _shop;
  END IF;
  IF (SELECT s.status FROM shops s WHERE s.id = _shop) = 'rejected' THEN
    RAISE EXCEPTION 'this shop cannot be used';
  END IF;

  INSERT INTO project_shops (project_id, shop_id, added_by) VALUES (_project, _shop, auth.uid())
  ON CONFLICT (project_id, shop_id) DO NOTHING;

  RETURN QUERY SELECT s.id, s.name, s.domain, s.url, s.status, s.product_count, s.last_scraped_at FROM shops s WHERE s.id = _shop;
END $$;
REVOKE EXECUTE ON FUNCTION public.add_project_shop(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_project_shop(uuid, text) TO authenticated;

-- May this user read this shop's products into the library? Admins always; owners of a
-- project that added the shop while it is pending or approved.
CREATE OR REPLACE FUNCTION public.can_read_shop(_shop uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user, 'admin')
      OR EXISTS (SELECT 1 FROM project_shops ps JOIN projects p ON p.id = ps.project_id
                 JOIN shops s ON s.id = ps.shop_id
                 WHERE ps.shop_id = _shop AND p.owner_id = _user AND s.status IN ('pending', 'approved'));
$$;
REVOKE EXECUTE ON FUNCTION public.can_read_shop(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_shop(uuid, uuid) TO service_role;
