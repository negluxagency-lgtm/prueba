# Directiva: Recuperación del Dashboard de Inicio

## Contexto
El usuario experimentó una pérdida de datos en el archivo `app/(dashboard)/inicio/page.tsx`. Se requiere restaurar la funcionalidad completa que incluye:
- Cajas de estadísticas de rendimiento.
- Tabla de agenda (citas diarias).
- Tabla de venta de productos.
- Integración con gestión de caja (CashRegisterManager).
- Modales de facturación y edición.

## Bitácora de Anomalías
- **2026-03-29**: El archivo `page.tsx` fue reducido de ~400 líneas a 2 líneas accidentalmente (posible error de edición del usuario o bug del agente anterior).

## Restricciones
- Usar siempre `getLocalISOString()` para el manejo de fechas para evitar desfases UTC.
- Mantener la estética premium con `zinc-900`, `amber-500` y tipografía moderna.
- Asegurar que todos los componentes importados existen en `components/dashboard/`.

## Instrucciones de Restauración
1. Recuperar el contenido del commit `ddb88bce4e986a8f9ddfb851436788a19daa9590` (Version 2.1.1).
2. Verificar que los componentes `AppointmentTable`, `ProductSalesTable`, `MonthlyGoalsChart`, `ObjectiveRings` y `CashRegisterManager` estén presentes.
3. Restaurar los hooks de SWR y la lógica de tiempo real (Supabase Realtime).
