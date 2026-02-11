-- Add duracion column to citas table
ALTER TABLE public.citas 
ADD COLUMN IF NOT EXISTS duracion INTEGER DEFAULT 30;

-- Comment for documentation
COMMENT ON COLUMN public.citas.duracion IS 'Duración de la cita en minutos. Usado para detectar solapamientos.';

-- Update existing records to have a default duration (e.g. 30 mins) if needed
-- Ideally we would pull this from servicios table join, but a default 30 is safer for now
UPDATE public.citas 
SET duracion = 30 
WHERE duracion IS NULL;
