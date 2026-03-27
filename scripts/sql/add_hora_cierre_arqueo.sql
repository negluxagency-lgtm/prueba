-- Script para añadir la hora de cierre a la tabla de arqueos
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS hora_cierre TIMESTAMPTZ;

COMMENT ON COLUMN arqueos_caja.hora_cierre IS 'Fecha y hora exacta en la que se realizó el cierre de caja.';
