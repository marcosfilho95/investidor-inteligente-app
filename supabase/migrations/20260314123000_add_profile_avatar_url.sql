-- Persist user avatar across devices.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

