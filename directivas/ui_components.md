# UI-SYSTEM: COMPONENTES DE INTERFAZ
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-30
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Mantener un sistema de diseño consistente utilizando componentes reutilizables tipo Shadcn/UI (Radix + Tailwind).

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Ubicación**: Todos los componentes primitivos deben residir en `components/ui/`.
*   **Dependencias**: Deben usar `class-variance-authority` (CVA) y `tailwind-merge` para gestión de clases.
*   **Accesibilidad**: Usar primitivas de `@radix-ui` cuando sea necesario interactividad compleja.
*   **Iconografía**: Usar `lucide-react`.

## 3. Procedimiento Estándar (SOP)
1.  **Instalación**: Verificar dependencias (`clsx`, `cva`, `tailwind-merge`, `radix`).
2.  **Creación**: Generar archivo en `components/ui/[nombre].tsx`.
3.  **Utilidades**: Importar `cn` desde `@/lib/utils`.

## 4. Herramientas y Comandos Autorizados
*   `npm install`: Para dependencias de UI.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-30 | Missing Button Component | Generated manually via script. |
