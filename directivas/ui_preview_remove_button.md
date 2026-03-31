# [ID-DIRECTIVA]: ELIMINACIÓN DE BACK-LINK EN PREVIEW
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-31
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Suprimir el botón redundante de navegación "Volver al perfil" dentro de `PreviewClient.tsx` (sidebar editor) para evitar bucles o fricciones en la experiencia de usuario, simplificando el panel inferior.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   Modificar únicamente el bloque del footer del panel lateral en `PreviewClient`.
*   Mantener la integridad del botón principal de `Guardar cambios`.
*   Asegurar que la estructura del contenedor HTML cierre correctamente tras la extracción.

## 3. Procedimiento Estándar (SOP)
1.  Target: `app/(dashboard)/preview/PreviewClient.tsx`
2.  Localizar el `<Link href="/perfil">` en la sección de footer (alrededor de la línea 492).
3.  Extirpar el nodo React sin mutar dependencias o imports por ahora (al ser Next.js/Lucide, el linter o TS resolverán los imports no usados si existen o si no afectan el runtime).
4.  Confirmar telemetría.

## 4. Herramientas y Comandos Autorizados
*   `default_api:replace_file_content`: Para eliminación en bloque de líneas.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-31 | (N/A) | Botón "Volver al perfil" purgado con éxito. |
