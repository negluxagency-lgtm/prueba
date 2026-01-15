# [AUDIT-N8N]: Protocolo de Auditoría de Workflows n8n
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-14
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Analizar archivos JSON de workflows de n8n para identificar vulnerabilidades lógicas, problemas de mantenibilidad, condiciones de carrera y deuda técnica.

## 2. Restricciones Críticas
*   **No modificar el JSON original** sin autorización explícita.
*   **Análisis Estático:** La auditoría se basa en la lectura del código, no en la ejecución (salvo entornos de prueba).
*   **Privacidad:** Verificar que no se expongan credenciales hardcodeadas (aunque n8n suele usar IDs, revisar `value` en texto plano).

## 3. Procedimiento Estándar (SOP)
1.  **Ingesta:** Leer el archivo JSON completo.
2.  **Mapeo de Nodos:** Identificar nodos críticos (AI, Bases de Datos, Lógica Code/Switch).
3.  **Detección de Patrones:**
    *   *Hardcoding:* Buscar valores fijos (Teléfonos, Emails, Fechas).
    *   *Complejidad Ciclomática:* Buscar repeticiones de nodos `If`/`Switch` que podrían ser bucles.
    *   *Race Conditions:* Buscar lecturas seguidas de escrituras sin bloqueo.
    *   *Manejo de Errores:* Verificar existencia de rutas de error.
4.  **Reporte:** Generar un informe con hallazgos y recomendaciones.

## 4. Checklist de Mejora
*   [ ] Reducción de nodos redundantes (DRY).
*   [ ] Uso de librerías de fecha (Luxon/Moment) en lugar de parsing manual.
*   [ ] Parametrización de variables globales.
*   [ ] Implementación de manejo de errores (Error Trigger).
*   [ ] Lógica Avanzada de Capacidad (Grupos 4-6 y >6).

## 5. Bitácora de Anomalías
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-14 | Creación inicial | N/A |
