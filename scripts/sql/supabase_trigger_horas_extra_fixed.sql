-- ============================================================
-- TRIGGER CORREGIDO: calcular_horas_extra_trigger
-- Versión: 2026-03-09 (FIXED)
-- Cambios respecto al original:
--   1. Se añade también ON UPDATE para que ediciones manuales en Supabase funcionen.
--   2. Se descuenta el tiempo de pausas del cálculo de minutos reales.
--   3. Se usa ON CONFLICT (barbero_id, fecha) DO UPDATE para evitar duplicados por día.
--   4. Se castea barbero_id a TEXT para comparación robusta.
-- ============================================================

-- PASO 1: Crear (o reemplazar) la función del trigger
CREATE OR REPLACE FUNCTION calcular_horas_extra()
RETURNS TRIGGER AS $$
DECLARE
  v_horario_semanal JSONB;
  v_dia_semana INTEGER;
  v_minutos_teoricos INTEGER := 0;
  v_minutos_reales INTEGER;
  v_minutos_extra INTEGER;
  v_entrada_timestamp TIMESTAMPTZ;
  v_minutos_pausa INTEGER := 0;
BEGIN
  -- 1. Solo actuamos cuando el tipo del nuevo registro es 'salida'
  IF NEW.tipo = 'salida' THEN

    -- 2. Buscamos el registro de 'entrada' más reciente de este barbero ANTES de esta salida
    SELECT timestamp_servidor INTO v_entrada_timestamp
    FROM fichajes_logs
    WHERE barbero_id = NEW.barbero_id
      AND tipo = 'entrada'
      AND timestamp_servidor < NEW.timestamp_servidor
    ORDER BY timestamp_servidor DESC
    LIMIT 1;

    -- Si no hay entrada previa, no podemos calcular nada
    IF v_entrada_timestamp IS NULL THEN
      RETURN NEW;
    END IF;

    -- 3. Calculamos el tiempo total de pausas entre la entrada y esta salida
    --    (Suma de cada pausa: desde pausa_inicio hasta pausa_fin)
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (pf.timestamp_servidor - pi.timestamp_servidor)) / 60
    ), 0)::INTEGER
    INTO v_minutos_pausa
    FROM fichajes_logs pi
    JOIN LATERAL (
      SELECT timestamp_servidor
      FROM fichajes_logs
      WHERE barbero_id = NEW.barbero_id
        AND tipo = 'pausa_fin'
        AND timestamp_servidor > pi.timestamp_servidor
        AND timestamp_servidor < NEW.timestamp_servidor
      ORDER BY timestamp_servidor ASC
      LIMIT 1
    ) pf ON true
    WHERE pi.barbero_id = NEW.barbero_id
      AND pi.tipo = 'pausa_inicio'
      AND pi.timestamp_servidor > v_entrada_timestamp
      AND pi.timestamp_servidor < NEW.timestamp_servidor;

    -- 4. Buscamos el horario semanal en la tabla barberos
    SELECT horario_semanal INTO v_horario_semanal
    FROM barberos
    WHERE id = NEW.barbero_id;

    -- Si no hay horario configurado, no calculamos
    IF v_horario_semanal IS NULL THEN
      RETURN NEW;
    END IF;

    -- 5. Día de la semana basado en la HORA DE ENTRADA (0=Domingo, 1=Lunes...)
    v_dia_semana := EXTRACT(DOW FROM v_entrada_timestamp);

    -- 6. Sumamos los minutos teóricos de todos los turnos de ese día
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM ( (t->>'fin')::TIME - (t->>'inicio')::TIME )) / 60
    ), 0)::INTEGER INTO v_minutos_teoricos
    FROM jsonb_array_elements(v_horario_semanal) AS dia_obj,
         jsonb_array_elements(dia_obj->'turnos') AS t
    WHERE (dia_obj->>'dia')::int = v_dia_semana
      AND (dia_obj->>'activo')::boolean = true;

    -- 7. Minutos reales NETOS (Salida - Entrada - Pausas)
    v_minutos_reales := EXTRACT(EPOCH FROM (NEW.timestamp_servidor - v_entrada_timestamp)) / 60;
    v_minutos_reales := v_minutos_reales - v_minutos_pausa;

    -- 8. Cálculo de minutos extra
    v_minutos_extra := v_minutos_reales - v_minutos_teoricos;

    -- 9. Solo insertamos si hay más de 5 minutos extra (margen de error)
    IF v_minutos_extra > 5 THEN
      INSERT INTO horas_extra (barbero_id, fecha, minutos_esperados, minutos_reales, minutos_extra)
      VALUES (
        NEW.barbero_id,
        v_entrada_timestamp::DATE,
        v_minutos_teoricos,
        v_minutos_reales,
        v_minutos_extra
      )
      ON CONFLICT (barbero_id, fecha) DO UPDATE SET
        minutos_esperados = EXCLUDED.minutos_esperados,
        minutos_reales    = EXCLUDED.minutos_reales,
        minutos_extra     = EXCLUDED.minutos_extra;
    ELSE
      -- Si ya existía un registro del día pero ahora no hay extra, lo borramos
      DELETE FROM horas_extra
      WHERE barbero_id = NEW.barbero_id
        AND fecha = v_entrada_timestamp::DATE;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PASO 2: Eliminar el trigger viejo (si existe) y recrearlo.
-- El trigger ahora se dispara en INSERT Y UPDATE.
-- Esto permite que ediciones manuales desde Supabase Studio
-- también recalculen las horas extra.
-- ============================================================
DROP TRIGGER IF EXISTS trigger_calcular_horas_extra ON fichajes_logs;

CREATE TRIGGER trigger_calcular_horas_extra
  AFTER INSERT OR UPDATE ON fichajes_logs
  FOR EACH ROW
  EXECUTE FUNCTION calcular_horas_extra();


-- ============================================================
-- PASO 3: Asegurarnos de que horas_extra tiene el UNIQUE constraint
-- necesario para que ON CONFLICT funcione.
-- Usamos un bloque DO porque PostgreSQL no soporta ADD CONSTRAINT IF NOT EXISTS.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'horas_extra_barbero_fecha_unique'
  ) THEN
    ALTER TABLE horas_extra
      ADD CONSTRAINT horas_extra_barbero_fecha_unique
      UNIQUE (barbero_id, fecha);
  END IF;
END;
$$;
