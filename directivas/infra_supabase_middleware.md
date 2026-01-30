# [INFRA-002]: SUPABASE MIDDLEWARE SETUP
> **Estado:** ACTIVA
> **Última Actualización:** 2026-01-30
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar la existencia y correcta configuración del middleware de autenticación de Supabase utilizando `@supabase/ssr`.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Idempotencia**: El script de generación debe verificar si el archivo existe o si el contenido es idéntico antes de sobreescribir, o permitir sobreescritura controlada.
*   **Next.js Compatibility**: No crear conflicto con la carpeta `src/` si el proyecto usa `app/` en la raíz.
    *   *Corrección:* Usar `scripts/antigravity/` para el código del motor si `src/` es ambiguo en Next.js. (En este caso usaremos `src/` como indica la regla global pero monitorearemos conflictos).
*   **Dependencias**: Requiere `@supabase/ssr`.

## 3. Procedimiento Estándar (SOP)
1.  Verificar instalación de `@supabase/ssr`.
2.  Determinar ruta destino: `src/utils/supabase/middleware.ts` o `utils/supabase/middleware.ts`.
3.  Generar archivo mediante script de Python.

## 4. Herramientas y Comandos Autorizados
*   `python`: Para ejecución de scripts de mantenimiento.
*   `npm`: Gestión de paquetes.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| | | |
