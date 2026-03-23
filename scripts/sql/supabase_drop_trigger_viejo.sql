-- ==========================================================
-- LIMPIEZA: Eliminar trigger duplicado
-- El trigger antiguo tr_recalcular_citas hace lo mismo 
-- que el nuevo trigger_metricas_citas. Sin este paso,
-- las métricas se recalcularán DOS VECES por cada operación.
-- ==========================================================

DROP TRIGGER IF EXISTS tr_recalcular_citas ON citas;

-- Verificar que solo queda el nuevo:
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'citas' 
  AND trigger_name IN ('tr_recalcular_citas', 'trigger_metricas_citas')
ORDER BY trigger_name;
