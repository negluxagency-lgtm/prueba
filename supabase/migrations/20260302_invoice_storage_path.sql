-- SQL Migration: Add Storage Path and Expand Legal Incomes
-- Extend 'facturas_emitidas' to hold full metadata
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS barberia_id UUID REFERENCES perfiles(id);
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS numero_factura TEXT;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS fecha_documento DATE;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS importe_total NUMERIC(10, 2);
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

-- Backup: ensure facturas can store path if needed for external ones (optional but safe)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

-- Enable RLS on facturas_emitidas (often overlooked if it's just a log)
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'facturas_emitidas'
DROP POLICY IF EXISTS "Users can read their emitted invoices" ON facturas_emitidas;
CREATE POLICY "Users can read their emitted invoices"
ON facturas_emitidas FOR ALL
USING (auth.uid() = barberia_id);

-- Storage Policies for 'facturas-legales' bucket
-- These policies ensure that only the owner can read/write their own PDFs
CREATE POLICY "authenticated_upload_legal"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'facturas-legales');

CREATE POLICY "authenticated_select_legal"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'facturas-legales' AND (storage.foldername(name))[1] = auth.uid()::text);
