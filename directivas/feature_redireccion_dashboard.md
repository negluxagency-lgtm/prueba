# [ID-DIRECTIVA]: REDIRECCIÓN DE DASHBOARD A PERFIL
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-31
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Redirigir de manera determinista y permanente cualquier solicitud a la ruta `/dashboard` hacia la nueva vista unificada `/perfil`, garantizando que ningún usuario acceda a la versión obsoleta del panel central.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   La redirección debe implementarse al más alto nivel en la capa del router de Next.js (`next.config.ts`) para interceptar la llamada antes del renderizado cliente.
*   Debe emitir un HTTP `308 Permanent Redirect` para señalizar a los motores de búsqueda y cachés que la ruta ha cambiado definitivamente.

## 3. Procedimiento Estándar (SOP)
1.  Localizar el archivo `next.config.ts` o `next.config.mjs` en la raíz.
2.  Inyectar el método asíncrono `redirects()` dentro de la configuración de NextConfig.
    *   Definir `source: '/dashboard'`
    *   Definir `destination: '/perfil'`
    *   Establecer `permanent: true`
3.  Guardar y forzar reconstrucción.

## 4. Herramientas y Comandos Autorizados
*   `default_api:replace_file_content`: Para inyectar la configuración eficientemente en memoria e idempotenmente en disco.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-31 | (Ninguno - Despliegue inicial) | Cambio realizado con éxito en `next.config.ts`. |
