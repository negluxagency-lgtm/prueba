-- ==========================================================
-- CHECK CONSTRAINT PARA PRECISIÓN DE 2 DECIMALES
-- Actúa como un muro de defensa final. Rechaza cualquier
-- intento de guardar números con más de dos decimales.
-- ==========================================================

-- Para metricas_mensuales
ALTER TABLE metricas_mensuales
ADD CONSTRAINT chk_ticket_medio_precision_mensual
CHECK (ticket_medio = ROUND(ticket_medio::numeric, 2));

-- Para metricas_anuales
ALTER TABLE metricas_anuales
ADD CONSTRAINT chk_ticket_medio_precision_anual
CHECK (ticket_medio = ROUND(ticket_medio::numeric, 2));
