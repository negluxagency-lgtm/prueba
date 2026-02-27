# [ID-DIRECTIVA]: FEATURE_SALARIOS_HORAS_EXTRA
> **Estado:** [ACTIVA]
> **Última Actualización:** 2026-02-26
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar una calculadora avanzada de salarios y horas extra para los barberos. Esta calculadora reemplaza el sistema simple de porcentaje de comisiones.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   Debe soportar base salarial + porcentaje de comisiones + precio por hora extra.
*   Las horas extra se guardan en la tabla `horas_extra` para mantener un registro histórico inmutable (el precio por hora extra se guarda en el momento de la inserción).
*   No romper la vista actual de estadísticas si no hay datos de salario configurados.

## 3. Procedimiento Estándar (SOP)
1.  Verificar los tipos de Supabase y el esquema de la tabla `horas_extra`.
2.  Añadir campos de `salario_base` y `porcentaje_comision` al perfil del barbero (o verificar si ya existen).
3.  Implementar la interfaz de usuario en la sección de estadísticas o ajustes del barbero.
4.  Conectar las acciones para crear registros en `horas_extra`.

## 4. Herramientas y Comandos Autorizados
*   Supabase JS Client para consultas.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-27 | Input uncontrolled to controlled | Asegurar valores por defecto en `getRow` y fallbacks `|| ''` en los inputs del modal. |
