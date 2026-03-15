ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS investor_profile_type TEXT,
ADD COLUMN IF NOT EXISTS investor_profile_score INTEGER,
ADD COLUMN IF NOT EXISTS investor_profile_answers JSONB,
ADD COLUMN IF NOT EXISTS investor_profile_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS investor_profile_updated_at TIMESTAMP WITH TIME ZONE;

