import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';
import { toast } from 'sonner';

export interface ShopData {
    services: any[];
    barbers: any[];
    profile: any;
}

export function useShopData() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    }, []);

    const { 
        data, 
        error, 
        isLoading, 
        mutate 
    } = useSWR(
        userId ? ['shop-data', userId] : null,
        async () => {
            const [servicesRes, barbersRes, profileRes] = await Promise.all([
                supabase.from('servicios').select('id, nombre, precio').eq('barberia_id', userId),
                supabase.from('barberos').select('id, nombre').eq('barberia_id', userId),
                supabase.from('perfiles').select('*').eq('id', userId).single()
            ]);

            if (servicesRes.error) throw servicesRes.error;
            if (barbersRes.error) throw barbersRes.error;
            if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;

            return {
                services: servicesRes.data || [],
                barbers: barbersRes.data || [],
                profile: profileRes.data || null
            } as ShopData;
        },
        {
            revalidateOnFocus: false, // These are fairly static
            dedupingInterval: 60000, // 1 minute
            onError: (err) => {
                console.error("Error fetching shop data:", err);
                toast.error("Error al cargar datos de la barbería");
            }
        }
    );

    return {
        shopData: data || { services: [], barbers: [], profile: null },
        loading: isLoading,
        error,
        refreshShopData: () => mutate()
    };
}
