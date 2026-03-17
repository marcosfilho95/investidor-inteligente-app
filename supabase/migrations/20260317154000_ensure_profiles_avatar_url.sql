-- Ensure avatar_url exists on profiles to persist profile photo across devices.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
