ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_images_max_5;
ALTER TABLE public.cars ADD CONSTRAINT cars_images_max_5 CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5);