-- ==========================================================
-- CORRECCIÓN DEFINITIVA DE MÉTRICAS DE BARBEROS (V3 FINAL)
-- Regla de negocio estricta:
-- * Citas = TODAS (canceladas, confirmadas, pendientes)
-- * Cortes = SOLO confirmadas=true y cancelada=false
-- * No Shows = canceladas=true
-- ==========================================================

-- 1. Añadimos columnas a metricas_barberos
DO $$ 
BEGIN
    ALTER TABLE metricas_barberos ADD COLUMN IF NOT EXISTS citas INTEGER DEFAULT 0;
    ALTER TABLE metricas_barberos ADD COLUMN IF NOT EXISTS no_shows INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN 
    RAISE NOTICE 'Las columnas citas y no_shows ya existen en metricas_barberos.';
END $$;

-- 2. Actualizar Función de Recálculo de BARBEROS
-- ATENCIÓN: barbero_id es BIGINT, y en citas está guardado como TEXT!
CREATE OR REPLACE FUNCTION recalcular_metricas_barberos(p_barberia_id UUID, p_barbero_id BIGINT, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ing_serv NUMERIC;
    v_cortes INTEGER;
    v_citas INTEGER;
    v_no_shows INTEGER;
    v_horas_ext NUMERIC;
    v_monto_horas_ext NUMERIC;
BEGIN
    -- Servicios y Citas del barbero aplicando las reglas estrictas
    SELECT 
        COALESCE(SUM(CASE WHEN confirmada = true AND (cancelada IS NULL OR cancelada = false) THEN "Precio"::NUMERIC ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE confirmada = true AND (cancelada IS NULL OR cancelada = false)),
        COUNT(*),
        COUNT(*) FILTER (WHERE cancelada = true)
    INTO
        v_ing_serv,
        v_cortes,
        v_citas,
        v_no_shows
    FROM citas
    WHERE barberia_id = p_barberia_id AND barbero_id = p_barbero_id::TEXT AND "Dia" = p_fecha;

    -- Horas extra (Restaurado usando la lógica nativa del sistema de fichaje original)
    SELECT 
        COALESCE(SUM(minutos_extra), 0), 
        0
    INTO v_horas_ext, v_monto_horas_ext
    FROM horas_extra
    WHERE barbero_id = p_barbero_id AND fecha = p_fecha;

    -- UPSERT
    INSERT INTO metricas_barberos (
        barberia_id, barbero_id, dia, ingresos, cortes, citas, no_shows, horas_extra, monto_horas_extra
    )
    VALUES (
        p_barberia_id, p_barbero_id, p_fecha, v_ing_serv, v_cortes, v_citas, v_no_shows, v_horas_ext / 60.0, v_monto_horas_ext
    )
    ON CONFLICT (barberia_id, barbero_id, dia) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        citas = EXCLUDED.citas,
        no_shows = EXCLUDED.no_shows,
        horas_extra = EXCLUDED.horas_extra,
        monto_horas_extra = EXCLUDED.monto_horas_extra;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill para recalcular TODO el histórico de barberos con la regla estricta
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT barberia_id, barbero_id::BIGINT as barbero_id_num, "Dia" as dia
        FROM citas
        WHERE "Dia" IS NOT NULL AND barberia_id IS NOT NULL AND barbero_id IS NOT NULL AND barbero_id ~ '^\d+$'
    ) LOOP
        PERFORM recalcular_metricas_barberos(r.barberia_id, r.barbero_id_num, r.dia);
    END LOOP;
END;
$$;
