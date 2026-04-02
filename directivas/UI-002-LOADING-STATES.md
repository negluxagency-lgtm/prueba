# UI-002: ESTADOS DE CARGA (LOADING STATES)
> **Estado:** ACTIVA
> **Última Actualización:** 2026-04-02
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Estandarizar las pantallas de carga inicial y transiciones para reflejar una estética premium ("Rich Aesthetics") y profesional, eliminando placeholders técnicos por mensajes de sistemas inmersivos.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **No usar placeholders genéricos:** Evitar "Cargando..." o "Verificando...".
*   **Coherencia de Marca:** Usar siempre la paleta de colores corporativa (Amber-500, Zinc-900).
*   **Animaciones Fluidas:** Implementar `animate-pulse` o `animate-spin` con easing suave.
*   **Idempotencia:** Los cambios en los componentes de carga no deben afectar la lógica de negocio subyacente.

## 3. Procedimiento Estándar (SOP)
1.  Identificar componentes con estados de carga manuales.
2.  Reemplazar texto técnico por terminología de "Nexo de Control" o "Sincronización".
3.  Integrar el logo de la marca (NB) con efectos de pulsación.
4.  Validar en dispositivos móviles (responsividad).

## 4. Herramientas y Comandos Autorizados
*   `Tailwind CSS`: Para estilizado rápido y animaciones.
*   `Next.js Image`: Para carga optimizada de assets.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-04-02 | Texto "Verificando Estado..." demasiado técnico. | Migración a "Sincronizando con el Nexo..." con logo pulsante. |
