# FEATURE_RESERVA_PUBLICA: Sistema de Reservas para Invitados

> **Estado:** 🟢 ACTIVA
> **Última Actualización:** 2026-02-02
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Habilitar un sistema de reservas público accesible mediante URL personalizada (`/reservar/[slug]` o `/[slug]`) donde clientes no registrados puedan agendar citas proporcionando únicamente su nombre y teléfono.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Acceso Público:** La ruta de reserva debe ser pública, pero la inserción de citas debe estar estrictamente validada en el servidor.
*   **Integridad de Datos:**
    *   No se debe permitir reservar en horarios ya ocupados (validación de concurrencia).
    *   El `slug` de la tienda debe ser único.
*   **Seguridad:**
    *   Uso de `crateClient` (cookie) o Admin client con validación estricta de inputs en Server Actions.
    *   Proteger contra spam/abuso en la medida de lo posible (validación de formato de teléfono).
*   **Diseño:** Mobile-first, estéticamente alineado con "Dark Premium".

## 3. Procedimiento Estándar (SOP)
1.  **Base de Datos**:
    *   `perfiles`: Agregar `slug` (text, unique).
    *   `citas`: `cliente_id` nullable, agregar `guest_name` y `guest_phone`.
2.  **Backend (Server Actions)**:
    *   `bookGuestAppointment`: Recibe datos, valida disponibilidad, inserta cita.
3.  **Frontend (Dynamic Route)**:
    *   `app/[slug]/page.tsx`: Fetch perfil por slug -> Mostrar Servicios -> Mostrar Calendario -> Formulario Invitado -> Confirmación.

## 4. Herramientas y Comandos Autorizados
*   `Supabase Client`: Para consultas públicas.
*   `Supabase Admin`: Solo si es estrictamente necesario para bypass de RLS en inserción segura.
*   `Server Actions`: Para manejo de lógica de reserva.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| | | |
