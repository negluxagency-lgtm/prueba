-- Migration: Add PIN column to barberos for Staff Portal Kiosk Auth

ALTER TABLE barberos ADD COLUMN IF NOT EXISTS pin VARCHAR(4);

-- Note: Ensure that the RLS policies allow barbers to UPDATE this column ONE TIME (when it's null).
-- For this initial implementation, we will use the Service Role key in the Next.js server actions
-- to handle the PIN creation and verification to keep it simple and secure without complex RLS changes.
