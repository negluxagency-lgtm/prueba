# FIX-001: CORRECCIÓN DUPLICACIÓN INGRESOS PRODUCTOS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-04-02
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Corregir la discrepancia en el cálculo de ingresos donde las ventas de productos se multiplican por la cantidad dos veces (en UI y en métricas de Base de Datos).

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Normalización de Datos:** La columna `precio` en la tabla `ventas_productos` DEBE representar siempre el **precio unitario** del producto en el momento de la venta.
*   **Integridad de Métricas:** No modificar los scripts SQL de métricas que ya utilizan `SUM(precio * cantidad)`, ya que esto rompería otras partes del sistema. La corrección debe ser en el origen del dato (Frontend/Action).

## 3. Procedimiento Estándar (SOP)
1.  En la interfaz de productos (`app/(dashboard)/productos/page.tsx`), capturar el precio unitario del producto seleccionado.
2.  Enviar dicho precio unitario a la Server Action `registerProductSale`.
3.  En la Server Action, registrar el total real (`precio * cantidad`) únicamente con fines de logging y telemetría, asegurando que la inserción en DB use el precio unitario.

## 4. Herramientas y Comandos Autorizados
*   `registerProductSale`: Server action para persistencia.
*   `logger.info`: Para validar el cálculo del total en servidores.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-04-02 | Ingresos triplicados en ventas multi-unidad. | Migración de envío de 'Total' a 'Unitario' desde el frontend. |
