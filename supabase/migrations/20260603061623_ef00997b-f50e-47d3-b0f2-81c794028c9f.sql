
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TYPE public.mto_category AS ENUM ('minivan', 'minitruck');

CREATE TABLE public.made_to_order_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.mto_category NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.made_to_order_designs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.made_to_order_designs TO authenticated;
GRANT ALL ON public.made_to_order_designs TO service_role;

ALTER TABLE public.made_to_order_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Designs are viewable by everyone"
  ON public.made_to_order_designs FOR SELECT USING (true);

CREATE POLICY "Admins can insert designs"
  ON public.made_to_order_designs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update designs"
  ON public.made_to_order_designs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete designs"
  ON public.made_to_order_designs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mto_designs_updated
  BEFORE UPDATE ON public.made_to_order_designs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.made_to_order_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID REFERENCES public.made_to_order_designs(id) ON DELETE SET NULL,
  category public.mto_category NOT NULL,
  design_name TEXT,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.made_to_order_inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.made_to_order_inquiries TO authenticated;
GRANT ALL ON public.made_to_order_inquiries TO service_role;

ALTER TABLE public.made_to_order_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit MTO inquiries"
  ON public.made_to_order_inquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view MTO inquiries"
  ON public.made_to_order_inquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete MTO inquiries"
  ON public.made_to_order_inquiries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


INSERT INTO public.made_to_order_designs (category, name, image_url) VALUES
  ('minivan', 'Sport Wrap Minivan', '/__l5e/assets-v1/6850b3fd-6207-41ac-a38e-0373848a9efd/mto-1.png'),
  ('minivan', 'Classic Red Minivan', '/__l5e/assets-v1/bc288e8d-7ed2-457e-b63c-7a08ded7e3ae/mto-14.png'),
  ('minivan', 'Champagne Minivan', '/__l5e/assets-v1/ebef9b3f-be20-4bfc-bc78-da4d8b16f692/mto-16.png'),
  ('minivan', 'Two-Tone Red & Black Minivan', '/__l5e/assets-v1/e57780b7-8d4a-48c6-b115-fde0b2fbb94c/mto-17.png'),
  ('minivan', 'Electric Blue Minivan', '/__l5e/assets-v1/703d8606-1f97-4bc1-839f-da6b9e797695/mto-20.png'),
  ('minitruck', '4x4 Canopy Minitruck', '/__l5e/assets-v1/3613fe29-64cd-479a-b0c0-27092e7b1986/mto-2.png'),
  ('minitruck', 'Beige Crew Cab Minitruck', '/__l5e/assets-v1/2f19d2e2-3a64-4db2-8698-2f404bd1955e/mto-3.png'),
  ('minitruck', 'Lifted Blue 4x4 Minitruck', '/__l5e/assets-v1/41ba59b7-6c28-4623-b1ad-0ca1f12c0239/mto-4.png'),
  ('minitruck', 'Black & Yellow Minitruck', '/__l5e/assets-v1/0c39cd3c-6c74-483e-bf4b-d538b0573c8f/mto-5.png'),
  ('minitruck', 'Gold 4x4 Minitruck', '/__l5e/assets-v1/d617d682-af1e-4320-8491-86ddff3079ec/mto-6.png');
