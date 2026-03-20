-- ==========================================================
-- SCRIPT DE LIMPIEZA DE CITAS PENDIENTES/NULAS
-- Convierte todas las citas sin estado a "Confirmadas"
-- y recalcula todo el sistema para reflejar los nuevos beneficios
-- ==========================================================

DO $$
DECLARE
    r RECORD;
    v_filas_actualizadas INTEGER;
BEGIN
    -- 1. Actualizar las citas que están "en el limbo" (ni confirmadas ni canceladas)
    UPDATE citas
    SET confirmada = true, 
        cancelada = false
    WHERE (cancelada IS NULL OR cancelada = false) 
      AND (confirmada IS NULL OR confirmada = false);

    GET DIAGNOSTICS v_filas_actualizadas = ROW_COUNT;
    RAISE NOTICE 'Se han actualizado % citas al estado confirmada=true.', v_filas_actualizadas;

    -- 2. Recalcular TODO el histórico general y contabilidad
    FOR r IN (
        SELECT DISTINCT barberia_id, "Dia" as dia
        FROM citas
        WHERE "Dia" IS NOT NULL AND barberia_id IS NOT NULL
        UNION
        SELECT DISTINCT barberia_id, (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE as dia
        FROM ventas_productos
        WHERE created_at IS NOT NULL AND barberia_id IS NOT NULL
    ) LOOP
        PERFORM recalcular_metricas_diarias(r.barberia_id, r.dia);
        PERFORM recalcular_metricas_contabilidad(r.barberia_id, r.dia);
    END LOOP;

    -- 3. Recalcular métricas de barberos (para Ranking y Salarios)
    FOR r IN (
        SELECT DISTINCT barberia_id, barbero_id::BIGINT as barbero_id_num, "Dia" as dia
        FROM citas
        WHERE "Dia" IS NOT NULL AND barberia_id IS NOT NULL AND barbero_id IS NOT NULL AND barbero_id ~ '^\d+$'
    ) LOOP
        PERFORM recalcular_metricas_barberos(r.barberia_id, r.barbero_id_num, r.dia);
    END LOOP;

END;
$$;
