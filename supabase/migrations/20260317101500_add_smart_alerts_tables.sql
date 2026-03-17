-- Smart alerts persistence: per-user login counter and alert recurrence history.

CREATE TABLE IF NOT EXISTS public.user_alert_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_count INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT 'portfolio',
  last_shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reference_value NUMERIC NOT NULL DEFAULT 0,
  cooldown_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS alert_history_user_alert_entity_uniq
  ON public.alert_history(user_id, alert_type, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS alert_history_user_idx
  ON public.alert_history(user_id);

ALTER TABLE public.user_alert_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_alert_state' AND policyname = 'Users can view own alert state'
  ) THEN
    CREATE POLICY "Users can view own alert state"
      ON public.user_alert_state
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_alert_state' AND policyname = 'Users can upsert own alert state'
  ) THEN
    CREATE POLICY "Users can upsert own alert state"
      ON public.user_alert_state
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_history' AND policyname = 'Users can view own alert history'
  ) THEN
    CREATE POLICY "Users can view own alert history"
      ON public.alert_history
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_history' AND policyname = 'Users can write own alert history'
  ) THEN
    CREATE POLICY "Users can write own alert history"
      ON public.alert_history
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_alert_state_updated_at ON public.user_alert_state;
CREATE TRIGGER update_user_alert_state_updated_at
  BEFORE UPDATE ON public.user_alert_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_alert_history_updated_at ON public.alert_history;
CREATE TRIGGER update_alert_history_updated_at
  BEFORE UPDATE ON public.alert_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
