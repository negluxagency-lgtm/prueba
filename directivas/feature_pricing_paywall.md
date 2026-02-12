# FEATURE-PRICING-PAYWALL: GESTIÓN DE SUSCRIPCIONES Y PAYWALL
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-23
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Definir la estructura y el comportamiento del Paywall de Nelux Barbershop, asegurando que los usuarios seleccionen un plan adecuado para acceder a las funcionalidades premium y de IA.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Seguridad de Pagos**: Todos los enlaces de pago deben apuntar a Stripe.
*   **Identificación de Cliente**: Se debe pasar el `client_reference_id` y `prefilled_email` en los enlaces de Stripe si el usuario está autenticado para facilitar la conciliación.
*   **Idempotencia**: El componente `Paywall` debe manejar correctamente los estados de carga y errores de Supabase/Stripe.
*   **Visuales**: El diseño debe seguir la estética "Dark Premium" (negros profundos, ámbar, bordes redondeados).

## 3. Procedimiento Estándar (SOP)
1.  **Renderización**: Usar el componente `@/components/Paywall.tsx`.
2.  **Variantes**:
    *   `lock`: Bloqueo total tras periodo de prueba (usado en `AuthGuard`).
    *   `pricing`: Página informativa de precios (usada en `/pricing`).
3.  **Configuración de Planes**: Los planes están definidos en la constante `ALL_PLANS` dentro de `Paywall.tsx`. No modificar los enlaces de Stripe sin autorización técnica explícita.

## 4. Herramientas y Comandos Autorizados
*   `lucide-react`: Para iconografía.
*   `Stripe`: Pasarela de pagos externa.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-23 | Eliminación accidental de /pricing | Re-implementación y vinculación desde landing. |
| 2026-01-23 | Error "use client" en Paywall.tsx | Se añadió la directiva "use client" al inicio del archivo. |
| 2026-01-27 | Mensaje de prueba expirada innecesario | Se eliminó la frase "Tu periodo de prueba ha finalizado." a petición del usuario. |
| 2026-01-27 | Layout cortado y superpuesto en móvil | Se cambió layout a `min-h-screen`, botón cerrar sesión a `fixed`, y se aumentó padding inferior. |
| 2026-01-27 | Scroll bloqueado en Paywall móvil | Se revirtió `min-h-screen` a `h-full` manteniendo el padding extra, para permitir scroll dentro del contenedor fijo. |
| 2026-01-27 | Flash of Content en Dashboard | Se migró la protección de Paywall al Layout de Servidor (`layout.tsx`), pasando estado inicial al cliente. Layout de impago ahora incluye Sidebar. |
| 2026-01-27 | Bucle de redirección a /configuracion | Se actualizó `useSubscription` para usar `onboarding_completado` en lugar de `telefono`, alineando lógica cliente/servidor. |
| 2026-02-11 | Mensaje IA (1% facturación) eliminado | Se eliminó el aviso informativo sobre el cargo del 1% en planes IA por redundancia/petición. |
