# [INFRA-003]: GESTIÓN DE IMÁGENES DE PRODUCTOS EN STORAGE

> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-07
> **Responsable:** Antigravity Deployment Agent

## 1. Objetivo Primario
Permitir la carga, almacenamiento y visualización de fotografías de productos para mejorar la experiencia visual del inventario y el punto de venta.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Visibilidad:** El bucket `productos` DEBE ser público para permitir el acceso directo desde el frontend sin URLs firmadas de corta duración (experiencia de usuario fluida).
*   **Formatos:** Solo se permiten archivos de imagen (JPEG, PNG, WEBP).
*   **Tamaño:** Límite máximo de 2MB por imagen para optimizar el rendimiento y coste.
*   **Organización:** Ruta: `[uuid_barberia]/[timestamp]_[nombre_limpio].ext`.

## 3. Procedimiento Estándar (SOP)
1.  **Carga:** Usar `supabase.storage.from('productos').upload()` desde el cliente o servidor.
2.  **Referencia:** Guardar la `publicUrl` resultante en la columna `foto` de la tabla `productos`.
3.  **Actualización:** Al cambiar una foto, se recomienda subir la nueva. El borrado de la anterior es opcional pero recomendado si se desea ahorrar espacio.
4.  **Fallback:** Si un producto no tiene foto, mostrar el icono `ImageIcon` de Lucide.

## 4. Herramientas y Comandos Autorizados
*   `supabase.storage.from('productos').upload()`: Para persistencia.
*   `getPublicUrl()`: Para obtener el enlace permanente.

## 5. Configuración de Supabase (SQL Definitive)
Copia y pega este bloque completo en el **SQL Editor** de Supabase para resolver todos los problemas de RLS:

```sql
-- ==========================================
-- 1. CONFIGURACIÓN DEL BUCKET (STORAGE)
-- ==========================================

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- ELIMINAR POLÍTICAS ANTIGUAS (Para evitar conflictos)
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir update/delete a dueños" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública de productos" ON storage.objects;

-- POLÍTICA: Permitir a usuarios autenticados subir a "productos/"
CREATE POLICY "Permitir subida a usuarios autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'productos');

-- POLÍTICA: Permitir a los dueños gestionar sus propios archivos (opcionalmente restringido por carpeta con el ID del usuario)
CREATE POLICY "Permitir gestión total a dueños" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'productos');

-- POLÍTICA: Lectura pública (Necesaria para que las imágenes se vean en la web)
CREATE POLICY "Lectura pública de productos" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'productos');


-- ==========================================
-- 2. CONFIGURACIÓN DE LA TABLA PRODUCTOS
-- ==========================================

-- Asegurar que RLS está activo en la tabla
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- ELIMINAR POLÍTICAS ANTIGUAS
DROP POLICY IF EXISTS "Permitir insert a dueños" ON public.productos;
DROP POLICY IF EXISTS "Permitir select a dueños" ON public.productos;
DROP POLICY IF EXISTS "Permitir update a dueños" ON public.productos;
DROP POLICY IF EXISTS "Permitir delete a dueños" ON public.productos;

-- POLÍTICA: Insertar - Solo si el barberia_id coincide con el ID del usuario
CREATE POLICY "Permitir insert a dueños" 
ON public.productos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = barberia_id);

-- POLÍTICA: Ver - Solo sus propios productos
CREATE POLICY "Permitir select a dueños" 
ON public.productos FOR SELECT 
TO authenticated 
USING (auth.uid() = barberia_id);

-- POLÍTICA: Actualizar
CREATE POLICY "Permitir update a dueños" 
ON public.productos FOR UPDATE 
TO authenticated 
USING (auth.uid() = barberia_id)
WITH CHECK (auth.uid() = barberia_id);

-- POLÍTICA: Borrar
CREATE POLICY "Permitir delete a dueños" 
ON public.productos FOR DELETE 
TO authenticated 
USING (auth.uid() = barberia_id);
```

## 6. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-07 | Inicialización | N/A |
