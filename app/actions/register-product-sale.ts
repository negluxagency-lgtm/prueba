'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface SellProductData {
    productoId: number
    nombreProducto: string
    precioVenta: number
    cantidad: number
}

interface ActionResponse {
    success: boolean
    error?: string
}

export async function registerProductSale(data: SellProductData): Promise<ActionResponse> {
    const { productoId, nombreProducto, precioVenta, cantidad } = data

    try {
        // Get session via cookies
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { success: false, error: 'No se pudo identificar al usuario' }
        }

        // Insert into ventas_productos
        const { error: insertError } = await supabase
            .from('ventas_productos')
            .insert({
                barberia_id: user.id,
                nombre_producto: nombreProducto,
                precio: precioVenta,
                cantidad: cantidad
            })

        if (insertError) {
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
                // Don't fail the whole operation if stock update fails
            }
        }

        // Revalidate pages
        revalidatePath('/productos')
        revalidatePath('/inicio')

        return { success: true }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: 'Ha ocurrido un error inesperado.' }
    }
}
