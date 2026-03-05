-- User trades table - stores each buy/sell operation with execution date
CREATE TABLE public.user_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  shares INTEGER NOT NULL CHECK (shares > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  traded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.user_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.user_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

