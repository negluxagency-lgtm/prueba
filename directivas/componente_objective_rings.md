# COMP-001: COMPONENTE OBJECTIVE RINGS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-16
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Definir los estándares de implementación del componente visual `ObjectiveRings.tsx` inspirado en Apple Watch para el dashboard del SaaS de barberías.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Librería Gráfica:** Exclusivo uso de `recharts` (`RadialBarChart`).
*   **Estilo:** Tailwind CSS para diseño y layout.
*   **Colores:**
    *   Ingresos: Rojo/Rosa vibrante (`#FF3B30` o similar).
    *   Cortes: Azul Neón (`#007AFF` o similar).
    *   Productos: Verde Lima (`#34C759` o similar).
*   **Estructura:** Debe ser un componente funcional con props tipadas `{ actual: number, objetivo: number, label: string }`.
*   **Responsividad:** El componente debe ser escalable dentro de contenedores de dashboard.

## 3. Procedimiento Estándar (SOP)
1.  **Modelado de Datos:** Transformar props en formato compatible con `RadialBarChart`.
2.  **Cálculo de Porcentajes:** Asegurar que el porcentaje no exceda el 100% visualmente si así se desea, o manejar el "over-achievement".
3.  **Renderizado de Track:** Implementar el fondo gris oscuro para cada anillo.
4.  **Leyenda:** Implementar la sección lateral con iconos de `lucide-react`.

## 4. Herramientas y Comandos Autorizados
*   `recharts`: Visualización radial.
*   `lucide-react`: Iconografía.
*   `tailwind-merge`: Combinación de clases dinámica.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-16 | Inicio de despliegue | N/A |
