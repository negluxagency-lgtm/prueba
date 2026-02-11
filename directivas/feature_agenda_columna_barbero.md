# FEATURE-BARBERO-001: Columna Barbero Condicional en Agenda

> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-10
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Renderizar condicionalmente una columna "Barbero" en la tabla de citas del Dashboard según el plan de suscripción del usuario (`perfiles.plan`). Solo usuarios con `plan === 'Premium'` (con P mayúscula) verán la columna adicional con datos de `citas.barbero`.

## 2. Restricciones Críticas (Protocolo de Seguridad)
* **NO modificar lógica de negocio existente**: Solo agregar renderizado condicional.
* **Fetch del plan debe ser seguro**: Usar `supabase.auth.getUser()` + consulta a `perfiles` con RLS.
* **Campo `barbero` puede ser NULL**: Mostrar texto de fallback "Sin asignar" o "Cualquiera".
* **Mantener coherencia visual**: La columna debe seguir los estilos existentes de Tailwind.

## 3. Procedimiento Estándar (SOP)
1. **Actualizar interface `Appointment`** en `types/index.ts` para incluir campo opcional `barbero?: string`.
2. **Modificar `useAppointments` hook**:
   * Añadir estado `userPlan` (string).
   * En `getCitas()`, fetch del plan desde `perfiles` table.
   * Incluir campo `barbero` en el SELECT de citas.
   * Retornar `userPlan` desde el hook.
3. **Actualizar `AppointmentTable.tsx`**:
   * Recibir prop `userPlan?: string`.
   * Renderizar `<th>Barbero</th>` solo si `userPlan === 'Premium'` (case-sensitive).
   * Renderizar `<td>` con `cita.barbero || "Sin asignar"` dentro del map de filas.
   * Ajustar `colSpan` del "Sin citas hoy" dinámicamente (7 base, 8 si Premium).
4. **Actualizar `page.tsx`**:
   * Desestructurar `userPlan` del hook `useAppointments`.
   * Pasar prop `userPlan={userPlan}` al componente `AppointmentTable`.

## 4. Herramientas y Comandos Autorizados
* **Supabase Client**: `supabase.from('perfiles').select('plan').eq('id', user.id).single()`
* **TypeScript**: Interfaces opcionales con `?:`
* **Tailwind CSS**: Clases existentes en la tabla (`px-3 py-1 md:px-8 md:py-6`)

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-10 | N/A | Directiva creada |
| 2026-02-10 | Comparación case-sensitive: plan en Supabase usa 'Premium' con P mayúscula | Cambio de `userPlan === 'premium'` a `userPlan === 'Premium'` |
