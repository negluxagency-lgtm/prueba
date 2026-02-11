-- Add barbero column to citas table
-- We use TEXT to be flexible (can store "4" or UUID) as existing data might be mixed or legacy
-- If you strictly use UUIDs for barbers, you could use UUID type, but TEXT is safer for now given the integer ID "4" seen in logs.
ALTER TABLE public.citas 
ADD COLUMN IF NOT EXISTS barbero TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.citas.barbero IS 'ID del barbero asignado. Puede ser ID numérico o UUID.';

-- Index for performance on lookups
CREATE INDEX IF NOT EXISTS idx_citas_barbero ON public.citas(barbero);
