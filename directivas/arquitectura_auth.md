# Directiva: Arquitectura de Autenticación Supabase

## Contexto
El sistema utiliza Supabase para autenticación y base de datos. Se han detectado múltiples implementaciones inconsistentes, algunas con credenciales hardcodeadas, lo que causa errores críticos en entornos de producción.

## Estándar de Implementación

### 1. Cliente de Cliente (Browser/Client Components)
- **Path**: `lib/supabase.ts`
- **Regla**: DEBE utilizar exclusivamente variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Uso**: Solo en componentes marcados con `"use client"` o hooks.

### 2. Cliente de Servidor (Server Components/Actions)
- **Path**: `utils/supabase/server.ts`
- **Regla**: Utilizar `@supabase/ssr` con el patrón `createServerClient`. Maneja cookies automáticamente para persistencia.
- **Uso**: En Server Actions, API Routes y Server Components.

### 3. Middleware (Sesiones)
- **Path**: `middleware.ts`
- **Regla**: Utilizar `@supabase/ssr` para refrescar la sesión del usuario en cada petición. Nunca hardcodear credenciales.
- **Dependencia**: Delegar la lógica de creación del cliente a `utils/supabase/middleware.ts` si es posible para mantener el middleware limpio.

### 4. Cliente Admin (Service Role)
- **Path**: `lib/supabaseAdmin.ts`
- **Regla**: Utilizar `SUPABASE_SERVICE_ROLE_KEY` (solo servidor). Extremadamente sensible; solo para tareas administrativas.

## Restricciones
- **PROHIBIDO** hardcodear `supabaseUrl` o `supabaseAnonKey`.
- **PROHIBIDO** usar `sb-access-token` manualmente en la lógica de cookies si se usa `@supabase/ssr`.
- Todo cliente debe inicializarse con variables de entorno validadas.

## Bitácora de Anomalías
- **[2026-01-23]**: Se encontraron credenciales de un proyecto externo hardcodeadas en `lib/supabase.ts`, `lib/supabaseServer.ts` y `middleware.ts`, rompiendo la app en producción tras el registro.
