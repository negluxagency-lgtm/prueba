-- ==========================================================
-- BACKFILL DE MÉTRICAS (Recálculo Completo)
-- Proyecto: Nelux
-- Objetivo: Sincronizar metricas_diarias, mensuales y anuales con los datos reales de citas y ventas
-- Incluye la corrección de no_shows que antes estaba en 0.
-- ==========================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Iniciando backfill de métricas...';

    -- 1. Recalcular métricas para cada combinación de barbería y día donde haya actividad
    FOR r IN 
        SELECT DISTINCT barberia_id, "Dia" as fecha FROM citas
        UNION
        SELECT DISTINCT barberia_id, created_at::DATE as fecha FROM ventas_productos
    LOOP
        -- Llamamos a la función que ya tiene SECURITY DEFINER y la lógica de no_shows
        PERFORM recalcular_metricas_diarias(r.barberia_id, r.fecha);
        
        -- También recalcular métricas de barberos y contabilidad para asegurar consistencia
        PERFORM recalcular_metricas_contabilidad(r.barberia_id, r.fecha);
    END LOOP;

    RAISE NOTICE 'Backfill completado exitosamente.';
END $$;
