-- SQL Migration: Storage RLS for 'facturas'
-- This script sets up permissions so that each user can only manage files in their own folder ({user_id}/*)

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Permitir subida de facturas a carpeta propia"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facturas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to view their own files
CREATE POLICY "Permitir ver facturas propias"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'facturas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own files
CREATE POLICY "Permitir borrar facturas propias"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'facturas' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
