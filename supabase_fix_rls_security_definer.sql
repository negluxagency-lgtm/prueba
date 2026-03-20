-- ==========================================================
-- CORRECCIÓN DE ERROR RLS EN MÉTRICAS (Supabase)
-- Proyecto: Nelux
-- Problema: "new row violates row-level security policy for table 'metricas_contabilidad'"
-- Solución: Recrear las funciones con SECURITY DEFINER
-- ==========================================================

-- 1. Función de Recálculo Diario (Corregida con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION recalcular_metricas_diarias(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ingresos_citas NUMERIC;
    v_ingresos_productos NUMERIC;
    v_cortes INTEGER;
    v_productos INTEGER;
    v_citas INTEGER;
    v_caja_esperada NUMERIC;
    v_no_shows INTEGER;
    v_mes TEXT;
    v_tx_prod INTEGER;
BEGIN
    v_mes := to_char(p_fecha, 'YYYY-MM');

    -- Cálculo Citas del día:
    SELECT 
        COALESCE(SUM(CASE WHEN confirmada = true THEN "Precio"::NUMERIC ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE confirmada = true),
        COUNT(*),
        COALESCE(SUM(CASE WHEN cancelada = false THEN "Precio"::NUMERIC ELSE 0 END), 0)
    INTO v_ingresos_citas, v_cortes, v_citas, v_caja_esperada
    FROM citas
    WHERE barberia_id = p_barberia_id AND "Dia" = p_fecha;

    -- Cálculo Productos del día:
    SELECT 
        COALESCE(SUM(precio), 0),
        COALESCE(SUM(cantidad), 0),
        COUNT(*)
    INTO v_ingresos_productos, v_productos, v_tx_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id AND created_at::DATE = p_fecha;

    -- UPSERT DIARIO
    INSERT INTO metricas_diarias (
        barberia_id, dia, ingresos, cortes, productos, citas, caja_esperada, caja_real
    )
    VALUES (
        p_barberia_id, 
        p_fecha, 
        v_ingresos_citas + v_ingresos_productos, 
        v_cortes, 
        v_productos, 
        v_citas, 
        v_caja_esperada + v_ingresos_productos, 
        v_ingresos_citas + v_ingresos_productos
    )
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        productos = EXCLUDED.productos,
        citas = EXCLUDED.citas,
        caja_esperada = EXCLUDED.caja_esperada,
        caja_real = EXCLUDED.caja_real;

    -- UPSERT MENSUAL
    WITH mes_stats AS (
        SELECT 
            SUM(ingresos) as tot_ing,
            SUM(cortes) as tot_cor,
            SUM(productos) as tot_prod,
            SUM(citas) as tot_cit,
            (SELECT COUNT(*) FROM citas WHERE barberia_id = p_barberia_id AND to_char("Dia", 'YYYY-MM') = v_mes AND cancelada = true) as tot_no_shows,
            (SELECT COUNT(*) FROM ventas_productos WHERE barberia_id = p_barberia_id AND to_char(created_at, 'YYYY-MM') = v_mes) as tot_tx_prod
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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- IMPORTANTE: SECURITY DEFINER

-- 2. Función de Recálculo de Barberos (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION recalcular_metricas_barberos(p_barberia_id UUID, p_barbero_id BIGINT, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_rev NUMERIC;
    v_cuts INTEGER;
    v_ext_min NUMERIC;
    v_ext_amt NUMERIC;
BEGIN
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0), COUNT(*)
    INTO v_rev, v_cuts
    FROM citas
    WHERE barberia_id = p_barberia_id AND barbero_id = p_barbero_id::TEXT AND "Dia" = p_fecha AND confirmada = true;

    SELECT COALESCE(SUM(minutos_extra), 0), 0
    INTO v_ext_min, v_ext_amt
    FROM horas_extra
    WHERE barbero_id = p_barbero_id AND fecha = p_fecha;

    INSERT INTO metricas_barberos (barberia_id, barbero_id, dia, ingresos, cortes, horas_extra, monto_horas_extra)
    VALUES (p_barberia_id, p_barbero_id, p_fecha, v_rev, v_cuts, v_ext_min / 60.0, v_ext_amt)
    ON CONFLICT (barberia_id, barbero_id, dia) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        horas_extra = EXCLUDED.horas_extra,
        monto_horas_extra = EXCLUDED.monto_horas_extra;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función de Recálculo de Contabilidad (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION recalcular_metricas_contabilidad(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ing_serv NUMERIC;
    v_ing_prod NUMERIC;
    v_gast NUMERIC;
    v_gast_ded NUMERIC;
BEGIN
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0) INTO v_ing_serv FROM citas WHERE barberia_id = p_barberia_id AND "Dia" = p_fecha AND confirmada = true;
    SELECT COALESCE(SUM(precio * cantidad), 0) INTO v_ing_prod FROM ventas_productos WHERE barberia_id = p_barberia_id AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;
    SELECT COALESCE(SUM(monto), 0), COALESCE(SUM(CASE WHEN deducible = true THEN monto ELSE 0 END), 0) INTO v_gast, v_gast_ded FROM gastos WHERE barberia_id = p_barberia_id AND fecha = p_fecha;

    INSERT INTO metricas_contabilidad (barberia_id, dia, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles)
    VALUES (p_barberia_id, p_fecha, v_ing_serv, v_ing_prod, v_gast, v_gast_ded)
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
