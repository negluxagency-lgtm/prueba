-- ==========================================================
-- MÉTRICAS DE BARBEROS Y CONTABILIDAD (Supabase) - REVISADO
-- Integración con Fichaje Inteligente (minutos_extra)
-- ==========================================================

-- 1. TABLAS DE MÉTRICAS (Ajustadas a tipos y lógica)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS metricas_barberos (
    barberia_id UUID REFERENCES perfiles(id),
    barbero_id BIGINT REFERENCES barberos(id),
    dia DATE,
    ingresos NUMERIC DEFAULT 0,
    cortes INTEGER DEFAULT 0,
    horas_extra NUMERIC DEFAULT 0, -- Almacenará decimal (ej: 1.5 horas)
    monto_horas_extra NUMERIC DEFAULT 0,
    PRIMARY KEY (barberia_id, barbero_id, dia)
);

CREATE TABLE IF NOT EXISTS metricas_contabilidad (
    barberia_id UUID REFERENCES perfiles(id),
    dia DATE,
    ingresos_servicios NUMERIC DEFAULT 0,
    ingresos_productos NUMERIC DEFAULT 0,
    gastos NUMERIC DEFAULT 0,
    gastos_deducibles NUMERIC DEFAULT 0,
    PRIMARY KEY (barberia_id, dia)
);

-- 2. FUNCIÓN PARA MÉTRICAS DE BARBEROS (Usa minutos_extra de horas_extra)
-- ----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION recalcular_metricas_barberos(p_barberia_id UUID, p_barbero_id BIGINT, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_rev NUMERIC;
    v_cuts INTEGER;
    v_ext_min NUMERIC;
    v_ext_amt NUMERIC;
BEGIN
    -- Citas confirmadas
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0), COUNT(*)
    INTO v_rev, v_cuts
    FROM citas
    WHERE barberia_id = p_barberia_id AND barbero_id = p_barbero_id::TEXT AND "Dia" = p_fecha AND confirmada = true;

    -- Horas extra (desde la tabla horas_extra que llena el sistema de fichaje)
    -- Traducimos minutos_extra a decimal horas (min / 60)
    -- Nota: Se ha eliminado 'precio_hora_extra' al no existir en la tabla horas_extra.
    SELECT 
        COALESCE(SUM(minutos_extra), 0), 
        0 -- Monto temporalmente en 0 hasta que se defina precio_hora_extra
    INTO v_ext_min, v_ext_amt
    FROM horas_extra
    WHERE barbero_id = p_barbero_id AND fecha = p_fecha;

    -- UPSERT en métricas de barberos
    INSERT INTO metricas_barberos (barberia_id, barbero_id, dia, ingresos, cortes, horas_extra, monto_horas_extra)
    VALUES (p_barberia_id, p_barbero_id, p_fecha, v_rev, v_cuts, v_ext_min / 60.0, v_ext_amt)
    ON CONFLICT (barberia_id, barbero_id, dia) DO UPDATE SET
        ingresos = EXCLUDED.ingresos,
        cortes = EXCLUDED.cortes,
        horas_extra = EXCLUDED.horas_extra,
        monto_horas_extra = EXCLUDED.monto_horas_extra;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCIÓN PARA MÉTRICAS DE CONTABILIDAD
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION recalcular_metricas_contabilidad(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
    v_ing_serv NUMERIC;
    v_ing_prod NUMERIC;
    v_gast NUMERIC;
    v_gast_ded NUMERIC;
BEGIN
    -- Ingresos por servicios
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0)
    INTO v_ing_serv
    FROM citas
    WHERE barberia_id = p_barberia_id AND "Dia" = p_fecha AND confirmada = true;

    -- Ingresos por productos
    SELECT COALESCE(SUM(precio * cantidad), 0)
    INTO v_ing_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;

    -- Gastos
    SELECT COALESCE(SUM(monto), 0), COALESCE(SUM(CASE WHEN deducible = true THEN monto ELSE 0 END), 0)
    INTO v_gast, v_gast_ded
    FROM gastos
    WHERE barberia_id = p_barberia_id AND fecha = p_fecha;

    -- UPSERT
    INSERT INTO metricas_contabilidad (barberia_id, dia, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles)
    VALUES (p_barberia_id, p_fecha, v_ing_serv, v_ing_prod, v_gast, v_gast_ded)
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS DE INTEGRACIÓN
-- ----------------------------------------------------------

-- Horas Extra -> Recalcular Barberos
CREATE OR REPLACE FUNCTION trigger_recalcular_barberos_horas()
RETURNS TRIGGER AS $$
BEGIN
    -- Obtenemos barberia_id desde la tabla barberos si no está en horas_extra
    DECLARE
        v_b_id UUID;
    BEGIN
        SELECT barberia_id INTO v_b_id FROM barberos WHERE id = COALESCE(NEW.barbero_id, OLD.barbero_id);
        
        IF (TG_OP = 'DELETE') THEN
            PERFORM recalcular_metricas_barberos(v_b_id, OLD.barbero_id, OLD.fecha);
        ELSE
            PERFORM recalcular_metricas_barberos(v_b_id, NEW.barbero_id, NEW.fecha);
        END IF;
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalcular_horas ON horas_extra;
CREATE TRIGGER tr_recalcular_horas
AFTER INSERT OR UPDATE OR DELETE ON horas_extra
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_barberos_horas();

-- Gastos -> Recalcular Contabilidad
CREATE OR REPLACE FUNCTION trigger_recalcular_contabilidad_gastos()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM recalcular_metricas_contabilidad(OLD.barberia_id, OLD.fecha);
    ELSE
        PERFORM recalcular_metricas_contabilidad(NEW.barberia_id, NEW.fecha);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalcular_gastos ON gastos;
CREATE TRIGGER tr_recalcular_gastos
AFTER INSERT OR UPDATE OR DELETE ON gastos
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_contabilidad_gastos();

-- TRIGGER DE CITAS (Actualizado para llamar a las 3 métricas)
-- Este trigger sobreescribe al anterior para ser más completo
CREATE OR REPLACE FUNCTION trigger_recalcular_metricas_total()
RETURNS TRIGGER AS $$
DECLARE
    v_b_id UUID;
    v_fecha DATE;
    v_barb_id BIGINT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_b_id := OLD.barberia_id;
        v_fecha := OLD."Dia";
        v_barb_id := OLD.barbero_id;
    ELSE
        v_b_id := NEW.barberia_id;
        v_fecha := NEW."Dia";
        v_barb_id := NEW.barbero_id;
    END IF;

    -- 1. Métricas Diarias/Mensuales Generales
    PERFORM recalcular_metricas_diarias(v_b_id, v_fecha);
    
    -- 2. Métricas de Barberos
    IF v_barb_id IS NOT NULL THEN
        PERFORM recalcular_metricas_barberos(v_b_id, v_barb_id, v_fecha);
    END IF;
    
    -- 3. Métricas de Contabilidad
    PERFORM recalcular_metricas_contabilidad(v_b_id, v_fecha);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalcular_citas ON citas;
CREATE TRIGGER tr_recalcular_citas
AFTER INSERT OR UPDATE OR DELETE ON citas
FOR EACH ROW EXECUTE FUNCTION trigger_recalcular_metricas_total();
