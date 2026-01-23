# Directiva: Corrección de Conteo de Productos

## Contexto
En el sistema, las ventas de productos se registran como citas con `Servicio = 'Venta de Producto'`. 
Debido a una limitación en el esquema inicial, la **cantidad (unidades)** vendidas se almacena en el campo `Telefono` de la tabla `citas`.

## Anomalía Detectada
Los gráficos y métricas estaban contando el número de filas (o usando `+= 1`), lo que resultaba en un conteo incorrecto si una sola venta incluía múltiples unidades (ej. 1 venta de 3 productos se contaba como 1 unidad).

## Restricciones
- Al calcular `totalProducts` o similares, **SIEMPRE** sumar el campo `Telefono` si el servicio es `'Venta de Producto'`.
- El campo `Telefono` es de tipo `string` en el SDK/Interfaces, por lo que debe convertirse a `Number`.
- Si el campo `Telefono` está vacío o no es un número válido, por defecto considerar `0` o `1` según el contexto (generalmente `0` para sumas).

## Bitácora de Anomalías
- **[2026-01-23]**: Reportado por el usuario que `/trends` y `/dashboard` solo cuentan 1 unidad por venta.
- **[2026-01-23]**: Identificado que `productos/page.tsx` guarda la cantidad en el campo `Telefono`.
