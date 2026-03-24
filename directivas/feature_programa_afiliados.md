# [ID-DIRECTIVA]: FEATURE_PROGRAMA_AFILIADOS
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-24
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Implementar un programa de afiliados en Next.js y Supabase donde los usuarios pueden obtener un código único al activar su afiliación, usar el código de otro usuario al suscribirse y generar una comisión en su balance (hasta un máximo de 300€). 

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   [Restricción 1] Asegurar que el código de afiliado solo pueda ser usado un máximo de 3 veces.
*   [Restricción 2] El saldo ganado no debe superar los 300€.
*   [Restricción 3] El código solo debe aplicarse en la **primera transacción** de una cuenta (suscripción).
*   [Restricción 4] La columna `afiliado` debe activarse a `true` únicamente tras el consentimiento explícito del usuario en la página `/afiliados`.

## 3. Procedimiento Estándar (SOP)
1.  Verificar/Crear columnas en la tabla `perfiles` de Supabase:
    *   `afiliado` (boolean, default false)
    *   `codigo` (string, unique)
    *   `usos_codigo` (int, default 0)
    *   `balance` (numeric, default 0)
2.  Implementar UI en `/perfil`:
    *   Añadir la sección "¿Quieres ganar hasta 300€ con Nelux Barber?".
    *   Botón que redirija a `/afiliados`.
3.  Implementar página `/afiliados`:
    *   Explicación del programa.
    *   Botón para "Unirse al programa".
    *   Al hacer click, actualizar supabase (`afiliado = true`, autogenerar código si está vacío) y mostrar el código.
4.  Implementar lógica de aplicación del código:
    *   En el proceso de registro/suscripción, permitir introducir un código.
    *   Al completar el pago, incrementar `usos_codigo` del dueño del código.
    *   Sumar el importe al `balance` (hasta 300€ máximo).

## 4. Herramientas y Comandos Autorizados
*   `Supabase SQL Editor / Migrations`: Para ajustar las columnas necesarias.
*   `Next.js Server Actions`: Para las transacciones de validación y suma de balances.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-24 | Inicialización del feature | Creación de directiva base |
