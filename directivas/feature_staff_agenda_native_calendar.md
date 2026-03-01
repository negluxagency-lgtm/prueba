# STAFF-001: AGENDA NATIVE CALENDAR
> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-28
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Reemplazar el selector de fecha personalizado en la vista de agenda del personal (`/staff`) por el selector de fecha nativo del sistema (`<input type="date">`) para mejorar la compatibilidad y la experiencia del usuario, manteniendo una estética premium.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia:** El cambio no debe romper la lógica de filtrado de citas existente.
*   **Estética:** No usar estilos por defecto del navegador que se vean "baratos". Aplicar CSS para que el input nativo se integre con la interfaz oscura/premium.
*   **Funcionalidad:** Mantener el estado de la fecha seleccionada (`selectedDate`) sincronizado con las consultas a Supabase.

## 3. Procedimiento Estándar (SOP)
1.  Identificar el componente de agenda en `app/[slug]/staff/page.tsx` o subcomponentes.
2.  Localizar la variable de estado que controla la fecha.
3.  Sustituir el componente de calendario custom por un `<input type="date">`.
4.  Vincular el `value` y `onChange` del nuevo input al estado existente.
5.  Aplicar estilos CSS personalizados para ocultar el icono por defecto o estilizar el contenedor siguiendo la línea de diseño Nelux.

## 4. Herramientas y Comandos Autorizados
*   `multi_replace_file_content`: Para modificar el componente React.
*   `view_file`: Para análisis de código.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-28 | N/A | Inicialización de la directiva. |
| 2026-02-28 | El input invisible no abría el selector en PC | Uso de `showPicker()` con Ref para disparo manual. |
