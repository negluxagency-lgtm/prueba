# SEO-001: GESTIÓN DE METADATOS Y BRANDING SEO
> **Estado:** ACTIVA
> **Última Actualización:** 2026-04-08
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Estandarizar el título, descripción y metadatos de la aplicación para asegurar consistencia en el posicionamiento SEO y la identidad de marca de NeluxBarber en España.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Consistencia**: El título y la descripción principal DEBEN ser exactos en `app/layout.tsx` y `app/(landing)/page.tsx`.
*   **Longitud**: Los títulos deben mantenerse entre 50-60 caracteres para visualización óptima en SERPs.
*   **Verifactu**: Cualquier mención a la facturación debe incluir la referencia "Verifactu 2026" para cumplimiento normativo y SEO por keyword.

## 3. Procedimiento Estándar (SOP)
1.  Identificar archivos de configuración de metadatos (`layout.tsx`, `page.tsx`).
2.  Actualizar los campos `title` y `description` en el objeto `metadata`.
3.  Actualizar campos `openGraph` y `twitter` (title y description) para asegurar consistencia en redes sociales.
4.  Verificar que no existan títulos conflictivos en subpáginas que hereden del layout global.

## 4. Herramientas y Comandos Autorizados
*   `grep_search`: Localizar cadenas de texto de títulos antiguos.
*   `replace_file_content`: Modificar los archivos de metadatos.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-04-08 | Títulos inconsistentes entre landing y layout global | Unificación bajo "NeluxBarber - Software para Barberos y Barberías en España" |
| 2026-04-08 | Solicitud de cambio de título brandeado | Actualización masiva en layout y landing para reflejar "NeluxBarber - Software para Barberos y Barberías en España" |
| 2026-04-08 | Solicitud de cambio de descripción SEO | Unificación de descripciones en layout y landing: "NeluxBarber: software de gestión para barberás..." |
