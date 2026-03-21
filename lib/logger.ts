import { createClient } from '@/utils/supabase/server';
import supabaseAdmin from './supabaseAdmin';

type LogLevel = 'INFO' | 'WARNING' | 'ERROR';
type LogModulo = 'AUTH' | 'METRICS' | 'ACTIONS' | 'SYSTEM';

interface LogOptions {
    nivel: LogLevel;
    modulo: LogModulo;
    mensaje: string;
    detalles?: any;
    usuario_id?: string;
}

/**
 * Registra un evento en la tabla logs_sistema.
 * Usa supabaseAdmin para asegurar que el log se guarde incluso si el RLS del usuario falla.
 */
export async function sysLog({ nivel, modulo, mensaje, detalles = {}, usuario_id }: LogOptions) {
    try {
        const { error } = await supabaseAdmin
            .from('logs_sistema')
            .insert({
                nivel,
                modulo,
                mensaje,
                detalles,
                usuario_id
            });

        if (error) {
            console.error('[sysLog Error]', error);
        }
    } catch (err) {
        console.error('[sysLog Critical Error]', err);
    }
}

export const logger = {
    info: (modulo: LogModulo, mensaje: string, detalles?: any, usuario_id?: string) => 
        sysLog({ nivel: 'INFO', modulo, mensaje, detalles, usuario_id }),
    
    warn: (modulo: LogModulo, mensaje: string, detalles?: any, usuario_id?: string) => 
        sysLog({ nivel: 'WARNING', modulo, mensaje, detalles, usuario_id }),
    
    error: (modulo: LogModulo, mensaje: string, detalles?: any, usuario_id?: string) => 
        sysLog({ nivel: 'ERROR', modulo, mensaje, detalles, usuario_id }),
};
