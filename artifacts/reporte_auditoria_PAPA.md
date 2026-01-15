# [AUDIT-REPORT-001]: Análisis de Workflow n8n (PAPA.json)
> **Fecha:** 2026-01-14
> **Objetivo:** Análisis de robustez, mantenibilidad y seguridad.
> **Auditor:** Antigravity Agent

## 1. Resumen Ejecutivo
El workflow implementa un agente de reservas vía WhatsApp/Chat. La lógica funcional es sólida pero la implementación sufre de alta **complejidad ciclomática** (exceso de nodos condicionales repetitivos) y presenta riesgos de **integridad de datos** (Race Conditions) y datos embebidos (Hardcoding).

**Calificación de Salud:** ⚠️ **C (Requiere Refactorización)**

## 2. Hallazgos Críticos (Prioridad Alta)

### 🔴 2.1 Datos Hardcodeados
En el nodo `Create a row` (SupaBase), el campo `Telefono` está fijo:
```json
"fieldValue": "25352455"
```
**Impacto:** Todas las reservas se guardarán con el mismo número de teléfono, perdiendo el contacto real del cliente.
**Solución:** Mapear dinámicamente desde el input del chat o solicitarlo al usuario.

### 🔴 2.2 Condición de Carrera (Race Condition)
El flujo lee citas (`Get many rows`) -> Calcula huecos en JS -> Escribe cita (`Create a row`).
**Riesgo:** Si dos usuarios reservan el "último hueco" simultáneamente, ambos pasarán la lectura antes de que el primero escriba. Esto generará *overbooking*.
**Solución:** Usar restricciones `UNIQUE` o `Constraint` a nivel de base de datos en Supabase, o implementar un sistema de bloqueo (mutex) con Redis antes de leer/escribir.

## 3. Oportunidades de Optimización (Prioridad Media)

### 🟡 3.1 Lógica Redundante (Spaghetti Nodes)
La estructura `Switch1` y `Switch2` seguida de múltiples `If` (If2-If6, If7-If12) para manejar de 1 a 6 personas es ineficiente.
*   **Problema:** Si quieres aceptar 7 personas, debes añadir manualmente más nodos.
*   **Solución:** Eliminar los Switches e Ifs. Usar un solo nodo **Code** que reciba `num_personas` y `huecos_disponibles`.
    *   Lógica: `const esPosible = huecos_disponibles >= num_personas;`
    *   Esto reduce ~15 nodos a 1 nodo.

### 🟡 3.2 Manejo de Fechas Manual
En los nodos Code (ej. `Code in JavaScript`), se hace parsing manual de horas:
```javascript
const [hrs, mins] = str.split(':').map(Number);
```
**Mejora:** Ya estás usando `DateTime` de Luxon en el nodo `hoy`. Úsalo en todos los Code Nodes para evitar errores de zona horaria o formatos inesperados.

### 🟡 3.3 Aleatoriedad en Sugerencias
El nodo `Code in JavaScript3` baraja y elige 3 horas.
*   **Observación:** Es una buena UX, pero asegúrate de que esto no oculte horas preferentes para el negocio si fuera necesario.

## 4. Recomendaciones de Seguridad
*   **Error Trigger:** No existe un nodo `Error Trigger`. Si Supabase falla (API down), el usuario no recibe respuesta. Añadir un flujo de error que avise "Hubo un problema técnico".

## 5. Plan de Acción Sugerido
1.  **Corregir el teléfono hardcodeado** (Inmediato).
2.  **Refactorizar lógica de capacidad:** Reemplazar los 12 nodos If/Switch por un nodo Code.
3.  **Implementar validación de escritura** (Try/Catch en Supabase o check double post).

---
*Generado por Antigravity System | Vuelo 2026*
