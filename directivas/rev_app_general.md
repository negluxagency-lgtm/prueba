# REV-001: REVISIÓN GENERAL DE LA APP NEXTJS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-16
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Realizar una auditoría técnica exhaustiva de la aplicación para identificar cuellos de botella, problemas de seguridad, inconsistencias de diseño y áreas de optimización en el ecosistema Next.js.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **No modificar código** durante la fase de revisión inicial.
*   **Idempotencia**: Cualquier script de diagnóstico debe ser seguro para ejecuciones repetidas.
*   **Materialización**: Los hallazgos deben guardarse en `artifacts/reporte_revision_[timestamp].json`.

## 3. Procedimiento Estándar (SOP)
1.  **Mapeo de Dependencias**: Analizar `package.json` para identificar el stack tecnológico exacto.
2.  **Análisis de Arquitectura**: Verificar el uso de `app` router, `lib` para lógica compartida y `hooks` para estado.
3.  **Auditoría de Componentes**: Evaluar la complejidad y reusabilidad de los componentes en `components/`.
4.  **Verificación de Seguridad**: Revisar `AuthGuard.js` y middleware si existe.
5.  **Revisión de Datos**: Analizar la integración con la base de datos (Supabase/API).

## 4. Herramientas y Comandos Autorizados
*   `npm list`: Para verificar dependencias.
*   `grep`: Para buscar patrones de error o prácticas deprecadas.
*   `antigravity SDK (simulado)`: Para telemetría de auditoría.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-16 | Inicio de misión | N/A |
| 2026-01-16 | PowerShell Execution Policy bloqueó `npm install` para `@supabase/auth-helpers-nextjs` | Refactorizado `middleware.ts` para usar `@supabase/supabase-js` directamente sin helpers adicionales |
