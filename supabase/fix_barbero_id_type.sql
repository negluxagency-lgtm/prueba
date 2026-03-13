-- Fix for Barber ID Type Mismatch
-- The system expects barbero_id to be flexible (handles integer strings like "11")
-- but the column was likely created as UUID. 

-- 1. Change barbero_id to TEXT to allow both integers and UUIDs
ALTER TABLE public.citas 
ALTER COLUMN barbero_id TYPE TEXT USING barbero_id::text;

-- 2. Ensure barbero column is also TEXT (already done in other migrations but good to be sure)
ALTER TABLE public.citas 
ALTER COLUMN barbero TYPE TEXT USING barbero::text;

-- 3. Add a comment explaining the flexibility
COMMENT ON COLUMN public.citas.barbero_id IS 'ID del barbero. Almacenado como TEXT para soportar IDs numéricos heredados y UUIDs.';

-- 4. Re-create index if needed (changing type usually keeps the index but good to verify)
CREATE INDEX IF NOT EXISTS idx_citas_barbero_id ON public.citas(barbero_id);
