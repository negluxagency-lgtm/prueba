# AUDIT-001: AUDITORÍA 360º NELUX (PROTOCOL NEXT.JS 15)
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-23
> **Responsable:** Antigravity Tech Lead

## 1. Objetivo Primario
Realizar una auditoría técnica profunda de Nelux para asegurar estabilidad en Next.js 15, seguridad en Server Actions/RLS y eficiencia en base de datos.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **AWAIT DYNAMICS:** En Next.js 15, `cookies()`, `headers()` y `params` son asíncronos. Todo uso debe ser awaited.
*   **SERVER ACTIONS:** Cada acción debe verificar la sesión vía `supabase.auth.getUser()`.
*   **RLS:** La seguridad debe residir en la base de datos, no solo en la App Layer.
*   **NO DESTRUCTIVE:** No aplicar cambios masivos sin aprobación del plan.

## 3. Procedimiento Estándar (SOP)
1.  **Escaneo Estático:** Buscar fugas de `await` en APIs dinámicas.
2.  **Auditoría de Acciones:** Mapear `src/app/actions` y verificar guards de autenticación.
3.  **Simulación Browser:** Ejecutar `e2e` manual para registro y auth.
4.  **Optimización DB:** Identificar selectores anidados o waterfalls de Promesas.

## 4. Herramientas y Comandos Autorizados
*   `grep_search`: Localización de patrones de código.
*   `read_browser_page`: Verificación de flujo UX/Auth.
*   `view_file`: Análisis de lógica.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-23 | Inicio de Auditoría | - |
| 2026-01-23 | Error Playwright: $HOME not set | No se pudo realizar la Verificación en Vivo (Browser). Auditoría pivotada a Análisis Estático. |
