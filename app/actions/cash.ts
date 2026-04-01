'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { getRequiredSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export type CashActionResponse = {
    success: boolean
    error?: string
    data?: any
}

export async function getCajaByDate(shopId: string, date?: string): Promise<CashActionResponse> {
    try {
        const effectiveDate = date || new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).split(' ')[0]
        
        const { data, error } = await supabaseAdmin
            .from('arqueos_caja')
            .select('*')
            .eq('barberia_id', shopId)
            .eq('dia', effectiveDate)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('[getTodayCaja] Error:', error)
            return { success: false, error: 'Error al consultar la caja' }
        }

        return { success: true, data }
    } catch (err) {
        return { success: false, error: 'Error interno' }
    }
}

/**
 * Abre la caja con un monto inicial.
 */
export async function abrirCaja(shopId: string, monto: number, responsable?: string): Promise<CashActionResponse> {
    const user = await getRequiredSession()
    try {
        let nombreResponsable = responsable

        if (!nombreResponsable) {
            const { data: profile } = await supabaseAdmin
                .from('perfiles')
                .select('nombre_encargado, nombre_barberia')
                .eq('id', user.id)
                .single()
            nombreResponsable = profile?.nombre_encargado || profile?.nombre_barberia || 'Admin'
        }
        
        const nowInSpain = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).replace(" ", "T")
        const dateSpain = nowInSpain.split('T')[0]
        
        const { error } = await supabaseAdmin
            .from('arqueos_caja')
            .insert({
                barberia_id: shopId,
                monto_apertura: monto,
                dia: dateSpain,
                abierta_por: nombreResponsable,
                estado: 'abierta',
                created_at: nowInSpain
            })

        if (error) {
            if (error.code === '23505') return { success: false, error: 'La caja ya fue abierta hoy.' }
            throw error
        }

        revalidatePath('/inicio')
        revalidatePath('/staff')
        return { success: true }
    } catch (err: any) {
        console.error('[abrirCaja] Error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Calcula el efectivo esperado de hoy (Ventas Efectivo + Apertura).
 */
export async function getExpectedCash(shopId: string): Promise<number> {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).split(' ')[0]
    
    // 1. Obtener monto apertura
    const { data: arqueo } = await supabaseAdmin
        .from('arqueos_caja')
        .select('monto_apertura')
        .eq('barberia_id', shopId)
        .eq('dia', today)
        .single()
    
    const apertura = Number(arqueo?.monto_apertura || 0)

    // 2. Obtener sumatorio de citas en EFECTIVO
    const { data: citas } = await supabaseAdmin
        .from('citas')
        .select('Precio')
        .eq('barberia_id', shopId)
        .eq('Dia', today)
        .eq('confirmada', true)
        .eq('pago', 'efectivo')

    const totalCitas = (citas || []).reduce((acc, c) => acc + Number(c.Precio || 0), 0)

    // 3. Obtener sumatorio de ventas de productos en EFECTIVO
    const { data: productos } = await supabaseAdmin
        .from('ventas_productos')
        .select('precio, cantidad')
        .eq('barberia_id', shopId)
        .eq('metodo_pago', 'efectivo')
        .gte('created_at', `${today} 00:00:00`)
        .lte('created_at', `${today} 23:59:59`)

    const totalProductos = (productos || []).reduce((acc, p) => acc + (Number(p.precio || 0) * Number(p.cantidad || 1)), 0)

    return apertura + totalCitas + totalProductos
}

/**
 * Obtiene las métricas completas para el Dashboard (Ingresos + Caja Inicial).
 */
export async function getDashboardStats(shopId: string, date?: string): Promise<CashActionResponse> {
    try {
        // Usar la fecha local de España si no se proporciona una
        const effectiveDate = date || new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).split(' ')[0]

        const { data: metrics } = await supabaseAdmin
            .from('metricas_diarias')
            .select('*')
            .eq('barberia_id', shopId)
            .eq('dia', effectiveDate)
            .single()

        const { data: arqueo } = await supabaseAdmin
            .from('arqueos_caja')
            .select('monto_apertura')
            .eq('barberia_id', shopId)
            .eq('dia', effectiveDate)
            .single()

        return { 
            success: true, 
            data: {
                metrics: metrics || { ingresos: 0, cortes: 0, productos: 0, citas: 0, caja_real: 0 },
                cajaInicial: arqueo?.monto_apertura || 0
            }
        }
    } catch (err) {
        return { success: false, error: 'Error al obtener métricas' }
    }
}

/**
 * Cierra la caja con el monto real contado.
 */
export async function cerrarCaja(shopId: string, montoReal: number, observaciones?: string, responsable?: string): Promise<CashActionResponse> {
    const user = await getRequiredSession()
    try {
        let nombreResponsable = responsable

        if (!nombreResponsable) {
            const { data: profile } = await supabaseAdmin
                .from('perfiles')
                .select('nombre_encargado, nombre_barberia')
                .eq('id', user.id)
                .single()
            nombreResponsable = profile?.nombre_encargado || profile?.nombre_barberia || 'Admin'
        }
 
        const esperado = await getExpectedCash(shopId)
        const margen = montoReal - esperado
 
        const nowInSpain = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).replace(" ", "T")
        const dateSpain = nowInSpain.split('T')[0]
 
        const { error } = await supabaseAdmin
            .from('arqueos_caja')
            .update({
                monto_cierre_esperado: esperado,
                monto_cierre_real: montoReal,
                margen: margen,
                observaciones: observaciones,
                estado: 'cerrada',
                cerrada_por: nombreResponsable,
                hora_cierre: nowInSpain
            })
            .eq('barberia_id', shopId)
            .eq('dia', dateSpain)

        if (error) throw error

        revalidatePath('/inicio')
        revalidatePath('/staff')
        revalidatePath('/historial_caja')
        return { success: true }
    } catch (err: any) {
        console.error('[cerrarCaja] Error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Obtiene todos los arqueos de un mes específico para el historial de auditoría.
 */
export async function getMonthlyArqueos(shopId: string, month: string): Promise<CashActionResponse> {
    try {
        const [year, m] = month.split('-').map(Number)
        const lastDay = new Date(year, m, 0).getDate()
        const start = `${month}-01`
        const end = `${month}-${String(lastDay).padStart(2, '0')}`

        const { data, error } = await supabaseAdmin
            .from('arqueos_caja')
            .select('*')
            .eq('barberia_id', shopId)
            .gte('dia', start)
            .lte('dia', end)
            .order('dia', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        console.error('[getMonthlyArqueos] Error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Corrige un arqueo de caja existente (Auditoría).
 */
export async function updateArqueoEntry(arqueoId: string, montoReal: number, observaciones?: string): Promise<CashActionResponse> {
    try {
        // Obtenemos el arqueo para saber el monto esperado original
        const { data: arqueo } = await supabaseAdmin
            .from('arqueos_caja')
            .select('*')
            .eq('id', arqueoId)
            .single()

        if (!arqueo) return { success: false, error: 'Arqueo no encontrado' }

        const esperado = Number(arqueo.monto_cierre_esperado || 0)
        const nuevoMargen = montoReal - esperado

        const { error } = await supabaseAdmin
            .from('arqueos_caja')
            .update({
                monto_cierre_real: montoReal,
                margen: nuevoMargen,
                observaciones: observaciones,
                last_audit_at: new Date().toISOString()
            })
            .eq('id', arqueoId)

        if (error) throw error

        revalidatePath('/historial_caja')
        revalidatePath('/inicio')
        return { success: true }
    } catch (err: any) {
        console.error('[updateArqueoEntry] Error:', err)
        return { success: false, error: err.message }
    }
}
