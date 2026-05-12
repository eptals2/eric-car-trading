
-- 1. Add CHECK constraints to inquiries
ALTER TABLE public.inquiries
  ADD CONSTRAINT chk_inquiry_type CHECK (inquiry_type IN ('quote', 'reserve')),
  ADD CONSTRAINT chk_downpayment CHECK (downpayment >= 0 AND downpayment <= 99999999),
  ADD CONSTRAINT chk_monthly_payment CHECK (monthly_payment >= 0 AND monthly_payment <= 99999999),
  ADD CONSTRAINT chk_years_to_pay CHECK (years_to_pay >= 1 AND years_to_pay <= 10),
  ADD CONSTRAINT chk_full_name_len CHECK (char_length(full_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_contact_len CHECK (char_length(contact_number) BETWEEN 5 AND 30),
  ADD CONSTRAINT chk_email_len CHECK (email IS NULL OR char_length(email) <= 255);

-- 2. Tighten the public insert policy on inquiries (no longer always true)
DROP POLICY IF EXISTS "anyone submits inquiry" ON public.inquiries;
CREATE POLICY "anyone submits inquiry"
ON public.inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  car_id IS NOT NULL
  AND char_length(full_name) BETWEEN 1 AND 100
  AND char_length(contact_number) BETWEEN 5 AND 30
  AND inquiry_type IN ('quote', 'reserve')
  AND downpayment >= 0
  AND monthly_payment >= 0
  AND years_to_pay BETWEEN 1 AND 10
);

-- 3. Set search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- 5. Restrict storage listing on car-images: drop broad public SELECT.
-- Public bucket URLs (getPublicUrl) still work without this policy.
DROP POLICY IF EXISTS "public read car images" ON storage.objects;
