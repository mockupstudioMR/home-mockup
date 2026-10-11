-- Admin dashboards need to see across accounts: the admin home counts designs, rooms,
-- shopping lists and people, and Projects support looks one person up by name.
-- Those tables only had "own rows" SELECT policies, so admins saw their own data and
-- read the KPIs as near-zero. Adds admin SELECT using the existing security-definer
-- has_role() helper (no self-reference, so no policy recursion). Read-only: no new
-- insert/update/delete rights, and grants are unchanged (authenticated already holds
-- SELECT on these tables through the existing own-row policies).

create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all rooms"
  on public.rooms for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all shopping lists"
  on public.shopping_lists for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all designs"
  on public.generated_designs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all quiz responses"
  on public.quiz_responses for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all whatsapp quiz sessions"
  on public.whatsapp_quiz_sessions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all credit transactions"
  on public.credit_transactions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all business profiles"
  on public.business_profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all journey sessions"
  on public.journey_sessions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));