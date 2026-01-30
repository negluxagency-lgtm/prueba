# INFRA-STRIPE-WEBHOOKS: GESTIÓN DE EVENTOS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-30
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Manejar el ciclo de vida completo de suscripciones de Stripe mediante webhooks unificados.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Firma Criptográfica**: Validación obligatoria con `STRIPE_WEBHOOK_SECRET`.
*   **Permisos Elevados**: Uso exclusivo de `SUPABASE_SERVICE_ROLE_KEY` para actualizaciones administrativas.
*   **Eventos Soportados**:
    *   `checkout.session.completed`: Activación de suscripción.
    *   `customer.subscription.deleted`: Cancelación/Impago.
*   **Metadata**: `checkout.session.completed` REQUIERE `metadata.userId` para vincular el pago.

## 3. Procedimiento Estándar (SOP)
1.  **Ruta**: `app/api/webhooks/route.ts` (POST).
2.  **Lógica**:
    *   Validar firma.
    *   `switch (event.type)`
    *   Caso `checkout`: Actualizar `stripe_customer_id`, `is_subscribed=true`, `estado='activo'`.
    *   Caso `subscription.deleted`: Actualizar `estado='impago'`, `is_subscribed=false`.
    *   Default: Log y return 200.

## 4. Herramientas y Comandos Autorizados
*   `stripe`: SDK oficial.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-30 | Overwrite Logic | Refactored to unified handler for multiple events. |
