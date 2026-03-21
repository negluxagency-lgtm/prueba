-- 1. TABLA DE OBSERVABILIDAD
-- Para registrar errores críticos de servidor y acciones sospechosas.
CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nivel TEXT NOT NULL, -- 'ERROR', 'WARNING', 'INFO'
    modulo TEXT NOT NULL, -- 'AUTH', 'METRICS', 'ACTIONS'
    mensaje TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    usuario_id UUID REFERENCES auth.users(id)
);

-- 2. FUNCIONES DE TRIGGER PARA MÉTRICAS RELEVANTES
-- Automatizan la llamada a recalcular_metricas_diarias tras cualquier cambio.

-- A. Trigger para CITAS
CREATE OR REPLACE FUNCTION fn_trigger_citas_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es UPDATE y cambió el estado o la fecha, recalculamos ambos días (viejo y nuevo)
    IF (TG_OP = 'UPDATE') THEN
        PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD."Dia");
        IF (NEW."Dia" <> OLD."Dia" OR NEW.barberia_id <> OLD.barberia_id) THEN
            PERFORM recalcular_metricas_diarias(NEW.barberia_id, NEW."Dia");
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM recalcular_metricas_diarias(NEW.barberia_id, NEW."Dia");
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM recalcular_metricas_diarias(OLD.barberia_id, OLD."Dia");
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Trigger para VENTAS DE PRODUCTOS
CREATE OR REPLACE FUNCTION fn_trigger_productos_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_fecha_old DATE;
    v_fecha_new DATE;
BEGIN
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        v_fecha_old := (OLD.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE;
        PERFORM recalcular_metricas_diarias(OLD.barberia_id, v_fecha_old);
    END IF;
    
    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        v_fecha_new := (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE;
        PERFORM recalcular_metricas_diarias(NEW.barberia_id, v_fecha_new);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENLAZAR TRIGGERS
DROP TRIGGER IF EXISTS tr_citas_metrics ON citas;
CREATE TRIGGER tr_citas_metrics
AFTER INSERT OR UPDATE OR DELETE ON citas
FOR EACH ROW EXECUTE FUNCTION fn_trigger_citas_metrics();

DROP TRIGGER IF EXISTS tr_productos_metrics ON ventas_productos;
CREATE TRIGGER tr_productos_metrics
AFTER INSERT OR UPDATE OR DELETE ON ventas_productos
FOR EACH ROW EXECUTE FUNCTION fn_trigger_productos_metrics();

-- 4. ÍNDICES DE RENDIMIENTO PARA MÉTRICAS
-- Acelerar las queries de agregación que usa la función de métricas.
CREATE INDEX IF NOT EXISTS idx_citas_barberia_dia ON citas (barberia_id, "Dia");
CREATE INDEX IF NOT EXISTS idx_ventas_prod_barberia_created ON ventas_productos (barberia_id, created_at);

-- 5. ÍNDICE PARCIAL PARA ESCALABILIDAD (FALLO 4)
-- Optimiza el Dashboard al ignorar citas canceladas en las búsquedas diarias.
CREATE INDEX IF NOT EXISTS idx_citas_activas_barberia_dia 
ON citas (barberia_id, "Dia") 
WHERE (cancelada IS NOT TRUE);
