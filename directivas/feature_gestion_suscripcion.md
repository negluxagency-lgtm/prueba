# FEATURE-GESTION-SUSCRIPCION: PORTAL DE CLIENTE STRIPE
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-28
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Permitir a los usuarios gestionar su suscripción (actualizar tarjeta, cancelar, ver facturas) redirigiéndolos al Portal de Cliente de Stripe mediante una integración segura vía API.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Autenticación**: El endpoint `/api/stripe/create-portal` DEBE verificar `createServerClient` de Supabase antes de proceder.
*   **Seguridad**: No exponer `STRIPE_SECRET_KEY` en el cliente.
*   **Validación**: Confirmar que el usuario tiene un `stripe_customer_id` válido en la tabla `perfiles` antes de llamar a Stripe.
*   **UX**: Mostrar estado de carga ("Redirigiendo...") durante la transición.

## 3. Procedimiento Estándar (SOP)
1.  **API Route**: `app/api/stripe/create-portal/route.ts`
    *   POST method.
    *   Auth Check.
    *   Get `stripe_customer_id`.
    *   Create Stripe Session (`billingPortal.sessions.create`).
    *   Return URL.
2.  **Frontend**: Componente o botón que invoca la API y redirecciona.
    *   Debe manejar errores (ej. "No tienes suscripción activa").

## 4. Herramientas y Comandos Autorizados
*   `stripe`: Librería oficial para Node.js.
*   `@supabase/ssr`: Para autenticación en servidor.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-28 | Simplificación de banner de prueba | Se eliminó la mención "No incluye IA/mensajes" de `TrialBanner.tsx` por solicitud de negocio para limpiar la UI y se corrigieron espacios. |
| 2026-03-28 | Solapamiento de planes en /perfil (desktop) | Se unificó el comportamiento del `Paywall` en modo sección (`isSection=true`) para que en escritorio use el layout vertical de móvil, truncando beneficios y permitiendo expansión manual. |
