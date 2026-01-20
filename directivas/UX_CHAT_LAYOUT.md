# [UX-001]: CORRECCIÓN DE SCROLL EN CHAT /MENSAJES
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-19
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Lograr que la interfaz de chat en `/mensajes` tenga un comportamiento de scroll independiente: la barra lateral (lista de chats) debe permanecer fija y solo el área de mensajes activa debe hacer scroll.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **No romper la responsividad:** La solución debe funcionar en desktop y adaptarse correctamente a mobile (o mantener el comportamiento actual si mobile es diferente).
*   **Uso de Tailwind CSS:** Se debe priorizar el uso de clases de utilidad de Tailwind sobre CSS personalizado.
*   **Altura completa:** El contenedor principal debe calcular correctamente la altura de la ventana (vh) para evitar scrolls dobles en el `body`.

## 3. Procedimiento Estándar (SOP)
1.  Analizar `app/(dashboard)/mensajes/page.tsx` para identificar los contenedores de la lista de chats y del área de mensajes.
2.  Aplicar `h-[calc(100vh-X)]` (donde X es la altura del header/navbar) al contenedor principal del chat.
3.  Aplicar `overflow-y-auto` a la columna de lista de chats y a la columna de mensajes individualmente.
4.  Asegurar que el contenedor padre tenga `flex` y `overflow-hidden`.
5.  Verificar que no haya scroll en el `body` o `html`.

## 4. Herramientas y Comandos Autorizados
*   `view_file`: Para inspeccionar la estructura actual.
*   `replace_file_content` / `multi_replace_file_content`: Para aplicar las clases CSS.
*   `generate_image` (Opcional): Para visualizar si fuera necesario (no aplica aquí).

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-01-19 | Header móvil no fijo | Se ajustó el contenedor a `absolute inset-x-0 top-10 bottom-20 md:inset-0` para respetar paddings del layout y fijar altura en móvil. |
