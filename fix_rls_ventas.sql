-- Habilitar RLS si no está habilitado
ALTER TABLE public.ventas_productos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar duplicados si es necesario
-- DROP POLICY IF EXISTS "Users can manage their own sales" ON public.ventas_productos;

-- Crear política para gestión total (Select, Insert, Update, Delete)
CREATE POLICY "Users can manage their own sales"
ON public.ventas_productos
FOR ALL
USING (auth.uid() = barberia_id);

-- Verificar que RLS esté activo
ALTER TABLE public.ventas_productos FORCE ROW LEVEL SECURITY;
