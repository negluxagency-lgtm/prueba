-- ==========================================================
-- SUPER BACKFILL: RECALCULO MASIVO DE TODAS LAS MÉTRICAS
-- Proyecto: Nelux
-- Versión Corregida (Types Fix)
-- ==========================================================

DO $$
DECLARE
    r_gen RECORD;
    r_barb RECORD;
    v_count_gen INTEGER := 0;
    v_count_barb INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando Super Backfill corregido...';

    -- 1. IDENTIFICAR DÍAS CON ACTIVIDAD GENERAL (Citas, Ventas, Gastos)
    FOR r_gen IN (
        SELECT DISTINCT barberia_id, dia_fecha as fecha FROM (
            SELECT barberia_id, "Dia"::DATE as dia_fecha FROM citas WHERE barberia_id IS NOT NULL
            UNION
            SELECT barberia_id, created_at::DATE as dia_fecha FROM ventas_productos WHERE barberia_id IS NOT NULL
            UNION
            SELECT barberia_id, fecha as dia_fecha FROM gastos WHERE barberia_id IS NOT NULL
        ) t
        ORDER BY fecha ASC
    ) LOOP
        -- Sincronizar Diarias/Mensuales/Anuales
        PERFORM recalcular_metricas_diarias(r_gen.barberia_id, r_gen.fecha);
        -- Sincronizar Contabilidad
        PERFORM recalcular_metricas_contabilidad(r_gen.barberia_id, r_gen.fecha);
        
        v_count_gen := v_count_gen + 1;
        IF v_count_gen % 20 = 0 THEN RAISE NOTICE 'Sincronizados % días generales...', v_count_gen; END IF;
    END LOOP;

    -- 2. IDENTIFICAR ACTIVIDAD POR BARBERO (Casting explícito a BIGINT)
    -- Traducimos barbero_id de citas (text) a BIGINT solo si es numérico.
    FOR r_barb IN (
        SELECT DISTINCT barberia_id, barbero_id_num as barbero_id, dia_fecha as fecha 
        FROM (
            SELECT 
                barberia_id, 
                CASE WHEN barbero_id ~ '^[0-9]+$' THEN barbero_id::BIGINT ELSE NULL END as barbero_id_num, 
                "Dia"::DATE as dia_fecha 
            FROM citas 
            WHERE barberia_id IS NOT NULL AND barbero_id IS NOT NULL
            
            UNION
            
            SELECT 
                b.barberia_id, 
                h.barbero_id as barbero_id_num, 
                h.fecha as dia_fecha 
            FROM horas_extra h 
            INNER JOIN barberos b ON h.barbero_id = b.id
            WHERE h.barbero_id IS NOT NULL
        ) t
        WHERE barbero_id_num IS NOT NULL 
        ORDER BY fecha ASC
    ) LOOP
        -- Sincronizar Métricas de Barberos
        PERFORM recalcular_metricas_barberos(r_barb.barberia_id, r_barb.barbero_id, r_barb.fecha);
        
        v_count_barb := v_count_barb + 1;
        IF v_count_barb % 50 = 0 THEN RAISE NOTICE 'Sincronizados % registros de barberos...', v_count_barb; END IF;
    END LOOP;

    RAISE NOTICE '--- RESULTADO FINAL ---';
    RAISE NOTICE 'Días generales procesados: %', v_count_gen;
    RAISE NOTICE 'Registros de barberos procesados: %', v_count_barb;
    RAISE NOTICE 'Super Backfill completado exitosamente.';
END $$;
