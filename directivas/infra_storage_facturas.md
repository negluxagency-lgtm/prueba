# [INFRA-002]: GESTIÓN DE FACTURAS EN STORAGE
> **Estado:** EN_PRUEBA
> **Última Actualización:** 2026-03-02
> **Responsable:** Antigravity Deployment Agent

## 1. Objetivo Primario
Automatizar la generación de PDFs de facturas en el servidor, su almacenamiento persistente en Supabase Storage y la provisión de acceso seguro mediante URLs firmadas.

## 2. Restricciones Críticas (Protocolo de Seguridad)
*   **Privacidad:** El bucket `facturas-legales` DEBE ser privado.
*   **Eficiencia:** El PDF se genera UNA SOLA VEZ al emitir la factura.
*   **Seguridad Frontend:** Nunca exponer URLs directas del bucket. Usar siempre `Signed URLs` con expiración máxima de 5 minutos.
*   **Atomicidad:** La falla en la subida al Storage NO debe revertir la inserción legal de la factura, pero DEBE quedar registrada para re-intento.

## 3. Procedimiento Estándar (SOP)
1.  **Generación:** Usar `@react-pdf/renderer` en el servidor para convertir `InvoicePDF` a Buffer.
2.  **Organización:** Ruta: `[id_barberia]/[año]/[numero_factura].pdf`.
3.  **Vinculación:** Guardar la ruta relativa en la columna `pdf_storage_path` de la tabla `facturas`.
4.  **Acceso:** Implementar acción `getInvoiceSignedUrl(invoiceId)` que verifique sesión y devuelva la URL temporal.

## 4. Herramientas y Comandos Autorizados
*   `@react-pdf/renderer`: Para renderizado de PDF en Node.js.
*   `supabase.storage.from('facturas-legales').upload()`: Para persistencia.
*   `createSignedUrl()`: Para acceso seguro.

## 5. Bitácora de Anomalías (Aprendizaje Continuo)
| Fecha | Error Detectado | Solución Implementada |
| :--- | :--- | :--- |
| 2026-03-02 | Inicialización | N/A |
