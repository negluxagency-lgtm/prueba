-- ==========================================================
-- STEP 1: POBLAR barbero_id en citas donde está vacío
-- Cruza citas.barbero (nombre texto) con barberos.nombre
-- dentro de la misma barbería.
-- ==========================================================

-- Ver cuántas se van a reparar (comprobación previa):
SELECT COUNT(*) AS a_reparar
FROM citas c
INNER JOIN barberos b 
    ON b.barberia_id = c.barberia_id 
   AND LOWER(TRIM(b.nombre)) = LOWER(TRIM(c.barbero))
WHERE c.barbero_id IS NULL
  AND c.barbero IS NOT NULL;

-- EJECUTAR LA MIGRACIÓN:
UPDATE citas c
SET barbero_id = b.id::TEXT
FROM barberos b
WHERE b.barberia_id = c.barberia_id
  AND LOWER(TRIM(b.nombre)) = LOWER(TRIM(c.barbero))
  AND c.barbero_id IS NULL
  AND c.barbero IS NOT NULL;

-- Verificar resultado:
SELECT 
    COUNT(*) as total,
    COUNT(barbero_id) as con_barbero_id,
    COUNT(CASE WHEN barbero_id IS NULL AND barbero IS NOT NULL THEN 1 END) as sin_id_con_nombre
FROM citas;


-- ==========================================================
-- STEP 2: RE-EJECUTAR BACKFILL DE MÉTRICAS DE BARBEROS
-- (Con todos los barbero_id ya rellenos)
-- ==========================================================

DO $$
DECLARE
    r_barb RECORD;
BEGIN
    RAISE NOTICE 'Re-ejecutando Backfill de Métricas de Barberos...';

    FOR r_barb IN (
        SELECT DISTINCT b.barberia_id, b.id AS barbero_id, c."Dia"::DATE AS fecha
        FROM citas c
        INNER JOIN barberos b ON b.id::TEXT = c.barbero_id::TEXT
        WHERE c.barberia_id IS NOT NULL 
          AND c.barbero_id IS NOT NULL 
          AND c.cancelada = false

        UNION

        SELECT DISTINCT b.barberia_id, h.barbero_id::BIGINT AS barbero_id, h.fecha::DATE AS fecha
        FROM horas_extra h
        INNER JOIN barberos b ON b.id = h.barbero_id
        WHERE h.barbero_id IS NOT NULL

        ORDER BY fecha ASC
    ) LOOP
        BEGIN
            PERFORM recalcular_metricas_barberos(r_barb.barberia_id, r_barb.barbero_id, r_barb.fecha);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error barberos % % %: %', r_barb.barberia_id, r_barb.barbero_id, r_barb.fecha, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill completado. Filas en metricas_barberos:';
END;
$$;

-- Ver resultado final
SELECT barbero_id, MIN(dia) as primer_dia, MAX(dia) as ultimo_dia, COUNT(*) as total_dias, SUM(cortes) as total_cortes, SUM(ingresos) as total_ingresos
FROM metricas_barberos
GROUP BY barbero_id
ORDER BY barbero_id;
