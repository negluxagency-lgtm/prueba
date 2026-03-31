-- Migración para añadir el PIN de 4 dígitos al portal de equipo
-- Genera automáticamente un valor de 4 dígitos aleatorios rellenos con ceros a la izquierda.

ALTER TABLE perfiles 
  ADD COLUMN codigo_equipo text;

-- Llenamos los existentes primero con números generados aleatoriamente (0000 a 9999)
UPDATE perfiles 
SET codigo_equipo = lpad(floor(random() * 10000)::int::text, 4, '0') 
WHERE codigo_equipo IS NULL;

-- Establecemos el DEFAULT para futuros perfiles
ALTER TABLE perfiles 
  ALTER COLUMN codigo_equipo SET DEFAULT lpad(floor(random() * 10000)::int::text, 4, '0');
