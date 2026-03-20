-- ==========================================================
-- SCRIPT DE CARGA INICIAL (BACKFILL) - MÉTRICAS
-- Ejecutar DESPUÉS de supabase_metrics_automation.sql
-- ==========================================================

DO $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando recalculo masivo de métricas...';

    -- Identificar todos los días con actividad por barbería
    FOR r IN (
        SELECT DISTINCT barberia_id, "Dia"::DATE as fecha FROM citas
        WHERE barberia_id IS NOT NULL AND "Dia" IS NOT NULL
        UNION
        SELECT DISTINCT barberia_id, created_at::DATE as fecha FROM ventas_productos
        WHERE barberia_id IS NOT NULL AND created_at IS NOT NULL
        ORDER BY fecha ASC
    ) LOOP
        -- Ejecutar la función de sincronización para cada día/barbería
        PERFORM recalcular_metricas_diarias(r.barberia_id, r.fecha);
        v_count := v_count + 1;
        
        -- Mostrar progreso cada 10 registros
        IF v_count % 10 = 0 THEN
            RAISE NOTICE 'Procesados % registros...', v_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de días/barberías procesados: %', v_count;
    RAISE NOTICE 'Backfill completado exitosamente.';
END $$;
