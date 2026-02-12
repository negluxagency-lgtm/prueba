# FEATURE-PROFILE-MANAGEMENT: GESTIÓN DESDE PERFIL
> **Estado:** ACTIVA
> **Última Actualización:** 2026-02-12
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Permitir al usuario (Dueño/Admin) gestionar aspectos operativos críticos directamente desde la página de perfil (`/perfil`), reduciendo la fricción de navegar a configuración.
Funcionalidades clave:
1.  Gestión de Equipo (Ver, Añadir, Eliminar, Editar Horario Barbero).
2.  Gestión de Horario de Apertura de la Barbería.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia:** Los componentes deben manejar su propio estado y sincronizar con Supabase de forma segura.
*   **Reusabilidad:** Los componentes creados (`ShopScheduleManager`, `BarberManager`) deben ser modulares para poder ser usados en el futuro en `/configuracion` si se decide refactorizar.
*   **UX:** Debe mantenerse el diseño "Dark Mode" y la estética de tarjetas existente en `/perfil`.
*   **Datos:** Usar las tablas `perfiles` (horario_semanal) y `barberos`.

## 3. Procedimiento Estándar (SOP)
1.  Crear carpeta `components/management`.
2.  Implementar `ShopScheduleManager.tsx`:
    *   Cargar `horario_semanal` desde props o fetch.
    *   UI de toggles y rangos horarios (similar a configuracion).
    *   Guardado directo a Supabase (`perfiles`).
3.  Implementar `BarberManager.tsx`:
    *   Listar barberos.
    *   Modal/Formulario para añadir barbero.
    *   Modal/Expandible para editar horario de barbero.
    *   Botón de eliminar.
4.  Integrar en `app/(dashboard)/perfil/page.tsx` añadiendo nuevas secciones/tarjetas.

## 4. Herramientas y Comandos Autorizados
*   `view_file`, `write_to_file` para creación de componentes.
*   `supabase` client para operaciones de datos.

## 5. Bitácora de Anomalías
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| | | |
