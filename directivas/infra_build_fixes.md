# INFRA-001: GESTIÓN DE FALLOS DE BUILD Y DESPLIEGUE
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-29
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar que el pipeline de CI/CD sea determinista, identificando y mitigando errores de compilación comunes en el ecosistema Next.js/TypeScript.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Prohibido dejar archivos .tsx vacíos**: Todo archivo de página debe exportar un componente por defecto.
*   **Validación Local Obligatoria**: Antes de dar por cerrada una incidencia de build, verificar errores de tipado o módulos.

## 3. Procedimiento Estándar (SOP)
1.  **Identificación**: Localizar el archivo responsable del fallo en los logs de despliegue.
2.  **Diagnóstico Módulo**: Verificar si el archivo tiene exportaciones o importaciones (TS lo ignora si no las tiene).
3.  **Restauración**: Proveer una exportación por defecto válida.
4.  **Bitácora**: Registrar el patrón del error para evitar recurrencias.

## 4. Herramientas y Comandos Autorizados
*   `npm run build`: Comando maestro de validación.
*   `tsc --noEmit`: Validación de tipos sin generar archivos.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-29 | File 'app/(dashboard)/inicio/page.tsx' is not a module. | El archivo estaba vacío (0 bytes). Se añadió un componente React con `export default`. |
