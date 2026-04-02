"use server";

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getRequiredSession } from '@/lib/auth-utils';
import { logger } from '@/lib/logger'

// Usamos el cliente con rol de servicio para las operaciones de servidor que requieran bypass de RLS 
// Opcional, pero recomendado si queremos garantizar la inmutabilidad de la hora del servidor a nivel admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // O usar auth helper según el nivel de RLS configurado
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export type TipoFichaje = 'entrada' | 'salida' | 'pausa_inicio' | 'pausa_fin';

export interface FichajeLog {
    id: number;
    barbero_id: number;
    tipo: TipoFichaje;
    timestamp_servidor: string;
    geolocalizacion: string | null;
    editado_por: string | null;
    motivo_edicion: string | null;
}

/**
 * Obtiene el último log de fichaje para un barbero determinado hoy.
 * Útil para determinar el estado de los botones UI de manera persistente.
 */
export async function getAttendanceStatus(barberId: number, dateStr?: string) {
    try {
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();

        const { data: log, error } = await supabaseAdmin
            .from('fichajes_logs')
            .select('tipo, timestamp_servidor')
            .eq('barbero_id', barberId)
            .gte('timestamp_servidor', startOfDay)
            .order('timestamp_servidor', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignorar error de 'No rows found'
            console.error('Error fetching attendance status:', error);
            return null;
        }

        return log as { tipo: TipoFichaje, timestamp_servidor: string } | null;
    } catch (error) {
        console.error('Server action getAttendanceStatus error:', error);
        return null;
    }
}

/**
 * Inserta un nuevo log inmutable. 
 * Confía en NOW() de la base de datos para la hora real.
 */
export async function logAttendance(
    barberId: number,
    tipo: TipoFichaje,
    lat?: number,
    lng?: number
) {
    try {
        let pointStr = null;
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
            // Formato WKT para POINT(longitud latitud) o usar string simple según como esté en la DB
            // Si la DB espera el tipo POINT estándar de postgis o postgres: '(lng, lat)'
            pointStr = `(${lng}, ${lat})`;
        }

        // Insertamos sin especificar 'timestamp_servidor' para que PostgreSQL use su DEFAULT NOW()
        const { data, error } = await supabaseAdmin
            .from('fichajes_logs')
            .insert({
                barbero_id: barberId,
                tipo: tipo,
                ...(pointStr && { geolocalizacion: pointStr })
            })
            .select('id, tipo, timestamp_servidor')
            .single();

        if (error) {
            logger.error('ACTIONS', 'Error en fichaje de asistencia', { error, barberId, tipo }, `barber-${barberId}`);
            console.error('Error in logAttendance DB insert:', error);
            return { success: false, error: error.message };
        }

        logger.info('ACTIONS', 'Fichaje de asistencia registrado', { barberId, tipo }, `barber-${barberId}`);
        return { success: true, data };
    } catch (error: any) {
        console.error('Server action logAttendance error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calcula el tiempo trabajado hoy restando al tiempo transcurrido los intervalos de pausa.
 * Si el estado actual es 'entrada' o 'pausa_fin', suma también el tiempo online hasta este mismo instante (NOW() del server).
 */
export async function getDailySummary(barberId: number, dateStr?: string) {
    try {
        // Si no se da fecha, usamos hoy
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

        const { data: logs, error } = await supabaseAdmin
            .from('fichajes_logs')
            .select('*')
            .eq('barbero_id', barberId)
            .gte('timestamp_servidor', startOfDay)
            .lte('timestamp_servidor', endOfDay)
            .order('timestamp_servidor', { ascending: true });

        if (error) {
            console.error('Error in getDailySummary DB query:', error);
            return { totalSeconds: 0, logs: [] };
        }

        if (!logs || logs.length === 0) {
            return { totalSeconds: 0, logs: [] };
        }

        let totalSeconds = 0;
        let lastInTime: Date | null = null;

        // Calcular la hora actual en el servidor haciendo una query rápida
        let serverNow = new Date();
        try {
            const result = await supabaseAdmin.rpc('get_current_time').single();
            if (result.data) {
                serverNow = typeof result.data === 'string' ? new Date(result.data) : new Date();
            }
        } catch (e) { /* ignore */ }

        for (const log of logs) {
            const logTime = new Date(log.timestamp_servidor);

            if (log.tipo === 'entrada' || log.tipo === 'pausa_fin') {
                lastInTime = logTime;
            } else if (log.tipo === 'salida' || log.tipo === 'pausa_inicio') {
                if (lastInTime) {
                    totalSeconds += (logTime.getTime() - lastInTime.getTime()) / 1000;
                    lastInTime = null;
                }
            }
        }

        // Si sigue activo después de todas las interacciones (ej: fichó entrada pero aún no salida)
        if (lastInTime) {
            // Solo sumar si targetDate is el día de hoy
            if (targetDate.toDateString() === new Date().toDateString()) {
                totalSeconds += (serverNow.getTime() - lastInTime.getTime()) / 1000;
            }
        }

        return { totalSeconds: Math.floor(Math.max(0, totalSeconds)), logs };

    } catch (error) {
        console.error('Server action getDailySummary error:', error);
        return { totalSeconds: 0, logs: [] };
    }
}

/**
 * Función para auditoría del Administrador.
 * Añade una corrección introduciendo un nuevo log (No usar UPDATE)
 */
export async function auditPunch(barberId: number, tipo: TipoFichaje, datetimeStr: string, adminId: string, motivo: string) {
    const user = await getRequiredSession();
    try {
        const { data, error } = await supabaseAdmin
            .from('fichajes_logs')
            .insert({
                barbero_id: barberId,
                tipo: tipo,
                timestamp_servidor: datetimeStr, // Aquí forzamos el TS justificado
                editado_por: adminId,
                motivo_edicion: motivo
            })
            .select()
            .single();

        if (error) {
            console.error('Error in auditPunch DB insert:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene los logs de un mes específico para un barbero, útil para reportes de contabilidad.
 */
export async function getMonthlyLogs(barberId: number, year: number, month: number) {
    const user = await getRequiredSession();
    try {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

        const { data: logs, error } = await supabaseAdmin
            .from('fichajes_logs')
            .select('*')
            .eq('barbero_id', barberId)
            .gte('timestamp_servidor', startDate)
            .lte('timestamp_servidor', endDate)
            .order('timestamp_servidor', { ascending: true });

        if (error) {
            console.error('Error in getMonthlyLogs:', error);
            return [];
        }
        return logs;
    } catch (error) {
        return [];
    }
}

/**
 * Obtiene los logs de los últimos 7 días (la semana en curso) para un barbero.
 */
export async function getWeeklyLogs(barberId: number) {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 6); // Últimos 7 días contando hoy
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setHours(23, 59, 59, 999);

        const { data: logs, error } = await supabaseAdmin
            .from('fichajes_logs')
            .select('*')
            .eq('barbero_id', barberId)
            .gte('timestamp_servidor', startOfWeek.toISOString())
            .lte('timestamp_servidor', endOfWeek.toISOString())
            .order('timestamp_servidor', { ascending: false });

        if (error) {
            console.error('Error in getWeeklyLogs:', error);
            return [];
        }
        return logs;
    } catch (error) {
        console.error('Server action getWeeklyLogs error:', error);
        return [];
    }
}
/**
 * Elimina un registro de fichaje específico.
 * Solo para uso administrativo (auditoría).
 */
export async function deleteAttendanceLog(logId: number) {
    const user = await getRequiredSession();
    try {
        const { error } = await supabaseAdmin
            .from('fichajes_logs')
            .delete()
            .eq('id', logId);

        if (error) {
            console.error('Error deleting attendance log:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
