-- SQL Migration: Add client CIF/NIF to facturas_emitidas (Mandatory)
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS cliente_cif TEXT NOT NULL;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS cliente_nombre TEXT NOT NULL;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;
ALTER TABLE facturas_emitidas ADD COLUMN IF NOT EXISTS cliente_email TEXT;
