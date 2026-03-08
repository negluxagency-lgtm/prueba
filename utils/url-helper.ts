
/**
 * Transforma una URL de Supabase a una URL de proxy propio si coincide con el patrón esperado.
 * De: https://liyoivvgmtkzyttrlotk.supabase.co/storage/v1/object/public/bucket/path
 * A: /i/bucket/path
 */
export function getProxiedUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // Si ya es una ruta relativa de proxy, devolverla tal cual
    if (url.startsWith('/i/')) return url;
    
    // Patrón de Supabase (detecta el subdominio y la ruta de public)
    const supabasePattern = /https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)/;
    const match = url.match(supabasePattern);
    
    if (match) {
        const bucket = match[1];
        const path = match[2];
        return `/i/${bucket}/${path}`;
    }
    
    return url;
}
