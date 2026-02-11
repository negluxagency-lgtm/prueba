# [FEATURE-001]: COLUMNA SERVICIO EN AGENDA
> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-09
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Añadir una columna "Servicio" a la tabla de agenda en `/inicio` para visualizar el tipo de servicio de cada cita, correspondiendo a la columna `servicio` de la base de datos Supabase.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia Visual:** La columna debe mantenerse consistente con el diseño existente (tipografía, espaciado, colores).
*   **Gestión de Nulos:** Si el campo `servicio` está vacío o es nulo, debe manejarse adecuadamente (e.g., mostrar "--" o vacío, pero no romper).
*   **No Regresión:** No afectar la funcionalidad de las otras columnas (Cliente, WhatsApp, Estado, Hora, Precio, Acciones).
*   **Responsive:** Verificar comportamiento en móviles (posiblemente ocultar o adaptar si falta espacio, aunque la petición no lo especifica, se asume best-effort para mobile).

## 3. Procedimiento Estándar (SOP)
1.  Modificar `components/dashboard/AppointmentTable.tsx`.
2.  Añadir `<th>` con título "SERVICIO" en el `thead`.
3.  Añadir `<td>` con el valor `cita.servicio` en el `tbody`.
4.  Ajustar colspans si es necesario (ej: "Sin citas hoy").

## 4. Herramientas y Comandos Autorizados
*   `view_file`: Para leer componentes.
*   `replace_file_content`: Para inyectar el código de la columna.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| | | |
