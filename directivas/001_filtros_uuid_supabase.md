# [ID-DIRECTIVA]: FILTRADO RESTRICTIVO POR UUID EN SUPABASE
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-09
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar que todas las consultas y mutaciones inter-tablas en Supabase (`citas`, `ventas_productos`, `productos`, `gastos`, `servicios`, `facturas`) utilicen identificadores únicos inmutables (`barberia_id` / UUIDs) en lugar de cadenas de nombre o IDs genéricos volátiles.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **PROHIBIDO** utilizar columnas `barberia`, `user_id` o `perfil_id` para vincular datos a la barbería en las tablas mencionadas.
*   **OBLIGATORIO** utilizar siempre `barberia_id`.
*   En funciones Server-Side que reciben identificadores desde rutas dinámicas (slugs), el slug debe resolverse primero a su UUID (`id` del perfil) antes de escanear la base de datos de negocio.

## 3. Procedimiento Estándar (SOP)
1. Extraer el perfil del usuario autenticado o recuperar `shopData.id` a través de RSC/Middleware.
2. Inyectar `user.id` o el `UUID` heredado a cualquier consulta de métricas (Trends, Billing, Cortes).
3. Asegurarse que todos los parámetros de Server Actions esperen `shopId: string` y *no* el nombre de la tienda.

## 4. Herramientas y Comandos Autorizados
*   `grep_search`: Para localizar ".eq('barberia'" en el código fuente.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-09 | Pérdida de integridad referencial al consultar citas y ventas por nombre literal de la barbería (propensa a múltiples colisiones). | Refactorización de hooks (useTrends, useBarberStats) y Server Actions (staff.ts, admin-billing.ts) para requerir y usar exclusivamente `barberia_id`. |
