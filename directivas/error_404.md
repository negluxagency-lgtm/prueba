# [ID-DIRECTIVA]: ERROR_404_ESTETICA
> **Estado:** ACTIVA
> **Última Actualización:** 2026-03-17
> **Responsable:** Antigravity Agent

## 1. Objetivo Primario
Proporcionar una página 404 (`app/not-found.tsx`) estéticamente alineada con el resto de la aplicación (modo oscuro, acentos en ambar, diseño moderno, limpio y profesional). 

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   Debe ser un componente de servidor simple o de cliente si requiere hooks (se prefiere de cliente para efectos interactivos si fuera necesario, pero Next.js 13+ recomienda server por defecto para el cascarón). Para animaciones `lucide-react` servirá.
*   Debe utilizar los colores globales (`bg-black`, `text-amber-500`, `zinc`).
*   Debe incluir un botón claro de volver al inicio.
*   Debe gestionarse mediante el modelo de despliegue `src/deploy_404.py`.

## 3. Procedimiento Estándar (SOP)
1.  **Levitation (Despliegue)**: Se utiliza el script `src/deploy_404.py` que crea `app/not-found.tsx`.
2.  El script utiliza la SDK `antigravity.materialize` (representada mediante operaciones idempotentes de escritura de archivos).
3.  **Comprobación**: Navegar a una ruta inexistente como `http://localhost:3000/una-ruta-no-valida` para verificar UX y UI.

## 4. Herramientas y Comandos Autorizados
*   `python src/deploy_404.py`: Ejecución materializadora del agente Antigravity.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-17 | N/A (Despliegue Inicial) | Diseño oscuro y elegante aplicado. |
