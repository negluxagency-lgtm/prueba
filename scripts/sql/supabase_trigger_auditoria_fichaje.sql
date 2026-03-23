-- ============================================================
-- TRIGGER: limpiar_fichaje_original_al_auditar
-- Propósito: Cuando el admin añade un fichaje corregido (editado_por NOT NULL),
--            elimina automáticamente el registro original del mismo tipo
--            que hubiera para ese barbero ese mismo día.
--            Si no había ninguno (el barbero se olvidó de fichar), no hace nada.
-- ============================================================

CREATE OR REPLACE FUNCTION limpiar_fichaje_original_al_auditar()
RETURNS TRIGGER AS $$
DECLARE
  v_fecha_auditada DATE;
  v_inicio_dia TIMESTAMPTZ;
  v_fin_dia TIMESTAMPTZ;
BEGIN
  -- Solo actuar si este fichaje es una auditoría (tiene editado_por)
  IF NEW.editado_por IS NOT NULL THEN

    -- Calcular el rango del día del fichaje auditado
    v_fecha_auditada := NEW.timestamp_servidor::DATE;
    v_inicio_dia := v_fecha_auditada::TIMESTAMPTZ;
    v_fin_dia    := v_fecha_auditada::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 millisecond';

    -- Borrar el registro ORIGINAL del mismo tipo para ese barbero ese día.
    -- El registro original se identifica por:
    --   1. Mismo barbero_id
    --   2. Mismo tipo (entrada, salida, pausa_inicio, pausa_fin)
    --   3. Misma fecha
    --   4. editado_por IS NULL (es el original, no una corrección anterior)
    --   5. No es el row que acabamos de insertar (id != NEW.id)
    DELETE FROM fichajes_logs
    WHERE barbero_id   = NEW.barbero_id
      AND tipo         = NEW.tipo
      AND timestamp_servidor BETWEEN v_inicio_dia AND v_fin_dia
      AND editado_por IS NULL
      AND id != NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar si ya existe una versión anterior del trigger
DROP TRIGGER IF EXISTS trigger_limpiar_fichaje_original ON fichajes_logs;

-- Crear el trigger: se dispara DESPUÉS de cada INSERT
CREATE TRIGGER trigger_limpiar_fichaje_original
  AFTER INSERT ON fichajes_logs
  FOR EACH ROW
  EXECUTE FUNCTION limpiar_fichaje_original_al_auditar();
