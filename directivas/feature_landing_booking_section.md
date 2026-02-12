# FEATURE-LANDING-BOOKING-SECTION: SECCIÓN DE RESERVAS ONLINE
> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-11
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar una nueva sección en la Landing Page (encima de "Control Financiero") que destaque la página de reservas pública personalizada para cada barbería.
Debe enfatizar:
- Sin descarga de App.
- Sin registro de usuario.
- Reserva inmediata (Guest Booking).
- Diseño consistente con el resto de la landing.
- Incluir preview visual.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Estética:** Debe mantener la paleta de colores Zinc/Amber y el estilo "dark mode" premium.
*   **Performance:** Las imágenes o componentes de preview deben estar optimizados.
*   **Responsive:** Debe verse bien en móvil (stacked) y desktop (grid).
*   **Ubicación:** Estrictamente entre "El Cerebro (IA)" y "Control Financiero".

## 3. Procedimiento Estándar (SOP)
1.  Crear componente visual `DemoBookingPreview.tsx` en `components/landing/`.
2.  Modificar `app/(landing)/page.tsx` para insertar la nueva `<section>`.
3.  Utilizar los iconos de `lucide-react` (e.g., `Calendar`, `Smartphone`, `UserCheck`).
4.   Verificar alineación y espaciado (padding `py-20 md:py-32`).

## 4. Herramientas y Comandos Autorizados
*   `view_file`, `write_to_file` para edición de código.
*   `generate_image` (si fuera necesario crear un mockup, aunque preferimos código CSS/Tailwind para el demo).

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-02-11 | N/A | Implementación exitosa de `DemoBookingPreview` y actualización de landing page. |
