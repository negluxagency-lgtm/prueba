# FEATURE-CONTABILIDAD: GESTIÓN DE GASTOS Y FACTURAS
> **Estado:** EN_PRUEBA
> **Última Actualización:** 2026-02-27
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Centralizar la gestión financiera del negocio en una nueva sección `/contabilidad`, permitiendo el registro de gastos, carga de facturas y acceso a herramientas de liquidación de personal.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia**: Todas las consultas a Supabase deben manejar errores de red.
*   **Seguridad RLS**: Las tablas `gastos` y `facturas` deben filtrar por `barberia_id` vinculado al `auth.uid()`.
*   **Felicidad del Usuario**: La transición de botones desde `/trends` debe ser fluida, sin romper la funcionalidad de los modales.

## 3. Procedimiento Estándar (SOP)
1.  **Migración de Datos**: Ejecutar el esquema SQL para `gastos` y `facturas`.
2.  **Nueva Página**: Implementar `/contabilidad` con diseño premium.
3.  **Refactorización**: Retirar botones de liquidación de `/trends`.
4.  **Integración**: Asegurar que `SalaryCalculatorModal` y `QuickOvertimeModal` funcionen correctamente en su nueva ubicación.

## 4. Herramientas y Comandos Autorizados
*   `Supabase-JS`: Para persistencia de gastos.
*   `Lucide-React`: Para iconografía financiera (`Receipt`, `TrendingDown`, `FileText`).

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-27 | Inexistencia de tablas de gastos | Se propone creación de esquema SQL |
