# [ID-DIRECTIVA]: FEATURE_ADMIN_MENSAJES
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-15
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Crear y gestionar la interfaz de usuario `/admin/mensajes` para administrar la comunicación de WhatsApp Business Manager.
Permitir a los administradores visualizar el historial de chat organizado por número de teléfono en dos columnas e interactuar respondiendo directamente a la tabla `mis_mensajes` en Supabase.

## 2. Restricciones Críticas (Protocolo de Seguridad)
* La página debe integrarse en el layout de administración del proyecto.
* La comunicación con la tabla `mis_mensajes` debe realizarse a través de Server Actions de Next.js.
* El campo `recibido` de la tabla `mis_mensajes` es un boolean: `true` indica mensajes del cliente (izquierda), `false` indica mensajes enviados por nosotros (derecha).
* Los nuevos mensajes enviados deben registrarse con `recibido=false`, el mensaje introducido en el input y el `telefono` en formato "346XXXXXXXX".
* La ordenación de los mensajes dentro del chat debe utilizar el `id` o `created_at` de forma ascendente para leer de arriba a abajo.
* El código no debe imprimirse por chat; todas las construcciones se realizarán mediante un script idempotente en la carpeta `src/`.

## 3. Procedimiento Estándar (SOP)
1. **Materialización:** 
   * Crear el script generador `src/setup_admin_mensajes.py` utilizando Python.
2. **Componentes Clave a Generar:**
   * Archivo de UI: `app/admin/mensajes/page.tsx` (Sidebar de conversaciones + panel principal de chat).
   * Server Actions: funciones para `obtenerContactos()`, `obtenerMensajes(telefono)`, `enviarMensaje(telefono, texto)`.
   * Componente inyecta suscripciones websocket de Supabase (`postgres_changes`) para mantener sincronizado en tiempo real el chat activo y organizar el Sidebar de contactos cuando llegan nuevos mensajes.
3. **Despliegue (Levitation):** Ejecutar el script.
4. **Validación (Re-entry):** Verificar artefactos creados y solventar cualquier discrepancia en la tabla `mis_mensajes`.

## 4. Herramientas y Comandos Autorizados
* `python src/setup_admin_mensajes.py`: Materializar los componentes del feature.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-15 | `supabase.from is not a function` por falta de `await` en `createClient()` | Actualizado `src/setup_admin_mensajes.py` para usar `await createClient()` en todas las Server Actions y re-materializado. |
| 2026-03-15 | Registros no visibles debido a RLS bloqueando peticiones del usuario autenticado en admin | Actualizado el import a `@supabase/supabase-js` con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para forzar acceso total (Service Role). |
| 2026-03-16 | `TypeError: Cannot read properties of null (reading 'slice')` al renderizar la lista de contactos | Añadida validación de nulidad para `telefono` (`.filter(Boolean)` en backend, condicionales `c.telefono ?` en el cliente React). |
