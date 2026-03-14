-- Add username support to profiles for login via email or username

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Backfill usernames for existing users using email local-part (or fallback),
-- resolving duplicates deterministically with numeric suffix.
WITH base_values AS (
  SELECT
    p.user_id,
    p.created_at,
    LOWER(
      NULLIF(
        REGEXP_REPLACE(
          COALESCE(NULLIF(SPLIT_PART(p.email, '@', 1), ''), NULLIF(p.name, ''), 'usuario'),
          '[^a-zA-Z0-9._-]',
          '',
          'g'
        ),
        ''
      )
    ) AS base_username
  FROM public.profiles p
),
normalized AS (
  SELECT
    user_id,
    created_at,
    COALESCE(base_username, 'usuario') AS base_username
  FROM base_values
),
deduped AS (
  SELECT
    n.user_id,
    CASE
      WHEN ROW_NUMBER() OVER (PARTITION BY n.base_username ORDER BY n.created_at, n.user_id) = 1
        THEN n.base_username
      ELSE n.base_username || ROW_NUMBER() OVER (PARTITION BY n.base_username ORDER BY n.created_at, n.user_id)::TEXT
    END AS final_username
  FROM normalized n
)
UPDATE public.profiles p
SET username = d.final_username
FROM deduped d
WHERE p.user_id = d.user_id
  AND (p.username IS NULL OR p.username = '');

ALTER TABLE public.profiles
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON public.profiles (LOWER(username));

-- Keep signup trigger in sync to auto-populate username for new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_base_username TEXT;
BEGIN
  v_base_username := LOWER(
    NULLIF(
      REGEXP_REPLACE(
        COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'username', ''),
          NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
          NULLIF(NEW.raw_user_meta_data->>'name', ''),
          'usuario'
        ),
        '[^a-zA-Z0-9._-]',
        '',
        'g'
      ),
      ''
    )
  );

  INSERT INTO public.profiles (user_id, name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(v_base_username, 'usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Public helper for login flow: resolve email from username safely.
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT p.email
  INTO v_email
  FROM public.profiles p
  WHERE LOWER(p.username) = LOWER(TRIM(COALESCE(p_username, '')))
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

