
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Cars
CREATE TYPE public.car_status AS ENUM ('available', 'out_of_stock');

CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  description TEXT,
  status car_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone views cars" ON public.cars FOR SELECT USING (true);
CREATE POLICY "admins insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update cars" ON public.cars FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete cars" ON public.cars FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  downpayment NUMERIC(12,2) NOT NULL,
  monthly_payment NUMERIC(12,2) NOT NULL,
  years_to_pay INTEGER NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'quote',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone submits inquiry" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER cars_touch BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images','car-images',true) ON CONFLICT DO NOTHING;
CREATE POLICY "public read car images" ON storage.objects FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "admins upload car images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'car-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update car images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'car-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete car images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'car-images' AND public.has_role(auth.uid(),'admin'));
