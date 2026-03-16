-- Arreglar políticas de RLS para Realtime en mis_mensajes
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Habilitar RLS si no lo está (probablemente ya lo esté)
ALTER TABLE public.mis_mensajes ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que puedan estar bloqueando (opcional/limpieza)
-- DROP POLICY IF EXISTS "Admins can read all messages" ON public.mis_mensajes;

-- 3. Crear política para que usuarios autenticados (Admins) puedan VER mensajes
-- Esto es CRÍTICO para que Realtime envíe los datos a través del WebSocket
CREATE POLICY "Admins can read all messages" 
ON public.mis_mensajes 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Asegurar que los Admins también puedan INSERTAR (para enviar mensajes desde el panel)
CREATE POLICY "Admins can insert messages" 
ON public.mis_mensajes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. RE-HABILITAR PUBLICACIÓN (con guarda de seguridad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'mis_mensajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mis_mensajes;
  END IF;
END $$;
