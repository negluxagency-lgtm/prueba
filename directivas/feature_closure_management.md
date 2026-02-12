# Directiva: Gestión de Cierres Temporales y Vacaciones

## Contexto Operativo
El sistema Nelux utiliza una automatización externa que marca `calendario_confirmado` como `false` el día 25 de cada mes. Esto obliga al barbero a definir sus cierres para el mes siguiente.

## Arquitectura de Datos
- **Tabla:** `perfiles`
- **Columnas Clave:**
  - `fechas_cierre`: (JSONB) Array de strings (ISO Dates) que representan días no laborales específicos.
  - `calendario_confirmado`: (Boolean) Indica si el usuario ha revisado y guardado sus cierres del mes.

## Reglas de Implementación
1. **Desacoplamiento:** El modal `MonthlyClosingModal` debe dejar de ser obligatorio en el layout global.
2. **Aviso de Acción:** Si `calendario_confirmado` es `false`, debe aparecer un banner informativo en el Dashboard/Perfil invitando a realizar la gestión.
3. **Acceso desde Perfil:** Añadir un botón "Gestionar Cierres y Vacaciones" en la página de perfil.
4. **Persistencia:** Al guardar las fechas, se debe actualizar `fechas_cierre` y marcar `calendario_confirmado` como `true`.

## Bitácora de Anomalías
- (Vacío)
