import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://nelux.es';

    // 1. URLs Estáticas Base
    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date('2026-03-18'),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date('2026-03-18'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date('2026-03-18'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date('2026-03-01'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // 2. Extraer todas las barberías públicas de forma dinámica (Para indexar /[slug])
    try {
        const { data: perfiles } = await supabase
            .from('perfiles')
            .select('slug')
            .not('slug', 'is', null)
            .neq('slug', '');

        if (perfiles && perfiles.length > 0) {
            const dynamicUrls: MetadataRoute.Sitemap = perfiles.map((perfil) => ({
                url: `${baseUrl}/${perfil.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));

            // Combina las estáticas con las dinámicas
            return [...staticUrls, ...dynamicUrls];
        }
    } catch (error) {
        console.error('Error generando sitemap dinámico:', error);
    }

    return staticUrls;
}
