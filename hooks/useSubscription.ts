import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type SubscriptionStatus = 'pagado' | 'prueba' | 'impago';

interface SubscriptionState {
    status: SubscriptionStatus | null;
    plan: string | null;
    loading: boolean;
    daysRemaining: number;
    isProfileComplete: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

export function useSubscription() {
    const [state, setState] = useState<SubscriptionState>({
        status: null,
        plan: null,
        loading: true,
        daysRemaining: 0,
        isProfileComplete: false // Por defecto false para validar configuración
    });

    useEffect(() => {
        async function checkSubscription() {
            setState(prev => ({ ...prev, loading: true }));

            // Obtener usuario manualmente
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            // Logger condicional (Auditoría Punto 6)
            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) console.log("useSubscription: User session check", { userId: user?.id });

            if (!user) {
                console.log("useSubscription: No user found, stopping.");
                setState({
                    status: null,
                    plan: null,
                    loading: false,
                    daysRemaining: 0,
                    isProfileComplete: false
                });
                return;
            }

            try {
                const { data: profile, error } = await supabase
                    .from('perfiles')
                    .select('estado, plan, created_at, nombre_barberia, telefono, onboarding_completado')
                    .eq('id', user.id)
                    .single();

                if (isDev) console.log("useSubscription: Profile fetch result", { hasProfile: !!profile, error });

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (!profile) {
                    console.log("useSubscription: No profile found (new user). Calculating trial from auth metadata.");

                    const userCreatedAt = new Date(user.created_at).getTime();
                    const now = Date.now();
                    const diffMs = now - userCreatedAt;
                    const daysPassed = Math.floor(diffMs / ONE_DAY_MS);
                    const isTrial = daysPassed < TRIAL_DAYS;
                    const daysRemaining = Math.max(0, TRIAL_DAYS - daysPassed);

                    setState({
                        status: isTrial ? 'prueba' : 'impago',
                        plan: null,
                        loading: false,
                        daysRemaining,
                        isProfileComplete: false
                    });
                    return;
                }

                const isProfileComplete = profile.onboarding_completado === true;

                // 1. Caso PAGADO
                if (profile?.estado === 'pagado') {
                    setState({
                        status: 'pagado',
                        plan: profile?.plan || null,
                        loading: false,
                        daysRemaining: 0,
                        isProfileComplete
                    });
                    return;
                }

                // 2. Calcular tiempo para PRUEBA vs IMPAGO
                const createdAt = new Date(profile?.created_at || new Date()).getTime();
                const now = Date.now();
                const diffMs = now - createdAt;
                const daysPassed = Math.floor(diffMs / ONE_DAY_MS);

                const isTrial = daysPassed < TRIAL_DAYS;
                const daysRemaining = Math.max(0, TRIAL_DAYS - daysPassed);

                console.log("useSubscription: Setting test/unpaid status for existing profile", { isTrial, daysRemaining, isProfileComplete });

                setState({
                    status: isTrial ? 'prueba' : 'impago',
                    plan: null,
                    loading: false,
                    daysRemaining,
                    isProfileComplete
                });

            } catch (error: any) {
                console.error('CRITICAL: Error checking subscription:', error.message || error);
                setState(prev => ({ ...prev, loading: false, status: 'impago' }));
            }
        }

        checkSubscription();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("useSubscription: Auth state change detected", event);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                checkSubscription();
            } else if (event === 'SIGNED_OUT') {
                setState({
                    status: null,
                    plan: null,
                    loading: false,
                    daysRemaining: 0,
                    isProfileComplete: false
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return state;
}
