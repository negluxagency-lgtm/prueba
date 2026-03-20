-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.metricas_contabilidad_mensual (
    barberia_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    mes TEXT NOT NULL, -- Format: 'YYYY-MM'
    ingresos_servicios NUMERIC DEFAULT 0,
    ingresos_productos NUMERIC DEFAULT 0,
    gastos NUMERIC DEFAULT 0,
    gastos_deducibles NUMERIC DEFAULT 0,
    suscripcion NUMERIC DEFAULT 0,
    nomina NUMERIC DEFAULT 0,
    iva NUMERIC DEFAULT 0,
    irpf NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (barberia_id, mes)
);

-- 2. Enable RLS and add Policies
ALTER TABLE public.metricas_contabilidad_mensual ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus métricas de contabilidad mensuales" ON public.metricas_contabilidad_mensual;
CREATE POLICY "Usuarios pueden ver sus métricas de contabilidad mensuales" 
ON public.metricas_contabilidad_mensual FOR SELECT 
TO authenticated 
USING (auth.uid() = barberia_id);

-- 3. Function to update updated_at
CREATE OR REPLACE FUNCTION update_metricas_contabilidad_mensual_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_metricas_contabilidad_mensual_updated_at ON public.metricas_contabilidad_mensual;
CREATE TRIGGER update_metricas_contabilidad_mensual_updated_at
    BEFORE UPDATE ON public.metricas_contabilidad_mensual
    FOR EACH ROW
    EXECUTE FUNCTION update_metricas_contabilidad_mensual_updated_at();

-- 4. Update the recalculation function
CREATE OR REPLACE FUNCTION recalcular_metricas_contabilidad(p_barberia_id UUID, p_fecha DATE)
RETURNS VOID 
SECURITY DEFINER
AS $$
DECLARE
    v_ing_serv NUMERIC;
    v_ing_prod NUMERIC;
    v_gast NUMERIC;
    v_gast_ded NUMERIC;
    
    -- Variables para la métrica mensual
    v_mes TEXT;
    v_mes_ing_serv NUMERIC;
    v_mes_ing_prod NUMERIC;
    v_mes_gastos NUMERIC;
    v_mes_gastos_ded NUMERIC;
BEGIN
    -- Ingresos por servicios
    SELECT COALESCE(SUM("Precio"::NUMERIC), 0)
    INTO v_ing_serv
    FROM citas
    WHERE barberia_id = p_barberia_id 
      AND "Dia" = p_fecha 
      AND confirmada = true 
      AND (cancelada IS NULL OR cancelada = false);

    -- Ingresos por productos
    SELECT COALESCE(SUM(precio * cantidad), 0)
    INTO v_ing_prod
    FROM ventas_productos
    WHERE barberia_id = p_barberia_id AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE = p_fecha;

    -- Gastos
    SELECT COALESCE(SUM(monto), 0), COALESCE(SUM(CASE WHEN deducible = true THEN monto ELSE 0 END), 0)
    INTO v_gast, v_gast_ded
    FROM gastos
    WHERE barberia_id = p_barberia_id AND fecha = p_fecha;

    -- UPSERT DIARIO
    INSERT INTO metricas_contabilidad (barberia_id, dia, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles)
    VALUES (p_barberia_id, p_fecha, v_ing_serv, v_ing_prod, v_gast, v_gast_ded)
    ON CONFLICT (barberia_id, dia) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;

    -- ==========================================
    -- RECALCULAR MES COMPLETO
    -- ==========================================
    v_mes := TO_CHAR(p_fecha, 'YYYY-MM');

    SELECT 
        COALESCE(SUM(ingresos_servicios), 0),
        COALESCE(SUM(ingresos_productos), 0),
        COALESCE(SUM(gastos), 0),
        COALESCE(SUM(gastos_deducibles), 0)
    INTO 
        v_mes_ing_serv, 
        v_mes_ing_prod, 
        v_mes_gastos, 
        v_mes_gastos_ded
    FROM metricas_contabilidad
    WHERE barberia_id = p_barberia_id AND TO_CHAR(dia, 'YYYY-MM') = v_mes;

    -- UPSERT MENSUAL
    INSERT INTO metricas_contabilidad_mensual (
        barberia_id, mes, ingresos_servicios, ingresos_productos, gastos, gastos_deducibles
    ) VALUES (
        p_barberia_id, v_mes, v_mes_ing_serv, v_mes_ing_prod, v_mes_gastos, v_mes_gastos_ded
    ) ON CONFLICT (barberia_id, mes) DO UPDATE SET
        ingresos_servicios = EXCLUDED.ingresos_servicios,
        ingresos_productos = EXCLUDED.ingresos_productos,
        gastos = EXCLUDED.gastos,
        gastos_deducibles = EXCLUDED.gastos_deducibles;
END;
$$ LANGUAGE plpgsql;

-- 5. Backfill existing data
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Ejecuta la función por cada día donde ha habido una cita o una venta
    -- Esto garantiza que todo el histórico de días y meses se reconstruye a la perfección con la nueva lógica
    FOR r IN (
        SELECT DISTINCT barberia_id, "Dia" as dia
        FROM citas
        WHERE "Dia" IS NOT NULL AND barberia_id IS NOT NULL
        UNION
        SELECT DISTINCT barberia_id, (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::DATE as dia
        FROM ventas_productos
        WHERE created_at IS NOT NULL AND barberia_id IS NOT NULL
    ) LOOP
        PERFORM recalcular_metricas_contabilidad(r.barberia_id, r.dia);
    END LOOP;
END;
$$;
