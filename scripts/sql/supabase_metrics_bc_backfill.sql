-- ==========================================================
-- BACKFILL DE MÉTRICAS DE BARBEROS Y CONTABILIDAD
-- Este script llena las tablas metricas_barberos y metricas_contabilidad
-- con todo el histórico de citas, gastos, productos y horas extra.
-- ==========================================================

DO $$
DECLARE
    r_barb RECORD;
    r_cont RECORD;
BEGIN
    RAISE NOTICE 'Iniciando Backfill de Métricas de Barberos y Contabilidad...';

    -- 1. BACKFILL DE METRICAS_BARBEROS
    -- -------------------------------------------------------------------------------------------------
    -- Recolectamos todas las combinaciones únicas de (barberia_id, barbero_id, fecha)
    -- que existan en citas y horas_extra.
    FOR r_barb IN (
        SELECT DISTINCT barberia_id, barbero_id, dia_fecha as fecha
        FROM (
            SELECT barberia_id, NULLIF(barbero_id, '')::BIGINT as barbero_id, "Dia"::DATE as dia_fecha 
            FROM citas 
            WHERE barberia_id IS NOT NULL 
              AND barbero_id IS NOT NULL
              AND barbero_id ~ '^[0-9]+$'

            UNION

            SELECT b.barberia_id, h.barbero_id, h.fecha as dia_fecha 
            FROM horas_extra h
            INNER JOIN barberos b ON h.barbero_id = b.id
            WHERE h.barbero_id IS NOT NULL
        ) t
        ORDER BY fecha ASC
    ) LOOP
        BEGIN
            PERFORM recalcular_metricas_barberos(r_barb.barberia_id, r_barb.barbero_id, r_barb.fecha);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error re-calculando barberos para % % %: %', r_barb.barberia_id, r_barb.barbero_id, r_barb.fecha, SQLERRM;
        END;
    END LOOP;

    -- 2. BACKFILL DE METRICAS_CONTABILIDAD
    -- -------------------------------------------------------------------------------------------------
    -- Recolectamos todas las combinaciones únicas de (barberia_id, fecha)
    -- que existan en citas, gastos y ventas_productos.
    FOR r_cont IN (
        SELECT DISTINCT barberia_id, dia_fecha as fecha
        FROM (
            SELECT barberia_id, "Dia"::DATE as dia_fecha FROM citas WHERE barberia_id IS NOT NULL
            UNION
            SELECT barberia_id, fecha as dia_fecha FROM gastos WHERE barberia_id IS NOT NULL
            UNION
            SELECT barberia_id, (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE as dia_fecha FROM ventas_productos WHERE barberia_id IS NOT NULL
        ) t
        ORDER BY fecha ASC
    ) LOOP
        BEGIN
            PERFORM recalcular_metricas_contabilidad(r_cont.barberia_id, r_cont.fecha);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error re-calculando contabilidad para % %: %', r_cont.barberia_id, r_cont.fecha, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill completado con éxito.';
END;
$$;
