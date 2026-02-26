
-- User holdings table - portfolio starts empty, user builds it
CREATE TABLE public.user_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  shares INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.user_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holdings"
  ON public.user_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings"
  ON public.user_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings"
  ON public.user_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings"
  ON public.user_holdings FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_holdings_updated_at
  BEFORE UPDATE ON public.user_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
