-- ==========================================================
-- OPTIMIZACIONES DE BASE DE DATOS
-- 1. Índices para acelerar queries frecuentes
-- 2. Triggers actualizados (incluye UPDATE de cancelada)
-- ==========================================================


-- ──────────────────────────────────────────────
-- PARTE 1: ÍNDICES
-- ──────────────────────────────────────────────

-- Acelera: WHERE barberia_id = X AND Dia = Y AND cancelada = false
CREATE INDEX IF NOT EXISTS idx_citas_barberia_dia 
    ON citas(barberia_id, "Dia");

-- Acelera: WHERE barbero_id = X (métricas por barbero)
CREATE INDEX IF NOT EXISTS idx_citas_barbero_id 
    ON citas(barbero_id);

-- Acelera: WHERE barberia_id = X AND cancelada = false (agenda)
CREATE INDEX IF NOT EXISTS idx_citas_barberia_cancelada 
    ON citas(barberia_id, cancelada);

-- Acelera: las métricas diarias
CREATE INDEX IF NOT EXISTS idx_metricas_barberos_dia 
    ON metricas_barberos(barberia_id, barbero_id, dia);

-- Acelera: las métricas contabilidad
CREATE INDEX IF NOT EXISTS idx_metricas_cont_dia 
    ON metricas_contabilidad(barberia_id, dia);

-- Acelera: gastos por barbería y fecha
CREATE INDEX IF NOT EXISTS idx_gastos_barberia_fecha 
    ON gastos(barberia_id, fecha);

-- Acelera: ventas de productos por barbería
CREATE INDEX IF NOT EXISTS idx_ventas_productos_barberia 
    ON ventas_productos(barberia_id, created_at);


-- ──────────────────────────────────────────────
-- PARTE 2: TRIGGERS ACTUALIZADOS
-- Disparan recálculo de métricas en INSERT, UPDATE
-- (incluyendo cuando se cancela una cita)
-- ──────────────────────────────────────────────

-- Primero eliminamos los triggers antiguos si existen
DROP TRIGGER IF EXISTS trigger_metricas_barberos ON citas;
DROP TRIGGER IF EXISTS trigger_metricas_citas ON citas;
DROP TRIGGER IF EXISTS trigger_metricas_contabilidad ON citas;

-- Función del trigger de citas
CREATE OR REPLACE FUNCTION trigger_actualizar_metricas_citas()
RETURNS TRIGGER AS $$
DECLARE
    v_barbero_id BIGINT;
    v_fecha DATE;
    v_barberia_id UUID;
BEGIN
    -- Obtener los datos relevantes (NEW o OLD según el tipo de operación)
    IF TG_OP = 'DELETE' THEN
        v_fecha := OLD."Dia"::DATE;
        v_barberia_id := OLD.barberia_id;
        BEGIN v_barbero_id := OLD.barbero_id::BIGINT; EXCEPTION WHEN OTHERS THEN v_barbero_id := NULL; END;
    ELSE
        v_fecha := NEW."Dia"::DATE;
        v_barberia_id := NEW.barberia_id;
        BEGIN v_barbero_id := NEW.barbero_id::BIGINT; EXCEPTION WHEN OTHERS THEN v_barbero_id := NULL; END;
    END IF;

    -- Recalcular métricas contabilidad (siempre, para esa barbería y día)
    IF v_barberia_id IS NOT NULL AND v_fecha IS NOT NULL THEN
        PERFORM recalcular_metricas_contabilidad(v_barberia_id, v_fecha);
    END IF;

    -- Recalcular métricas barbero (solo si hay barbero_id válido)
    IF v_barberia_id IS NOT NULL AND v_barbero_id IS NOT NULL AND v_fecha IS NOT NULL THEN
        PERFORM recalcular_metricas_barberos(v_barberia_id, v_barbero_id, v_fecha);
    END IF;

    -- Si era un UPDATE y cambió de fecha, recalcular la fecha ANTERIOR también
    IF TG_OP = 'UPDATE' AND OLD."Dia"::DATE IS DISTINCT FROM NEW."Dia"::DATE THEN
        PERFORM recalcular_metricas_contabilidad(v_barberia_id, OLD."Dia"::DATE);
        BEGIN
            DECLARE v_old_barbero BIGINT;
            BEGIN
                v_old_barbero := OLD.barbero_id::BIGINT;
                IF v_old_barbero IS NOT NULL THEN
                    PERFORM recalcular_metricas_barberos(v_barberia_id, v_old_barbero, OLD."Dia"::DATE);
                END IF;
            END;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en citas — INSERT, UPDATE (cancelada, Precio, barbero_id, Dia) y DELETE
CREATE TRIGGER trigger_metricas_citas
AFTER INSERT OR UPDATE OF cancelada, "Precio", barbero_id, "Dia" OR DELETE
ON citas
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_metricas_citas();


-- ──────────────────────────────────────────────
-- VERIFICAR QUE TODO SE CREÓ BIEN
-- ──────────────────────────────────────────────

-- Ver índices creados en citas
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'citas' AND indexname LIKE 'idx_%';

-- Ver triggers activos en citas
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'citas'
ORDER BY trigger_name;
