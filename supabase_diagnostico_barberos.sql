-- ==========================================================
-- SCRIPT DE DIAGNÓSTICO — Copiar y ejecutar en Supabase SQL Editor
-- Ejecuta cada bloque uno a uno para identificar el problema
-- ==========================================================

-- 1. ¿Cuántas citas existen con barbero_id relleno y cancelada=false?
SELECT 
    COUNT(*) as total,
    COUNT(barbero_id) as con_barbero_id,
    COUNT(CASE WHEN cancelada = false THEN 1 END) as no_canceladas,
    COUNT(CASE WHEN barbero_id IS NOT NULL AND cancelada = false THEN 1 END) as candidatas_metricas
FROM citas;

-- 2. ¿Cuántas FILAS produce el JOIN de citas con barberos (la lógica del backfill)?
SELECT COUNT(*)
FROM citas c
INNER JOIN barberos b ON b.id::TEXT = c.barbero_id::TEXT
WHERE c.barberia_id IS NOT NULL 
  AND c.barbero_id IS NOT NULL 
  AND c.cancelada = false;

-- 3. Ver las primeras 20 citas que deberían aparecer después del JOIN
SELECT b.barberia_id, b.id AS barbero_id_limpio, b.nombre, c."Dia", c."Precio", c.cancelada, c.barbero_id AS barbero_id_crudo
FROM citas c
INNER JOIN barberos b ON b.id::TEXT = c.barbero_id::TEXT
WHERE c.barberia_id IS NOT NULL 
  AND c.barbero_id IS NOT NULL 
  AND c.cancelada = false
LIMIT 20;

-- 4. ¿El tipo de dato de barbero_id en citas es text, int4, int8?
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'citas' AND column_name = 'barbero_id';

-- 5. ¿Cuántas filas actuales en metricas_barberos?
SELECT barbero_id, MIN(dia), MAX(dia), COUNT(*) as dias 
FROM metricas_barberos
GROUP BY barbero_id;

-- 6. ¿El tipo de dato de id en barberos?
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'barberos' AND column_name = 'id';
