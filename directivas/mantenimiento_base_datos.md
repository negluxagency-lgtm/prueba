# Protocolo de Mantenimiento de Base de Datos y Resiliencia

**Estado:** ACTIVA
**Última Actualización:** 2026-01-17
**Prioridad:** ALTA

---

## 1. Misión
Establecer protocolos para manejar errores de base de datos comunes, específicamente desincronización de secuencias (primary keys) y consistencia de datos en operaciones críticas (ventas, stock).

## 2. Restricciones (Las 3 Leyes)
1.  **Resiliencia Automática:** El código debe intentar recuperarse automáticamente de errores transitorios o de secuencia (ej: `duplicate key value`) antes de fallar.
2.  **Integridad de Datos:** Nunca registrar una venta si no se puede garantizar la actualización del stock (Atomicidad simulada si no hay transacciones nativas disponibles).
3.  **Logs Claros:** Todo error de DB debe ser logueado con detalles (Código de error, Tabla afectada).

## 3. Arquitectura / Protocolo

### 3.1 Manejo de "Duplicate Key" (Secuencias Rotas)
Cuando se inserta en tablas con IDs autogenerados (Postgres Serial/Identity), es posible que la secuencia se desincronice si hubo inserciones manuales.
**Solución:** Implementar un mecanismo de "Retry" (Reintento).
- Al capturar error code `23505` (unique_violation), reintentar la operación hasta 3 veces.
- Postgres incrementará la secuencia en cada fallo, eventualmente encontrando un hueco libre.

### 3.2 Snippet de Resiliencia (TypeScript)
```typescript
const insertWithRetry = async (table: string, data: any, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const { error } = await supabase.from(table).insert(data);
        if (!error) return { success: true };
        if (error.code === '23505' && i < retries - 1) continue; // Retry on duplicate key
        throw error;
    }
};
```

## 4. Bitácora de Anomalías
*   **2026-01-17:** Detectado error `duplicate key value violates unique constraint "citas_pkey"` en módulo de Ventas.
    *   **Causa:** Inserción en tabla `citas` falló porque la secuencia `id` estaba atrasada respecto a los registros existentes.
    *   **Solución:** Se implementó lógica de reintento en `app/productos/page.tsx` para forzar el avance de la secuencia.
