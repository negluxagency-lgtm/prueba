# FEATURE-GESTION-CADENAS: MODALIDAD MULTI-SUCURSAL
> **Estado:** EN_PRUEBA
> **Última Actualización:** 2026-03-19
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Permitir a los propietarios de múltiples barberías (Cadenas) tener una visión global de su negocio, comparando métricas de rendimiento (ingresos y cortes) entre sucursales y gestionando datos específicos de cada centro.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Detección de Rol**: Se utiliza la columna `cadena` (booleano) en la tabla `perfiles`.
*   **Visibilidad de Datos**: Solo se deben mostrar barberías cuyos IDs estén listados en el JSONB `barberias_cadena_id`.
*   **IU Excluyente**: En el Dashboard (`/inicio`), si el usuario es cadena, **NO** se deben mostrar las tablas de agenda ni de productos individuales por razones de escalabilidad y enfoque directivo.
*   **Estética Recharts**: Los gráficos deben usar la paleta: Naranja (#f59e0b) para actual, Verde (#10b981) para objetivos de ingresos y Azul (#3b82f6) para objetivos de cortes. Sin outlines de enfoque.

## 3. Procedimiento Estándar (SOP)
1.  **Validación de Perfil**: Consultar `cadena` y `barberias_cadena_id` al cargar cualquier página del dashboard.
2.  **Renderizado Condicional**: Usar el componente `CadenaStatsChart` en el home si `isCadena` es true.
3.  **Filtrado en Contabilidad**: (En progreso) Implementar selector de sucursal para filtrar los registros de las tablas vinculadas.

## 4. Herramientas y Comandos Autorizados
*   `Recharts`: Para visualización comparativa de sucursales.
*   `JSONB`: Manejo de arrays de IDs de sucursales en Supabase.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-19 | Outline blanco al clicar en barras de Recharts | Añadir `focus:outline-none` y `style={{ outline: 'none' }}` a los componentes del gráfico. |
| 2026-03-19 | Caracteres de escape en `tickFormatter` de Recharts | Corregir sintaxis de template literals en el componente React. |
