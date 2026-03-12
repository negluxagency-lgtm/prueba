# SF-001: ESTÁNDAR DE ICONOS PARA SAFARI E IOS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-12
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar que el icono de la web (favicon) y la identidad visual se muestren correctamente en Safari (macOS) e iOS (iPhone/iPad), incluyendo soporte para Pinned Tabs y añadir a pantalla de inicio.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **No usar rutas relativas en manifiestos:** Safari a menudo falla si las rutas no son absolutas desde la raíz (`/`).
*   **Mask-icon monocromático:** El archivo `safari-pinned-tab.svg` DEBE ser un SVG de un solo color (negro) para que Safari pueda aplicar su propio tinte.
*   **Apple Touch Icon:** Debe ser un PNG de 180x180 sin transparencia (relleno sólido) para evitar que iOS añada efectos no deseados.
*   **Limpieza de Manifiestos:** No debe existir más de un `site.webmanifest` o `manifest.json` que apunte a rutas inexistentes.

## 3. Procedimiento Estándar (SOP)
1.  **Generación de Activos:**
    *   `favicon.ico` (fallback universal).
    *   `apple-touch-icon.png` (180x180).
    *   `safari-pinned-tab.svg` (monocromático).
    *   `manifest.json` (configuración PWA).
2.  **Configuración en Next.js (layout.tsx):**
    *   Utilizar el objeto `metadata` con la clave `appleWebApp` y `icons`.
    *   Incluir el `mask-icon` en la sección `other` de `icons`.
3.  **Cache Busting:** Usar `?v=...` en las URLs de los iconos para forzar la actualización en navegadores que cachean agresivamente el favicon.

## 4. Herramientas y Comandos Autorizados
*   `Metadata (Next.js)`: Para la inyección de tags en el `<head>`.
*   `manifest.json`: Para la definición de iconos PWA.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-12 | Icono no aparece en Safari por rutas rotas en `site.webmanifest` y falta de `mask-icon`. | Eliminado manifiesto redundante, añadido `safari-pinned-tab.svg` y metadatos `appleWebApp`. |
