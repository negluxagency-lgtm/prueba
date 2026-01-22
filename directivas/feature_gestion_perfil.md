# FEATURE_GESTION_PERFIL: Gestión de Perfil y Suscripción

> **Estado:** 🟢 ACTIVA
> **Última Actualización:** 2026-01-22
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar una página de perfil (`/perfil`) segura y estética donde el usuario pueda visualizar su información de negocio (Supabase) y gestionar su suscripción (Stripe) sin salir del flujo de la aplicación.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Privacidad de Datos**: Los datos sensibles (como el ID de cliente de Stripe) no deben exponerse directamente en el cliente.
*   **Server Actions**: Toda interacción con la API de Stripe DEBE realizarse a través de Server Actions (`'use server'`).
*   **Estilo Visual**: Adherencia estricta a la paleta "Dark Premium" (Zinc-950, Amber-500) y directiva `identidad_visual_compacta.md`.
*   **Manejo de Errores**: Si no existe un cliente de Stripe, la UI debe reflejarlo o la acción debe manejar el error sin romper la aplicación.

## 3. Procedimiento Estándar (SOP)
1.  **Backend (Action)**:
    *   Crear `manageSubscription` en `src/app/actions/manage-subscription.ts`.
    *   Validar sesión de usuario antes de proceder.
    *   Usar `stripe.billingPortal.sessions.create`.
2.  **Frontend (Page)**:
    *   `src/app/(dashboard)/perfil/page.tsx` como Server Component.
    *   Fetch de datos usando `supabase.auth.getSession` y Query a `perfiles`.
    *   Layout en Grid/Flex responsivo.
3.  **Componentes**:
    *   Botón de Logout desacoplado (`LogoutButton.tsx`).

## 4. Herramientas y Comandos Autorizados
*   `stripe`: SDK oficial para Node.js.
*   `lucide-react`: Iconografía.
*   `supabase-js`: Cliente de base de datos.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| | | |
