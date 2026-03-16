-- Habilitar Realtime para la tabla mis_mensajes
-- Ejecuta esto en el SQL Editor de Supabase

BEGIN;
  -- 1. Intentar añadir la tabla a la publicación de realtime
  -- Si ya está, fallará silenciosamente o se puede ignorar
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'mis_mensajes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE mis_mensajes;
    END IF;
  END $$;

  -- 2. Asegurar que la identidad de replica sea completa para capturar todos los cambios (opcional pero recomendado)
  ALTER TABLE public.mis_mensajes REPLICA IDENTITY FULL;
COMMIT;
