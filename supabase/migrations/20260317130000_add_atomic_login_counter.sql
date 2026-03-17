-- Atomic login counter to avoid race conditions across tabs/devices.

ALTER TABLE public.user_alert_state
ADD COLUMN IF NOT EXISTS last_session_fingerprint TEXT NULL;

CREATE OR REPLACE FUNCTION public.increment_login_count_if_new(p_session_fingerprint TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_login_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_alert_state (
    user_id,
    login_count,
    last_login_at,
    last_session_fingerprint
  )
  VALUES (
    v_user_id,
    1,
    now(),
    p_session_fingerprint
  )
  ON CONFLICT (user_id)
  DO UPDATE
  SET
    login_count = CASE
      WHEN COALESCE(public.user_alert_state.last_session_fingerprint, '') IS DISTINCT FROM COALESCE(EXCLUDED.last_session_fingerprint, '')
        THEN public.user_alert_state.login_count + 1
      ELSE public.user_alert_state.login_count
    END,
    last_login_at = CASE
      WHEN COALESCE(public.user_alert_state.last_session_fingerprint, '') IS DISTINCT FROM COALESCE(EXCLUDED.last_session_fingerprint, '')
        THEN now()
      ELSE public.user_alert_state.last_login_at
    END,
    last_session_fingerprint = CASE
      WHEN COALESCE(public.user_alert_state.last_session_fingerprint, '') IS DISTINCT FROM COALESCE(EXCLUDED.last_session_fingerprint, '')
        THEN EXCLUDED.last_session_fingerprint
      ELSE public.user_alert_state.last_session_fingerprint
    END
  RETURNING login_count INTO v_login_count;

  RETURN v_login_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_login_count_if_new(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_login_count_if_new(TEXT) TO service_role;
