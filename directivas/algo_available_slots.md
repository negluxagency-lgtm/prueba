# ALGO_AVAILABLE_SLOTS: Algoritmo de Cálculo de Horas Disponibles

> **Estado:** 🟢 ACTIVA
> **Última Actualización:** 2026-02-10
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar un algoritmo determinista y preciso para calcular las horas disponibles (`getAvailableSlots`) en el sistema de reservas, soportando:
- Horarios individuales de barberos (JSONB con turnos partidos)
- Selección de barbero específico vs "Cualquiera"
- Detección de colisiones por solapamiento de rangos temporales
- Filtrado de horas pasadas (mismo día)

## 2. Restricciones Críticas (Protocolo de Seguridad)

### 2.1 Fuente de la Verdad
**NUNCA** usar `perfiles.horario_semanal` para calcular disponibilidad de barberos.
**SIEMPRE** consultar `barberos.horario_semanal` (tabla de empleados).

### 2.2 Estructura de Datos
- **Barberos**: `horario_semanal` es JSONB tipo `WeeklySchedule` donde cada día (`lunes`, `martes`, etc.) contiene array de `TimeRange[]`: `[{desde: "09:00", hasta: "14:00"}, {desde: "16:00", hasta: "20:00"}]`
- **Citas**: Columnas `Dia` (YYYY-MM-DD), `Hora` (HH:MM), `barbero` (UUID), `duracion` (minutos - opcional)

### 2.3 Lógica de Disponibilidad
- **Barbero Específico**: Slot inválido si choca con cita del mismo barbero
- **"Cualquiera" (null)**: Slot válido si **AL MENOS UN** barbero está libre a esa hora
  - Ejemplo: Si Pepe tiene cita 10:00 pero Juan está libre, mostrar 10:00

### 2.4 Detección de Colisiones
- **NO** usar igualdad exacta de hora (`app.Hora === slotTime`)
- **SÍ** verificar solapamiento de rangos: `[slotStart, slotStart + serviceDuration]` choca con `[appointmentStart, appointmentStart + appointmentDuration]`
- Si `duracion` no existe en cita, asumir `serviceDuration` por defecto

## 3. Procedimiento Estándar (SOP)

### Paso 1: Identificar Barberos Relevantes
```typescript
if (selectedBarberId) {
  query.eq('id', selectedBarberId)
}
// Filtrar solo barberos activos
query.eq('activo', true) // Columna booleana (verificar si existe)
```

### Paso 2: Obtener Citas Existentes
```sql
SELECT Hora, barbero, duracion 
FROM citas 
WHERE barberia_id = ? 
  AND Dia = ? 
  AND barbero IN (lista_barberos_relevantes)
  AND cancelada = false -- Ignorar canceladas
```

### Paso 3: Generar Grid de Slots (por Barbero)
Para cada barbero:
1. Extraer `dayKey` del `date` (ej: 'lunes')
2. Obtener `barber.horario_semanal[dayKey]` → array de rangos
3. Iterar sobre cada rango `{desde, hasta}`:
   - Generar slots cada `serviceDuration` minutos
   - Validar que `slotStart + serviceDuration <= rangoHasta`

### Paso 4: Filtrar por Colisiones
```typescript
// Convertir hora "HH:MM" a minutos del día para comparar
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const hasCollision = (slotStart: string, appointments: any[]) => {
  const slotStartMin = toMinutes(slotStart)
  const slotEndMin = slotStartMin + serviceDuration
  
  return appointments.some(app => {
    const appStartMin = toMinutes(app.Hora)
    const appDuration = app.duracion || serviceDuration
    const appEndMin = appStartMin + appDuration
    
    // Overlap: slotStart < appEnd AND slotEnd > appStart
    return slotStartMin < appEndMin && slotEndMin > appStartMin
  })
}
```

### Paso 5: Unificación (Modo "Cualquiera")
- Crear `Map<slotTime, Set<barberId>>` de slots libres por barbero
- Incluir en resultado si `Set.size > 0`

### Paso 6: Filtrado Fecha Pasada
Si `date` es hoy:
```typescript
const now = new Date()
const currentMinutes = now.getHours() * 60 + now.getMinutes()
return slots.filter(s => toMinutes(s) > currentMinutes)
```

## 4. Herramientas y Comandos Autorizados
- **Supabase Client**: `createClient()` cookie-based
- **date-fns**: `format`, `parse`, `isSameDay`, `isBefore`
- **TypeScript**: Strict typings con `WeeklySchedule`, `TimeRange`

## 5. Casos Edge y Validaciones

| Escenario | Comportamiento Esperado |
| :--- | :--- |
| Barbero sin horario ese día | Retornar `[]` (no contribuir slots) |
| Todos barberos ocupados a una hora | No incluir ese slot |
| Cita sin duración | Asumir `serviceDuration` |
| Slot parcial (solo cabe 20min pero servicio dura 30) | **NO** incluir |
| Fecha pasada completa | Retornar `[]` |

## 6. Bitácora de Anomalías (Aprendizaje Continuo)

| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-10 | Implementación previa usaba igualdad exacta `app.Hora === slotTime`, ignorando duraciones. **Falso positivo:** Si cita duraba 30min y nuevo slot empezaba 15min después, no detectaba colisión | Implementar overlap detection con `toMinutes()` helper y comparación de rangos |
| 2026-02-10 | Lógica "Cualquiera" colectaba slots de todos barberos sin validar si al menos uno está libre. Si todos ocupados, mostraba hora igual | Cambiar a `Map<slotTime, freeBarberIds>` y filtrar donde `size > 0` |
| 2026-02-10 | No se validaba campo `activo` en barberos. Barberos inactivos/eliminados aparecían en cálculo | Agregar `.eq('activo', true)` (si existe columna, sino ignorar) |
| 2026-02-10 | **Usuario reporta "no hay horarios disponibles":** `horario_semanal` guardado en formato ARRAY `[{dia: 0, activo: boolean, turnos: [{inicio, fin}]}]` pero código esperaba OBJECT `{lunes: [{desde, hasta}]}`. No se encontraban rangos porque `schedule['martes']` era `undefined` | Agregar detección de formato con `Array.isArray()`. Si ARRAY, buscar `find(d => d.dia === dayOfWeek)` y mapear `turnos` con `{inicio, fin}` → `{desde, hasta}` |
