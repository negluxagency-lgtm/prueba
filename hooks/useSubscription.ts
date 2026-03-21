import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import useSWR from 'swr';

export type SubscriptionStatus = 'pagado' | 'prueba' | 'impago';

interface SubscriptionState {
    status: SubscriptionStatus | null;
    plan: string | null;
    loading: boolean;
    daysRemaining: number;
    isProfileComplete: boolean;
    calendario_confirmado: boolean;
    fechas_cierre: string[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

export function useSubscription() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
            setLoadingSession(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                setUserId(session?.user?.id || null);
            } else if (event === 'SIGNED_OUT') {
                setUserId(null);
            }
            setLoadingSession(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const { 
        data: state, 
        error, 
        isLoading,
        mutate
    } = useSWR(
        userId ? ['subscription', userId] : null,
        async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile, error } = await supabase
                .from('perfiles')
                .select('estado, plan, created_at, nombre_barberia, telefono, onboarding_completado, calendario_confirmado, fechas_cierre')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            const isProfileComplete = profile?.onboarding_completado === true;

            // 1. New user or no profile yet
            if (!profile) {
                const userCreatedAt = new Date(user.created_at).getTime();
                const now = Date.now();
                const diffMs = now - userCreatedAt;
                const daysPassed = Math.floor(diffMs / ONE_DAY_MS);
                const isTrial = daysPassed < TRIAL_DAYS;
                const daysRemaining = Math.max(0, TRIAL_DAYS - daysPassed);

                return {
                    status: isTrial ? 'prueba' : 'impago' as SubscriptionStatus,
                    plan: null,
                    daysRemaining,
                    isProfileComplete: false,
                    calendario_confirmado: false,
                    fechas_cierre: []
                };
            }

            // 2. Paid status
            if (profile.estado === 'pagado') {
                return {
                    status: 'pagado' as SubscriptionStatus,
                    plan: profile.plan || null,
                    daysRemaining: 0,
                    isProfileComplete,
                    calendario_confirmado: profile.calendario_confirmado || false,
                    fechas_cierre: profile.fechas_cierre || []
                };
            }

            // 3. Trial or Unpaid calculation
            const createdAt = new Date(profile.created_at || new Date()).getTime();
            const now = Date.now();
            const diffMs = now - createdAt;
            const daysPassed = Math.floor(diffMs / ONE_DAY_MS);

            const isTrial = daysPassed < TRIAL_DAYS;
            return {
                status: (isTrial ? 'prueba' : 'impago') as SubscriptionStatus,
                plan: null,
                daysRemaining: Math.max(0, TRIAL_DAYS - daysPassed),
                isProfileComplete,
                calendario_confirmado: profile.calendario_confirmado || false,
                fechas_cierre: profile.fechas_cierre || []
            };
        },
        {
            revalidateOnFocus: true,
            dedupingInterval: 10000, // 10s for auth data is fine
            onError: (err) => {
                console.error('Error checking subscription:', err);
                toast.error('Error al verificar suscripción');
            }
        }
    );

    return {
        status: state?.status || null,
        plan: state?.plan || null,
        loading: isLoading || loadingSession,
        daysRemaining: state?.daysRemaining || 0,
        isProfileComplete: state?.isProfileComplete || false,
        calendario_confirmado: state?.calendario_confirmado ?? true, // Por defecto true para no molestar si falla la carga
        fechas_cierre: state?.fechas_cierre || [],
        refresh: () => mutate()
    };
}


