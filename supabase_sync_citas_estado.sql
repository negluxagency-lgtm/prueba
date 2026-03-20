-- ==========================================================
-- TRIGGER DE SINCRONIZACIÓN DE ESTADO DE CITAS
-- Evita estados contradictorios (confirmada=true y cancelada=true)
-- ==========================================================

CREATE OR REPLACE FUNCTION function_sync_citas_estado()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica para INSERT (Nuevas citas)
    IF TG_OP = 'INSERT' THEN
        IF NEW.confirmada = true THEN
            NEW.cancelada = false;
        ELSIF NEW.cancelada = true THEN
            NEW.confirmada = false;
        END IF;
    END IF;

    -- Lógica para UPDATE (Cambios en citas existentes)
    IF TG_OP = 'UPDATE' THEN
        -- Si el sistema/usuario cambia explícitamente "confirmada" a TRUE
        IF NEW.confirmada = true AND COALESCE(OLD.confirmada, false) = false THEN
            NEW.cancelada = false;
        
        -- Si el sistema/usuario cambia explícitamente "cancelada" a TRUE
        ELSIF NEW.cancelada = true AND COALESCE(OLD.cancelada, false) = false THEN
            NEW.confirmada = false;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creamos el trigger asociándolo a la tabla (BEFORE INSERT/UPDATE)
-- Esto interviene ANTES de que los datos se guarden en la base de datos
DROP TRIGGER IF EXISTS trigger_sync_citas_estado ON citas;

CREATE TRIGGER trigger_sync_citas_estado
BEFORE INSERT OR UPDATE ON citas
FOR EACH ROW EXECUTE FUNCTION function_sync_citas_estado();
