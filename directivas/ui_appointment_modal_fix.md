# [ID-DIRECTIVA]: FIX RESPONSIVE APPOINTMENT MODAL
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-31
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Asegurar que el componente `AppointmentModal` (usado para inyectar nuevas citas en `/inicio` y `/staff`) respete los límites físicos (viewports) de los dispositivos móviles, previniendo el desbordamiento horizontal (blowout de flexbox) provocado por limitantes de inputs estéticos (ej. `<input type="date">`).

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   Nunca asignar `overflow-hidden` nativo a contenedores de formularios dinámicos sin antes proveer `overflow-y-auto` con un `max-h`.
*   Para evitar el efecto "blowout" de Flexbox en móviles, los items flex deben forzar empuje negativo con `min-w-0` y contener su ancho estrictamente a `width: 100%` o limitados matemáticamente por viewport `w-[calc(100vw-Xrem)]`.

## 3. Procedimiento Estándar (SOP)
1.  Aplicar `max-h-[90vh]` y `overflow-y-auto` al envoltorio del modal.
2.  Eliminar `overflow-hidden` general del modal, cambiarlo por `overflow-x-hidden` para no deshabilitar scroll vertical pero recortar sobresalientes en X.
3.  Aplicar `w-[calc(100vw-2rem)]` en móviles y `sm:w-full` por encima, junto con `min-w-0` en los envolturas de inputs del grid.
4.  Comprimir métricas de padding: `p-5 md:p-8` para liberar espacio útil.

## 4. Herramientas y Comandos Autorizados
*   Modificaciones en TailwindCSS estándarizadas vía `multi_replace_file_content`.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-31 | Desbordamiento de input 'date' hacia la derecha y modal inabarcable en alto. | Se inyectó límite de viewport (100vw - 2rem) junto a constraints de `min-w-0` para prevenir flex blowout; activado scroll dinámico con `max-h-[90vh]`. |
