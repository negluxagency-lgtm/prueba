-- Add slug column to perfiles if it doesn't exist
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Make cliente_id nullable in citas table
ALTER TABLE public.citas 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Add IP address to citas table for rate limiting
ALTER TABLE public.citas 
ADD COLUMN IF NOT EXISTS ip_address text;

-- Add index on ip_address and created_at for faster rate limiting queries
CREATE INDEX IF NOT EXISTS idx_citas_ip_created ON public.citas (ip_address, created_at);

COMMENT ON COLUMN public.citas.ip_address IS 'Client IP address used for rate limiting';
