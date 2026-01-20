import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type SubscriptionStatus = 'pagado' | 'prueba' | 'impago';

interface SubscriptionState {
    status: SubscriptionStatus | null;
    loading: boolean;
    daysRemaining: number;
    isProfileComplete: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

export function useSubscription() {
    const [state, setState] = useState<SubscriptionState>({
        status: null,
        loading: true,
        daysRemaining: 0,
        isProfileComplete: true // Por defecto true para no bloquear preventivamente
    });

    useEffect(() => {
        async function checkSubscription() {
            // Obtener usuario manualmente
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                setState(prev => ({ ...prev, loading: false }));
                return;
            }

            try {
                const { data: profile, error } = await supabase
                    .from('perfiles')
                    .select('estado, created_at, nombre_barberia, telefono')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                const isProfileComplete = !!profile?.telefono;

                // 1. Caso PAGADO
                if (profile?.estado === 'pagado') {
                    setState({
                        status: 'pagado',
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

                setState({
                    status: isTrial ? 'prueba' : 'impago',
                    loading: false,
                    daysRemaining,
                    isProfileComplete
                });

            } catch (error) {
                console.error('Error checking subscription:', error);
                // Fallback seguro: Asumir impago si falla la comprobación crítica
                setState({
                    status: 'impago',
                    loading: false,
                    daysRemaining: 0,
                    isProfileComplete: true
                });
            }
        }

        checkSubscription();
    }, []);

    return state;
}
