# [ID-DIRECTIVA]: REFREDIRECCIONAMIENTO_PDF
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-07
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Crear un sistema de redireccionamiento dinámico para los PDFs (informes y facturas) de manera que al acceder a una URL corta (ej. `/f/[id]`), el usuario sea llevado al archivo en Supabase. Esto evita exponer URLs largas e ilegibles y facilita el manejo futuro de los enlaces.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   La ruta dinámica `/f/[id]` debe redirigir al enlace firmado o público correcto en Storage.
*   Si la factura no existe, o no se tiene acceso, mostrar un 404 claro.
*   En todo el código cliente, reemplazar la generación del `getPublicUrl` por la URL interna `/f/[id]`.

## 3. Procedimiento Estándar (SOP)
1.  Analizar la estructura de datos: identificar de dónde sale el `[id]`.
2.  Desarrollar un manejador de ruta en Next.js App Router (ej. `app/f/[id]/route.ts`).
3.  Buscar el archivo asociado al ID validando en base de datos.
4.  Realizar el `redirect(publicUrl)` correspondiente al almacenamiento de Supabase.
5.  Refactorizar la interfaz de usuario que invoca la URL.

## 4. Herramientas y Comandos Autorizados
*   Next.js Server Components / Route Handlers.
*   `@supabase/supabase-js` para consultar la URL pública.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-07 | Inicialización | Creación de directiva base |
