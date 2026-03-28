# FEATURE-INFRAESTRUCTURA-DB: GESTIÓN DE TRIGGERS Y FUNCIONES
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-28
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar la integridad y consistencia de los datos en Supabase mediante automatizaciones a nivel de base de datos (Triggers/Functions), evitando discrepancias entre el estado del usuario y su plan contratado.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia**: Usar siempre `CREATE OR REPLACE FUNCTION`.
*   **Seguridad**: Las funciones deben definirse con `SECURITY DEFINER` solo si es estrictamente necesario; preferir `SECURITY INVOKER`.
*   **Nomenclatura**: Prefijo `fn_` para funciones y `tr_` para triggers.
*   **Auditoría**: Cualquier cambio en el esquema debe quedar registrado en la bitácora de anomalías.

## 3. Procedimiento Estándar (SOP)
1.  **Draft**: Escribir el SQL en un archivo temporal en `src/sql/`.
2.  **Validación**: Revisar sintaxis para PostgreSQL 15+.
3.  **Materialización**: Guardar el script final en `artifacts/sql/`.

## 4. Herramientas y Comandos Autorizados
*   `psql` / Supabase SQL Editor: Para la ejecución de scripts.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-28 | Desincronización entre `estado` y `plan` | Creación de trigger `tr_sync_perfil_plan_prueba` para forzar plan="prueba" cuando estado="prueba". |
