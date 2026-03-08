# Directiva: Proxy de Medios (Media Proxy)

**Estado:** 🚀 ACTIVO (Marzo 2026)
**Objetivo:** Ocultar URLs de infraestructura (Supabase) y profesionalizar la marca usando URLs propias.

## 1. Estándar de URL
Cualquier recurso multimedia almacenado en Supabase Storage DEBE ser referenciado a través de esta ruta:
`https://app.nelux.es/i/[bucket_id]/[ruta_al_archivo]`

## 2. Implementación Técnica
El proxy se gestiona en `app/i/[bucket]/[...path]/route.ts`. 

**Funcionalidades:**
*   **Encapsulamiento:** Oculta el subdominio de Supabase.
*   **Cache:** Implementa `Cache-Control` agresivo para mejorar la velocidad de carga.
*   **MIME Types:** Detecta automáticamente el `Content-Type` original.

## 3. Ejemplo de Uso
*   **Supabase:** `https://xyz.supabase.co/storage/v1/object/public/productos/123/foto.jpg`
*   **Proxy (Recomendado):** `https://app.nelux.es/i/productos/123/foto.jpg`

## 4. Bitácora de Despliegue
*   **2026-03-07:** Creación del proxy genérico para imágenes de productos y logos.
