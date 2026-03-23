-- ==========================================================
-- POLÍTICAS DE SEGURIDAD RLS PARA MÉTRICAS (Supabase)
-- ==========================================================

-- 1. Habilitar RLS en todas las tablas nuevas
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_contabilidad ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas previas si existieran para evitar duplicados
DROP POLICY IF EXISTS "Dueño puede ver sus metricas diarias" ON metricas_diarias;
DROP POLICY IF EXISTS "Dueño puede ver sus metricas mensuales" ON metricas_mensuales;
DROP POLICY IF EXISTS "Dueño puede ver sus metricas anuales" ON metricas_anuales;
DROP POLICY IF EXISTS "Dueño puede ver metricas de sus barberos" ON metricas_barberos;
DROP POLICY IF EXISTS "Dueño puede ver su contabilidad" ON metricas_contabilidad;

-- 3. Crear Políticas de LECTURA (SELECT) para el dueño de la barbería
CREATE POLICY "Dueño puede ver sus metricas diarias" 
ON metricas_diarias FOR SELECT 
USING (auth.uid() = barberia_id);

CREATE POLICY "Dueño puede ver sus metricas mensuales" 
ON metricas_mensuales FOR SELECT 
USING (auth.uid() = barberia_id);

CREATE POLICY "Dueño puede ver sus metricas anuales" 
ON metricas_anuales FOR SELECT 
USING (auth.uid() = barberia_id);

CREATE POLICY "Dueño puede ver metricas de sus barberos" 
ON metricas_barberos FOR SELECT 
USING (auth.uid() = barberia_id);

CREATE POLICY "Dueño puede ver su contabilidad" 
ON metricas_contabilidad FOR SELECT 
USING (auth.uid() = barberia_id);

-- 4. Las INSERCIONES / ACTUALIZACIONES las hacen los TRIGGERS (con privilegios de postgres o schema)
-- No se requiere política de INSERT/UPDATE pública, sólo SELECT.
