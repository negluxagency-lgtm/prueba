-- Añadir columna de método de pago a la tabla de ventas de productos
ALTER TABLE public.ventas_productos 
ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'efectivo';

-- Comentario para claridad
COMMENT ON COLUMN public.ventas_productos.metodo_pago IS 'Método de pago: efectivo, tarjeta, bizum, otra';
