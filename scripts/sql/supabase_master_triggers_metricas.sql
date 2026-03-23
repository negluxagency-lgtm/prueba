-- ==========================================================
-- MASTER TRIGGERS DE MÉTRICAS (V2)
-- Sincroniza al instante cualquier creación, actualización o borrado.
-- ==========================================================

CREATE OR REPLACE FUNCTION trg_actualizar_metricas_globales()
RETURNS TRIGGER AS $$
DECLARE
    v_barberia_id UUID;
    v_fecha DATE;
    v_barbero_id BIGINT;
    
    v_old_fecha DATE;
    v_old_barbero_id BIGINT;
BEGIN
    -- Capturamos datos del estado NUEVO (en Inserts/Updates)
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_barberia_id := NEW.barberia_id;
        
        IF TG_TABLE_NAME = 'citas' THEN
            v_fecha := NEW."Dia";
            v_barbero_id := NULLIF(NEW.barbero_id, '')::BIGINT;
        ELSIF TG_TABLE_NAME = 'ventas_productos' THEN
            v_fecha := (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE;
        ELSIF TG_TABLE_NAME = 'horas_extra' THEN
            v_fecha := NEW.fecha;
            v_barbero_id := NEW.barbero_id;
        ELSIF TG_TABLE_NAME = 'gastos' THEN
            v_fecha := NEW.fecha;
        END IF;
    END IF;

    -- Capturamos datos del estado ANTIGUO (en Deletes/Updates)
    IF TG_OP IN ('DELETE', 'UPDATE') THEN
        v_barberia_id := COALESCE(v_barberia_id, OLD.barberia_id);
        
        IF TG_TABLE_NAME = 'citas' THEN
            v_old_fecha := OLD."Dia";
            v_old_barbero_id := NULLIF(OLD.barbero_id, '')::BIGINT;
        ELSIF TG_TABLE_NAME = 'ventas_productos' THEN
            v_old_fecha := (OLD.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE;
        ELSIF TG_TABLE_NAME = 'horas_extra' THEN
            v_old_fecha := OLD.fecha;
            v_old_barbero_id := OLD.barbero_id;
        ELSIF TG_TABLE_NAME = 'gastos' THEN
            v_old_fecha := OLD.fecha;
        END IF;
    END IF;

    -- 1. RECALCULAR LA FECHA/ESTADO ACTUAL
    IF v_fecha IS NOT NULL THEN
        PERFORM recalcular_metricas_contabilidad(v_barberia_id, v_fecha);
        IF TG_TABLE_NAME != 'gastos' THEN
            PERFORM recalcular_metricas_diarias(v_barberia_id, v_fecha);
        END IF;
        IF v_barbero_id IS NOT NULL AND TG_TABLE_NAME IN ('citas', 'horas_extra') THEN
            PERFORM recalcular_metricas_barberos(v_barberia_id, v_barbero_id, v_fecha);
        END IF;
    END IF;

    -- 2. RECALCULAR LA FECHA/ESTADO ANTIGUO SI HUBO UN CAMBIO DE FECHA O BARBERO (UPDATE) O FUE BORRADO (DELETE)
    -- Esto limpia el "rastro" que deja la cita en el día/barbero anterior.
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND (v_fecha IS DISTINCT FROM v_old_fecha OR v_barbero_id IS DISTINCT FROM v_old_barbero_id)) THEN
        IF v_old_fecha IS NOT NULL THEN
            PERFORM recalcular_metricas_contabilidad(v_barberia_id, v_old_fecha);
            IF TG_TABLE_NAME != 'gastos' THEN
                PERFORM recalcular_metricas_diarias(v_barberia_id, v_old_fecha);
            END IF;
            IF v_old_barbero_id IS NOT NULL AND TG_TABLE_NAME IN ('citas', 'horas_extra') THEN
                PERFORM recalcular_metricas_barberos(v_barberia_id, v_old_barbero_id, v_old_fecha);
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- RECONSTRUCCIÓN DE LOS DISPARADORES EN TODAS LAS TABLAS
-- ==========================================================

-- Citas
DROP TRIGGER IF EXISTS trigger_actualizar_metricas ON citas;
DROP TRIGGER IF EXISTS trigger_actualizar_metricas_citas ON citas;
CREATE TRIGGER trigger_actualizar_metricas_citas
AFTER INSERT OR UPDATE OR DELETE ON citas
FOR EACH ROW EXECUTE FUNCTION trg_actualizar_metricas_globales();

-- Ventas
DROP TRIGGER IF EXISTS trigger_actualizar_metricas_ventas ON ventas_productos;
CREATE TRIGGER trigger_actualizar_metricas_ventas
AFTER INSERT OR UPDATE OR DELETE ON ventas_productos
FOR EACH ROW EXECUTE FUNCTION trg_actualizar_metricas_globales();

-- Horas Extra
DROP TRIGGER IF EXISTS trigger_actualizar_metricas_horas ON horas_extra;
CREATE TRIGGER trigger_actualizar_metricas_horas
AFTER INSERT OR UPDATE OR DELETE ON horas_extra
FOR EACH ROW EXECUTE FUNCTION trg_actualizar_metricas_globales();

-- Gastos
DROP TRIGGER IF EXISTS trigger_actualizar_metricas_gastos ON gastos;
CREATE TRIGGER trigger_actualizar_metricas_gastos
AFTER INSERT OR UPDATE OR DELETE ON gastos
FOR EACH ROW EXECUTE FUNCTION trg_actualizar_metricas_globales();
