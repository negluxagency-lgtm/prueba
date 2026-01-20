# [UX-002]: MEJORAS DE UX MÓVIL Y PAYWALL
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-19
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Mejorar la experiencia de usuario en dispositivos móviles y estados de bloqueo por pago. Específicamente, asegurar la visibilidad del banner de prueba y permitir el cierre de sesión desde el Paywall.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Sticky Banner:** El banner de "Prueba" debe permanecer visible al hacer scroll en móvil, sin obstruir contenido crítico de manera permanente (debe ser legible).
*   **Paywall Logout:** El botón de salir en el Paywall debe ser claro, accesible y funcionar inmediatamente para permitir al usuario cambiar de cuenta.
*   **Estética:** Mantener la estética "Premium/Dark" de la aplicación.

## 3. Procedimiento Estándar (SOP)
1.  **TrialBanner:** Añadir posicionamiento `sticky` o `fixed` con `z-index` alto. Verificar superposición con otros elementos fijos (e.g., header de chat).
2.  **Paywall:** Insertar un botón de "Cerrar Sesión" en la interfaz de bloqueo, reutilizando la lógica de `supabase.auth.signOut()`.

## 4. Herramientas y Comandos Autorizados
*   `replace_file_content`: Para editar componentes.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-20 | Banner Móvil Scrollable | Se movió el `TrialBanner` fuera del contenedor scrollable del layout. |
| 2026-01-20 | Logout button sobre banner | Reducido z-index del botón de z-110 a z-50 para quedar debajo del banner (z-60). Añadido padding superior al Paywall. |
