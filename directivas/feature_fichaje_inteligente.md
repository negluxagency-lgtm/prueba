# [ID-DIRECTIVA]: FEATURE_FICHAJE_INTELIGENTE
> **Estado:** [ACTIVA]
> **Última Actualización:** 2026-02-28
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar un sistema de Control de Presencia y Fichajes inmutable para la plantilla, permitiendo el registro de jornadas (entrada, pausas, salida) cumpliendo con la normativa española de inspección de trabajo.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Timestamp Inmutable:** NEVER trust the client clock. Todos los timestamps (`timestamp_servidor`) deben generarse en el servidor o mediante `now()` de PostgreSQL.
*   **Geolocalización Supeditada:** El fichaje no debe bloquearse si el navegador deniega el GPS (fallback a null), pero el Admin debe poder ver la ausencia de datos geográficos.
*   **Auditoría Estricta:** Las ediciones de logs antiguos SIEMPRE requieren crear una **nueva fila** `fichajes_logs` y rellenar obligatoriamente los campos `editado_por` y `motivo_edicion`. NUNCA usar `UPDATE` en registros vitales.
*   **Persistencia de UI:** La UI de `/staff` siempre consultará primero el último log asíncronamente para saber qué botón habilitar (Entrada, Pausa, Salida), evitando conjeturas por JS.

## 3. Procedimiento Estándar (SOP)
1.  **Frontend (/staff)**
    *   Sustituir control manual de horas extras por UI de Fichar.
    *   Hacer polling o fetch del estado inicial al cargar el dashboard.
    *   Capturar GPS (si hay permiso) al pulsar los botones.
2.  **Backend (actions/attendance.ts)**
    *   Validar roles/sesión.
    *   Insertar logs en transacciones atómicas.
    *   Recalcular "horas trabajadas" filtrando franjas `pausa_inicio`..`pausa_fin`.
3.  **Administrador (/contabilidad o /settings)**
    *   Agrupar nóminas/jornadas por mes y empleado.
    *   Permitir auditoría/rectificación con firma digital o registro de UUID.
    *   Exportar informe a PDF oficial (jsPDF).

## 4. Herramientas y Comandos Autorizados
*   `jsPDF` y `jspdf-autotable`: Para generación de reportes laborales mensuales.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-28 | N/A | Implementación Inicial |
