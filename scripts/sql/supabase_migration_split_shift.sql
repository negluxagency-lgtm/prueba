-- Add break time columns to horarios_laborales if they don't exist
ALTER TABLE public.horarios_laborales 
ADD COLUMN IF NOT EXISTS "hora_inicio_pausa" time without time zone,
ADD COLUMN IF NOT EXISTS "hora_fin_pausa" time without time zone;

COMMENT ON COLUMN public.horarios_laborales.hora_inicio_pausa IS 'Start time of the break (Turno Partido)';
COMMENT ON COLUMN public.horarios_laborales.hora_fin_pausa IS 'End time of the break (Turno Partido)';
