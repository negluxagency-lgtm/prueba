-- ==========================================================
-- CORRECCIÓN MATEMÁTICA EXACTA DE CITAS vs CORTES vs NO SHOWS
-- ==========================================================

CREATE OR REPLACE FUNCTION recalcular_metricas_diarias(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ingresos_citas NUMERIC;
    v_ingresos_productos NUMERIC;
    
    v_cortes INTEGER;      -- (Confirmadas)
    v_no_shows INTEGER;    -- (Canceladas)
    v_pendientes INTEGER;  -- (Ni confirmadas ni canceladas)
    
    v_citas INTEGER;       -- (La suma exacta de las 3 anteriores)
    
    v_productos INTEGER;
    v_caja_esperada NUMERIC;
    v_mes TEXT;
    v_tx_prod INTEGER;
BEGIN
    v_mes := to_char(p_fecha, 'YYYY-MM');

    -- CÁLCULO ESTRICTAMENTE DESGLOSADO
    SELECT 
        -- 1. Ingresos y cortes (SOLO confirmadas=true)
        COALESCE(SUM(CASE WHEN confirmada = true AND (cancelada IS NULL OR cancelada = false) THEN "Precio"::NUMERIC ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE confirmada = true AND (cancelada IS NULL OR cancelada = false)),
        
        -- 2. No shows (SOLO cancelada=true)
        COUNT(*) FILTER (WHERE cancelada = true),
        
        -- 3. Pendientes (Ni confirmadas ni canceladas)
        COUNT(*) FILTER (WHERE (confirmada IS NULL OR confirmada = false) AND (cancelada IS NULL OR cancelada = false)),
        
        -- Caja esperada (Todo lo que no esté cancelado)
        COALESCE(SUM(CASE WHEN (cancelada IS NULL OR cancelada = false) THEN "Precio"::NUMERIC ELSE 0 END), 0)
        
    INTO 
        v_ingresos_citas, 
        v_cortes, 
        v_no_shows, 
        v_pendientes, 
        v_caja_esperada
    FROM citas
    WHERE barberia_id = p_barberia_id AND "Dia" = p_fecha;

    -- SUMATORIA EXACTA REQUERIDA POR EL USUARIO:
    -- Citas = Confirmadas (Cortes) + Canceladas (No Shows) + Pendientes
    v_citas := v_cortes + v_no_shows + v_pendientes;

    -- Productos del día:
    SELECT 
        COALESCE(SUM(precio * cantidad), 0),
        COALESCE(SUM(cantidad), 0),
        COUNT(*)
    INTO v_ingresos_productos, v_productos, v_tx_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id 
      AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;

    -- UPSERT DIARIO
    -- * caja_esperada = ingresos de citas NO canceladas (pendientes + confirmadas). SIN productos.
    -- * caja_real     = ingresos de citas confirmadas + ingresos de ventas de productos.
    INSERT INTO metricas_diarias (
        barberia_id, dia, ingresos, cortes, productos, citas, caja_esperada, caja_real, no_shows
    )
    VALUES (
        p_barberia_id, p_fecha, v_ingresos_citas + v_ingresos_productos,
        v_cortes, v_productos, v_citas,
        v_caja_esperada,                                   -- Solo citas (confirmadas + pendientes)
        v_ingresos_citas + v_ingresos_productos, v_no_shows -- Citas confirmadas + productos
    )
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        productos = EXCLUDED.productos,
        citas = EXCLUDED.citas,
        caja_esperada = EXCLUDED.caja_esperada,
        caja_real = EXCLUDED.caja_real,
        no_shows = EXCLUDED.no_shows;

    -- UPSERT MENSUAL
    WITH mes_stats AS (
        SELECT 
            SUM(ingresos) as tot_ing,
            SUM(cortes) as tot_cor,
            SUM(productos) as tot_prod,
            SUM(citas) as tot_cit,
            SUM(no_shows) as tot_no_shows,
            (SELECT COUNT(*) FROM ventas_productos WHERE barberia_id = p_barberia_id AND to_char((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid'), 'YYYY-MM') = v_mes) as tot_tx_prod
        FROM metricas_diarias
        WHERE barberia_id = p_barberia_id AND to_char(dia, 'YYYY-MM') = v_mes
    )
    INSERT INTO metricas_mensuales (
        barberia_id, mes, ingresos, cortes, productos, citas, ticket_medio, no_shows
    )
    SELECT 
        p_barberia_id, 
        v_mes, 
        tot_ing, 
        tot_cor, 
        tot_prod, 
        tot_cit,
        CASE WHEN (tot_cor + tot_tx_prod) > 0 THEN tot_ing / (tot_cor + tot_tx_prod) ELSE 0 END,
        tot_no_shows
    FROM mes_stats
    ON CONFLICT (barberia_id, mes) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        productos = EXCLUDED.productos,
        citas = EXCLUDED.citas,
        ticket_medio = EXCLUDED.ticket_medio,
        no_shows = EXCLUDED.no_shows;

    -- UPSERT ANUAL
    INSERT INTO metricas_anuales (barberia_id, mes, ingresos, citas, ticket_medio, no_shows)
    SELECT barberia_id, mes, ingresos, citas, ticket_medio, no_shows
    FROM metricas_mensuales
    WHERE barberia_id = p_barberia_id AND mes = v_mes
    ON CONFLICT (barberia_id, mes) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        citas = EXCLUDED.citas,
        ticket_medio = EXCLUDED.ticket_medio,
        no_shows = EXCLUDED.no_shows;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BACKFILL DE RECUPERACIÓN
DO $$
DECLARE
    r RECORD;
BEGIN
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
    END LOOP;
END;
$$;
