# [ID-DIRECTIVA]: FEATURE_REVIEWS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-16
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Crear la página de reseñas (`/[slug]/review`) donde los clientes pueden valorar a la barbería de 1 a 5 estrellas. 
- Si la valoración es >= 4 estrellas, se redirige al cliente a la URL de Google (`url_google` en la tabla `perfiles` de Supabase).
- Si la valoración es <= 3 estrellas, se le muestra un mensaje de agradecimiento sin redirección, para gestionar el feedback de forma interna o simplemente agradecer.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   Debe consultar a Supabase para obtener el campo `url_google` del perfil basado en el `slug`.
*   La UI debe ser simple, interactiva y móvil-first (estrellas renderizadas con `lucide-react`).
*   No debe requerir autenticación del usuario (ruta pública).
*   Se utilizan componentes de servidor (para el fetch) y de cliente (para el manejo de estado de las estrellas y redirección).

## 3. Procedimiento Estándar (SOP)
1.  **Levitation (Despliegue)**: Se utiliza el script `src/deploy_reviews.py` que crea:
    *   `app/[slug]/review/page.tsx` (Componente Servidor).
    *   `app/[slug]/review/ReviewPageClient.tsx` (Componente Cliente).
2.  El script utiliza la SDK `antigravity.materialize` (representada mediante operaciones idempotentes de escritura de archivos).
3.  **Comprobación**: Navegar a un perfil existente como `http://localhost:3000/nombre_barberia/review` y probar la interacción de las estrellas.

## 4. Herramientas y Comandos Autorizados
*   `python src/deploy_reviews.py`: Ejecución materializadora del agente Antigravity.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-16 | N/A (Despliegue Inicial) | Diseño y estructura definidos |
| 2026-03-16 | Fallo `404` al buscar `url_google`. Columna `nombre_negocio` ya no existe en la tabla `perfiles` en BD. | Eliminada la columna de la query `select` para evitar que Supabase arroje throw y tire 404. |
