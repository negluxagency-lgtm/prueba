-- ==========================================================
-- AUTOMATIZACIÓN DE MÉTRICAS BACKEND (Supabase) - REPARADO
-- Proyecto: Nelux
-- Responsable: Antigravity Senior Deployment Engineer
-- ==========================================================

-- 1. LIMBIAR Y CREAR TABLAS (Asegurando restricciones)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS metricas_diarias (
    barberia_id UUID REFERENCES perfiles(id),
    dia DATE,
    ingresos NUMERIC DEFAULT 0,
    cortes INTEGER DEFAULT 0,
    productos INTEGER DEFAULT 0,
    citas INTEGER DEFAULT 0,
    caja_esperada NUMERIC DEFAULT 0,
    caja_real NUMERIC DEFAULT 0
);

-- Si ya había datos sin PK, pueden haber duplicados que impidan crear la PK. Limpiamos.
TRUNCATE TABLE metricas_diarias;

DO $$ 
BEGIN
    ALTER TABLE metricas_diarias ADD PRIMARY KEY (barberia_id, dia);
EXCEPTION WHEN others THEN 
    RAISE NOTICE 'La PK ya existe en metricas_diarias.';
END $$;

CREATE TABLE IF NOT EXISTS metricas_mensuales (
    barberia_id UUID REFERENCES perfiles(id),
    mes TEXT, -- "YYYY-MM"
    ingresos NUMERIC DEFAULT 0,
    cortes INTEGER DEFAULT 0,
    productos INTEGER DEFAULT 0,
    citas INTEGER DEFAULT 0,
    ticket_medio NUMERIC DEFAULT 0,
    no_shows INTEGER DEFAULT 0
);

TRUNCATE TABLE metricas_mensuales;

DO $$ 
BEGIN
    ALTER TABLE metricas_mensuales ADD PRIMARY KEY (barberia_id, mes);
EXCEPTION WHEN others THEN 
    RAISE NOTICE 'La PK ya existe en metricas_mensuales.';
END $$;

CREATE TABLE IF NOT EXISTS metricas_anuales (
    barberia_id UUID REFERENCES perfiles(id),
    mes TEXT, -- "YYYY-MM"
    ingresos NUMERIC DEFAULT 0,
    citas INTEGER DEFAULT 0,
    ticket_medio NUMERIC DEFAULT 0,
    no_shows INTEGER DEFAULT 0
);

TRUNCATE TABLE metricas_anuales;

DO $$ 
BEGIN
    ALTER TABLE metricas_anuales ADD PRIMARY KEY (barberia_id, mes);
EXCEPTION WHEN others THEN 
    RAISE NOTICE 'La PK ya existe en metricas_anuales.';
END $$;

-- 2. FUNCIÓN DE RECALCULO (IDEMPOTENTE)
-- ----------------------------------------------------------

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
    -- Ingresos = SUM(Precio) donde confirmada=true
    -- Cortes = COUNT(*) donde confirmada=true
    -- Citas = COUNT(*) de TODO lo que no sea NULL (Total)
    -- Caja Esperada = SUM(Precio) de todas las no canceladas
    SELECT 
        COALESCE(SUM(CASE WHEN confirmada = true THEN "Precio"::NUMERIC ELSE 0 END), 0), -- v_ingresos_citas
        COUNT(*) FILTER (WHERE confirmada = true),                                      -- v_cortes
        COUNT(*),                                                                       -- v_citas (TOTAL)
        COALESCE(SUM(CASE WHEN cancelada = false THEN "Precio"::NUMERIC ELSE 0 END), 0) -- v_caja_esperada
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

    -- UPSERT DIARIO (Requiere UNIQUE CONSTRAINT en barberia_id, dia)
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
$$ LANGUAGE plpgsql;

-- 3. TRIGGER FUNCTION
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_recalcular_metricas()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'citas') THEN
        IF (TG_OP = 'DELETE') THEN
            PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD."Dia");
        ELSE
            PERFORM recalcular_metricas_diarias(NEW.barberia_id, NEW."Dia");
            IF (TG_OP = 'UPDATE' AND (OLD."Dia" <> NEW."Dia" OR OLD.barberia_id <> NEW.barberia_id)) THEN
                PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD."Dia");
            END IF;
        END IF;
    ELSIF (TG_TABLE_NAME = 'ventas_productos') THEN
        IF (TG_OP = 'DELETE') THEN
            PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD.created_at::DATE);
        ELSE
            PERFORM recalcular_metricas_diarias(NEW.barberia_id, NEW.created_at::DATE);
            IF (TG_OP = 'UPDATE' AND (OLD.created_at::DATE <> NEW.created_at::DATE OR OLD.barberia_id <> NEW.barberia_id)) THEN
                PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD.created_at::DATE);
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. VINCULACIÓN DE TRIGGERS
-- ----------------------------------------------------------

DROP TRIGGER IF EXISTS tr_recalcular_citas ON citas;
CREATE TRIGGER tr_recalcular_citas
AFTER INSERT OR UPDATE OR DELETE ON citas
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_metricas();

DROP TRIGGER IF EXISTS tr_recalcular_ventas ON ventas_productos;
CREATE TRIGGER tr_recalcular_ventas
AFTER INSERT OR UPDATE OR DELETE ON ventas_productos
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_metricas();
