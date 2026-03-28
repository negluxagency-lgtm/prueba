-- ==========================================
-- SCRIPT: Sincronización Automática Estado-Plan
-- TABLA: perfiles
-- OBJETIVO: Forzar plan='prueba' si estado='prueba'
-- FECHA: 2026-03-28
-- ==========================================

-- 1. Crear o reemplazar la función de sincronización
CREATE OR REPLACE FUNCTION fn_sync_perfil_plan_with_estado()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado se establece en 'prueba', el plan debe ser 'prueba'
    IF NEW.estado = 'prueba' THEN
        NEW.plan := 'prueba';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar trigger si existe (idempotencia)
DROP TRIGGER IF EXISTS tr_sync_perfil_plan_prueba ON perfiles;

-- 3. Crear el trigger AFTER/BEFORE (usamos BEFORE para modificar el registro antes de guardar)
CREATE TRIGGER tr_sync_perfil_plan_prueba
BEFORE INSERT OR UPDATE ON perfiles
FOR EACH ROW
EXECUTE FUNCTION fn_sync_perfil_plan_with_estado();

-- NOTA: Ejecutar este script en el SQL Editor de Supabase.
