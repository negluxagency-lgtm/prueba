-- ==========================================================
-- SINCRONIZADOR ABSOLUTO DE CÁLCULO DE INGRESOS
-- Problema: Discrepancias causadas por límites horarios (UTC vs Madrid).
-- Solución: Alineamos matemáticamente los queries en todas las métricas.
-- ==========================================================

-- 1. FUNCIÓN DIARIA/MENSUAL/ANUAL MAESTRA
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

    -- EXACTAMENTE EL MISMO CÁLCULO DE CITAS QUE EN CONTABILIDAD
    SELECT 
        COALESCE(SUM(CASE WHEN confirmada = true AND (cancelada IS NULL OR cancelada = false) THEN "Precio"::NUMERIC ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE confirmada = true AND (cancelada IS NULL OR cancelada = false)),
        COUNT(*),
        COALESCE(SUM(CASE WHEN (cancelada IS NULL OR cancelada = false) THEN "Precio"::NUMERIC ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE cancelada = true)
    INTO v_ingresos_citas, v_cortes, v_citas, v_caja_esperada, v_no_shows
    FROM citas
    WHERE barberia_id = p_barberia_id AND "Dia" = p_fecha;

    -- EXACTAMENTE EL MISMO CÁLCULO DE PRODUCTOS QUE EN CONTABILIDAD (USANDO ZONA HORARIA EUROPEA)
    SELECT 
        COALESCE(SUM(precio * cantidad), 0),
        COALESCE(SUM(cantidad), 0),
        COUNT(*)
    INTO v_ingresos_productos, v_productos, v_tx_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id 
      AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;

    -- UPSERT DIARIO
    INSERT INTO metricas_diarias (
        barberia_id, dia, ingresos, cortes, productos, citas, caja_esperada, caja_real, no_shows
    )
    VALUES (
        p_barberia_id, 
        p_fecha, 
        v_ingresos_citas + v_ingresos_productos, 
        v_cortes, 
        v_productos, 
        v_citas, 
        v_caja_esperada + v_ingresos_productos, 
        v_ingresos_citas + v_ingresos_productos,
        v_no_shows
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
            (
                SELECT COUNT(*) 
                FROM ventas_productos 
                WHERE barberia_id = p_barberia_id 
                  AND to_char((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid'), 'YYYY-MM') = v_mes
            ) as tot_tx_prod
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


-- 2. FUNCIÓN DE CONTABILIDAD
CREATE OR REPLACE FUNCTION recalcular_metricas_contabilidad(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ing_serv NUMERIC;
    v_ing_prod NUMERIC;
    v_gast NUMERIC;
    v_gast_ded NUMERIC;
    v_mes TEXT;
    v_mes_ing_serv NUMERIC;
    v_mes_ing_prod NUMERIC;
    v_mes_gastos NUMERIC;
    v_mes_gastos_ded NUMERIC;
BEGIN
    v_mes := to_char(p_fecha, 'YYYY-MM');

    -- CITAS: MISMO CÁLCULO
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0)
    INTO v_ing_serv
    FROM citas
    WHERE barberia_id = p_barberia_id 
      AND "Dia" = p_fecha 
      AND confirmada = true 
      AND (cancelada IS NULL OR cancelada = false);

    -- PRODUCTOS: MISMO CÁLCULO ZONA HORARIA
    SELECT COALESCE(SUM(precio * cantidad), 0)
    INTO v_ing_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id 
      AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;

    -- GASTOS
    SELECT COALESCE(SUM(monto), 0), COALESCE(SUM(CASE WHEN deducible = true THEN monto ELSE 0 END), 0)
    INTO v_gast, v_gast_ded
    FROM gastos
    WHERE barberia_id = p_barberia_id AND fecha = p_fecha;

    -- UPSERT DIARIO
    INSERT INTO metricas_contabilidad (barberia_id, dia, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles)
    VALUES (p_barberia_id, p_fecha, v_ing_serv, v_ing_prod, v_gast, v_gast_ded)
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;

    -- RECALCULAR MES COMPLETO BASADO EN DIAS
    SELECT 
        COALESCE(SUM(ingresos_servicios), 0),
        COALESCE(SUM(ingresos_productos), 0),
        COALESCE(SUM(gastos), 0),
        COALESCE(SUM(gastos_deducibles), 0)
    INTO 
        v_mes_ing_serv, 
        v_mes_ing_prod, 
        v_mes_gastos, 
        v_mes_gastos_ded
    FROM metricas_contabilidad
    WHERE barberia_id = p_barberia_id AND to_char(dia, 'YYYY-MM') = v_mes;

    -- UPSERT MENSUAL
    INSERT INTO metricas_contabilidad_mensual (
        barberia_id, mes, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles
    ) VALUES (
        p_barberia_id, v_mes, v_mes_ing_serv, v_mes_ing_prod, v_mes_gastos, v_mes_gastos_ded
    ) ON CONFLICT (barberia_id, mes) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. EL GRAN BACKFILL UNIFICADO
-- (Llamamos a las 2 a la vez en cada día para garantizar el 100% de coincidencia)
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
        UNION
        SELECT DISTINCT barberia_id, fecha as dia
        FROM gastos
        WHERE fecha IS NOT NULL AND barberia_id IS NOT NULL
    ) LOOP
        PERFORM recalcular_metricas_diarias(r.barberia_id, r.dia);
        PERFORM recalcular_metricas_contabilidad(r.barberia_id, r.dia);
    END LOOP;
END;
$$;
