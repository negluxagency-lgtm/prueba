# Directiva: Identidad Visual Compacta y Mobile-First

**Estado:** 🟢 Operativo  
**Última Actualización:** 2026-01-15  
**Objetivo:** Mantener una interfaz de alta densidad informativa y optimizada para dispositivos móviles en todo el ecosistema Nelux Barbershop.

---

## 📱 Estándares Mobile-First

1.  **Navegación**: En dispositivos móviles (`< 768px`), la navegación DEBE ser inferior (Bottom Nav) con `backdrop-blur` y una altura fija de `h-16`.
2.  **Márgenes**: Usar paddings laterales reducidos (`p-3` a `p-5`) para maximizar el área de contenido.
3.  **KPIs**: Las cuadrículas de estadísticas deben usar `grid-cols-2` en móvil, permitiendo que elementos impares ocupen el ancho completo (`col-span-2`).

## 📉 Estándares de Alta Densidad (Compaction)

Para mantener la eficiencia de visualización, se deben seguir estos límites de escala:

| Elemento | Tamaño Fuente | Padding Celda/Contenedor |
| :--- | :--- | :--- |
| Títulos de Sección | `text-sm` o `text-[10px]` | `py-1.5` |
| Datos de Tabla | `text-[11px]` o `text-xs` | `px-3 py-1` |
| Botones de Acción | Iconos `10px` a `12px` | `p-1` a `p-1.5` |
| Cabeceras de Página | `text-2xl` a `text-3xl` | `mb-4` a `mb-6` |

## 🛠️ Reglas de Implementación

- **Idempotencia**: Todas las clases de Tailwind deben ser condicionales (`md:`, `sm:`) para asegurar la respuesta en todos los puntos de ruptura.
- **Inputs**: Los componentes `select` e `input` SIEMPRE deben tener un fallback de string vacío (`|| ""`) para evitar errores de componentes no controlados de React.
- **Contenedores**: El ancho máximo global recomendado para el dashboard es `max-w-3xl` para mantener el foco.

---

## 📔 Bitácora de Anomalías

- **2026-01-15 - Error de Select Null**: Se detectó un error de consola al pasar `null` al prop `value` de un `select`. **Solución:** Implementar `value={formData.field || ""}` y añadir una opción placeholder deshabilitada.
- **2026-01-15 - Optimización de Mensajes**: La página de mensajes no era responsiva. **Solución:** Implementar lógica de alternar (show/hide) entre lista de contactos y chat en móviles, escalando fuentes e iconos.
