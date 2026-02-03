# SEC-001: RATE LIMITING EN RESERVAS PÚBLICAS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-03
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Prevenir abuso en el sistema de reservas públicas (guest booking) mediante rate limiting basado en triggers de base de datos que limitan a **5 citas por hora por IP**.

## 2. Restricciones Críticas (Protocolo de Seguridad)

### 2.1 Captura de IP en Server Actions
* **OBLIGATORIO**: Toda Server Action que inserte en la tabla `citas` DEBE capturar la IP del cliente usando:
  ```typescript
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1'
  ```

### 2.2 Payload de Insert
* **CRÍTICO**: El campo `ip_address` DEBE incluirse en el payload del insert:
  ```typescript
  await supabase.from('citas').insert({
    // ... otros campos
    ip_address: ip  // 🔒 OBLIGATORIO para que el trigger funcione
  })
  ```

### 2.3 No Duplicar Validación
* **PROHIBIDO**: NO implementar rate limiting manual en el código de la aplicación.
* **RAZÓN**: El trigger de DB es la fuente única de verdad. Duplicarlo genera:
  - Inconsistencias de límites
  - Complejidad innecesaria
  - Posibles race conditions

### 2.4 Manejo de Errores del Trigger
* El trigger de Supabase lanza un error cuando se excede el límite.
* **OBLIGATORIO**: Capturar este error específicamente y retornar mensaje user-friendly:
  ```typescript
  if (insertError) {
    if (insertError.message?.includes('Límite de citas excedido') || 
        insertError.message?.includes('rate_limit')) {
      return { 
        success: false, 
        error: 'Has superado el límite de reservas por hora. Por favor, inténtalo más tarde.' 
      }
    }
    // Error genérico para otros casos
    return { success: false, error: 'No se pudo completar la reserva.' }
  }
  ```

## 3. Procedimiento Estándar (SOP)

### Al crear nueva Server Action para reservas:
1. Importar `headers` de `next/headers`
2. Capturar IP según el patrón 2.1
3. Incluir `ip_address: ip` en el payload de insert
4. Implementar manejo de error del trigger según 2.4
5. NO agregar validación manual de rate limiting

### Al modificar acciones existentes:
1. Verificar que la IP se capture correctamente
2. Verificar que `ip_address` se envíe en el insert
3. Remover validaciones manuales redundantes
4. Actualizar manejo de errores para el trigger

## 4. Herramientas y Comandos Autorizados

### Server Action de Referencia
* **Archivo**: `app/actions/book-guest-appointment.ts`
* **Uso**: Implementación canónica del rate limiting mediante trigger

### Trigger de Base de Datos
* **Nombre**: `check_booking_rate_limit` (presumiblemente)
* **Tabla**: `citas`
* **Límite**: 5 inserts por hora por IP
* **Mensaje de error**: "Límite de citas excedido..."

## 5. Bitácora de Anomalías (Aprendizaje Continuo)

| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-03 | Validación manual de rate limit (3 citas/hora) redundante con trigger de DB (5 citas/hora) | Eliminada validación manual, delegada completamente al trigger de DB |
| 2026-02-03 | Mensaje de error genérico "Error Supabase: [message]" cuando el trigger bloquea | Agregado manejo específico para error del trigger con mensaje user-friendly |

## 6. Notas de Seguridad

### IP Spoofing
* Limitación conocida: El rate limiting por IP puede ser evadido usando VPNs/proxies
* Mitigación adicional recomendada: Considerar agregar CAPTCHA en frontend para usuarios que alcancen el límite

### Logging
* Todos los errores de insert se loguean en consola del servidor
* Considerar implementar logging centralizado para análisis de patrones de abuso

### Producción vs Desarrollo
* En desarrollo local, la IP será `127.0.0.1` para todos
* **IMPORTANTE**: Probar en staging/producción para verificar que `x-forwarded-for` se capture correctamente
