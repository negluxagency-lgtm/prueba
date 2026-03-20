-- ==========================================================
-- TRIGGER DE REDONDEO PERMANENTE PARA TICKET MEDIO
-- Fuerza que el ticket_medio siempre tenga 2 decimales
-- en las tablas metricas_mensuales y metricas_anuales
-- ==========================================================

-- 1. Función genérica de redondeo
CREATE OR REPLACE FUNCTION function_round_ticket_medio()
RETURNS TRIGGER AS $$
BEGIN
    -- Se asegura de redondear a 2 decimales antes de guardar
    IF NEW.ticket_medio IS NOT NULL THEN
        NEW.ticket_medio = ROUND(NEW.ticket_medio::numeric, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para metricas_mensuales
DROP TRIGGER IF EXISTS trigger_round_ticket_medio_mensual ON metricas_mensuales;
CREATE TRIGGER trigger_round_ticket_medio_mensual
BEFORE INSERT OR UPDATE ON metricas_mensuales
FOR EACH ROW EXECUTE FUNCTION function_round_ticket_medio();

-- 3. Trigger para metricas_anuales
DROP TRIGGER IF EXISTS trigger_round_ticket_medio_anual ON metricas_anuales;
CREATE TRIGGER trigger_round_ticket_medio_anual
BEFORE INSERT OR UPDATE ON metricas_anuales
FOR EACH ROW EXECUTE FUNCTION function_round_ticket_medio();

-- 4. Actualizar tabla existente para limpiar todo lo sucio que ya exista
UPDATE metricas_mensuales
SET ticket_medio = ROUND(ticket_medio::numeric, 2)
WHERE ticket_medio != ROUND(ticket_medio::numeric, 2);

UPDATE metricas_anuales
SET ticket_medio = ROUND(ticket_medio::numeric, 2)
WHERE ticket_medio != ROUND(ticket_medio::numeric, 2);
