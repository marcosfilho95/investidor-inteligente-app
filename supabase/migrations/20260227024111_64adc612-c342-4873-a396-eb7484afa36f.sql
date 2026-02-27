
-- 1) Create storage bucket for market data (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('market-data', 'market-data', true);

-- Storage policies: anyone can read, only service_role can write
CREATE POLICY "Public read access for market-data"
ON storage.objects FOR SELECT
USING (bucket_id = 'market-data');

CREATE POLICY "Service role can upload to market-data"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'market-data' AND (auth.role() = 'service_role'));

CREATE POLICY "Service role can update market-data"
ON storage.objects FOR UPDATE
USING (bucket_id = 'market-data' AND (auth.role() = 'service_role'));

CREATE POLICY "Service role can delete from market-data"
ON storage.objects FOR DELETE
USING (bucket_id = 'market-data' AND (auth.role() = 'service_role'));

-- 2) Create dataset_meta table
CREATE TABLE public.dataset_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_name TEXT NOT NULL,
  version_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ok',
  message TEXT
);

-- RLS: public read, only service_role writes
ALTER TABLE public.dataset_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dataset_meta"
ON public.dataset_meta FOR SELECT
USING (true);

CREATE POLICY "Service role can insert dataset_meta"
ON public.dataset_meta FOR INSERT
WITH CHECK ((auth.role() = 'service_role'));

CREATE POLICY "Service role can update dataset_meta"
ON public.dataset_meta FOR UPDATE
USING ((auth.role() = 'service_role'));

-- 3) Create price_cache table for chat context
CREATE TABLE public.price_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  current_price NUMERIC NOT NULL DEFAULT 0,
  price_7d_ago NUMERIC,
  price_30d_ago NUMERIC,
  price_12m_ago NUMERIC,
  return_7d NUMERIC,
  return_30d NUMERIC,
  return_12m NUMERIC,
  ibov_return_7d NUMERIC,
  ibov_return_30d NUMERIC,
  ibov_return_12m NUMERIC,
  cdi_annual NUMERIC,
  ipca_12m NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol)
);

ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price_cache"
ON public.price_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can insert price_cache"
ON public.price_cache FOR INSERT
WITH CHECK ((auth.role() = 'service_role'));

CREATE POLICY "Service role can update price_cache"
ON public.price_cache FOR UPDATE
USING ((auth.role() = 'service_role'));

CREATE POLICY "Service role can delete price_cache"
ON public.price_cache FOR DELETE
USING ((auth.role() = 'service_role'));

-- Index for fast lookups
CREATE INDEX idx_dataset_meta_name_status ON public.dataset_meta(dataset_name, status);
CREATE INDEX idx_price_cache_symbol ON public.price_cache(symbol);
