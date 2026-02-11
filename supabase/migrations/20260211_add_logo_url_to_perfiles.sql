-- Add logo_url column to perfiles table if it doesn't exist
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verify column existence (optional, for manual check)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'perfiles' AND column_name = 'logo_url';
