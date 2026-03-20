# FEATURE-BACKEND-METRICS: SINCRO AUTOMÁTICA DE KPIS
> **Estado:** PROPUESTO
> **Última Actualización:** 2026-03-19
> **Responsable:** Antigravity Senior Deployment Engineer

## 1. Objetivo
Migrar la lógica de cálculo financiero y operativo del frontend (Next.js) al backend (Supabase) mediante tablas de agregación automática para mejorar el rendimiento y la consistencia de los datos en `/inicio` y `/trends`.

## 2. Definición de Métricas

### A. Metricas Diarias (`metricas_diarias`)
| Columna | Origen de Datos |
| :--- | :--- |
| `ingresos` | `SUM(citas.Precio WHERE confirmada) + SUM(ventas_productos.precio)` |
| `cortes` | `COUNT(citas WHERE confirmada)` |
| `productos` | `SUM(ventas_productos.cantidad)` |
| `citas` | `COUNT(citas WHERE confirmada=false AND cancelada=false) + cortes` |
| `caja_esperada` | `SUM(citas.Precio WHERE NOT cancelada) + SUM(ventas_productos.precio)` |
| `caja_real` | `SUM(citas.Precio WHERE confirmada) + SUM(ventas_productos.precio)` |

### B. Metricas Mensuales/Anuales
Agregación de `metricas_diarias` con el añadido de:
*   **Ticket Medio**: `Ingresos Totales / (Cortes + Transacciones Productos)`.
*   **No-Shows**: `COUNT(citas WHERE cancelada=true)`.

## 3. Arquitectura Técnica
*   **Tablas Físicas**: Para consultas ultra-rápidas en el Dashboard.
*   **Triggers**: Activados por cualquier cambio en `citas` o `ventas_productos`.
*   **Funcion de Re-entry**: `fn_recalcular_metricas(barberia_id, fecha)` para asegurar idempotencia.

## 4. Bitácora de Anomalías
| Fecha | Evento | Acción |
| :--- | :--- | :--- |
| 2026-03-19 | Inicialización de migración | Definición de lógica basada en hooks frontend |
| 2026-03-19 | Error 42P10 (ON CONFLICT) | Se añadieron ALTER TABLE para forzar la PK en tablas existentes |
