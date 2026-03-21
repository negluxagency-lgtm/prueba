'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRequiredSession } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

interface SellProductData {
    productoId: number
    nombreProducto: string
    precioVenta: number
    cantidad: number
    metodoPago: string
}

interface ActionResponse {
    success: boolean
    error?: string
}

export async function registerProductSale(data: SellProductData): Promise<ActionResponse> {
    const { productoId, nombreProducto, precioVenta, cantidad, metodoPago } = data

    try {
        const user = await getRequiredSession();
        const supabase = await createClient();

        // [RESILIENCIA] Inserción con reintento ante colisión de secuencias (SOP Mantenimiento)
        let insertError = null;
        for (let i = 0; i < 3; i++) {
            const { error } = await supabase
                .from('ventas_productos')
                .insert({
                    barberia_id: user.id,
                    nombre_producto: nombreProducto,
                    precio: precioVenta,
                    cantidad: cantidad,
                    metodo_pago: metodoPago
                });
            
            if (!error) {
                insertError = null;
                break;
            }
            insertError = error;
            if (error.code === '23505' && i < 2) {
                logger.warn('ACTIONS', 'Colisión de secuencia detectada. Reintentando...', { attempt: i + 1, productoId }, user.id);
                continue; // Retry on duplicate key
            }
            break;
        }

        if (insertError) {
            logger.error('ACTIONS', 'Error al insertar venta de producto', { error: insertError, data }, user.id);
            console.error('Error inserting product sale:', insertError)
            return { success: false, error: 'Error al registrar la venta: ' + insertError.message }
        }

        // Update product stock and venta count
        const { data: product } = await supabase
            .from('productos')
            .select('stock, venta')
            .eq('id', productoId)
            .single()

        if (product) {
            const { error: updateError } = await supabase
                .from('productos')
                .update({
                    stock: (product.stock || 0) - cantidad,
                    venta: (product.venta || 0) + cantidad
                })
                .eq('id', productoId)

            if (updateError) {
                console.error('Error updating product stock:', updateError)
            }
        }

        revalidatePath('/productos')
        revalidatePath('/inicio')

        logger.info('ACTIONS', 'Venta de producto registrada con éxito', { productoId, cantidad, total: precioVenta * cantidad }, user.id);

        return { success: true }

    } catch (error: any) {
        console.error('Unexpected error:', error)
        return { success: false, error: error.message || 'Ha ocurrido un error inesperado.' }
    }
}
