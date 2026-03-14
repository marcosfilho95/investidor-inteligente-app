-- Enforce one-time username definition and improve username->email lookup.

-- 1) Prevent username changes after first definition.
CREATE OR REPLACE FUNCTION public.prevent_username_change_once_set()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(OLD.username, '') <> ''
     AND LOWER(COALESCE(NEW.username, '')) <> LOWER(COALESCE(OLD.username, '')) THEN
    RAISE EXCEPTION 'username_locked_once_set';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_username_change_once_set ON public.profiles;
CREATE TRIGGER trg_prevent_username_change_once_set
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_username_change_once_set();

-- 2) Resolve email from username using auth.users as source of truth (fallback).
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT COALESCE(NULLIF(u.email, ''), NULLIF(p.email, ''))
  INTO v_email
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE LOWER(p.username) = LOWER(TRIM(COALESCE(p_username, '')))
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

