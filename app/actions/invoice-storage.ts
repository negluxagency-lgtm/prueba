'use server'

import { createClient } from '@/utils/supabase/server'
import { getRequiredSession } from '@/lib/auth-utils';

/**
 * Genera una URL firmada (Signed URL) para descargar una factura de forma segura.
 * @param invoiceId El ID de la factura en la tabla 'facturas'
 */
export async function getInvoiceSignedUrl(invoiceId: string) {
    await getRequiredSession();
    try {
        const supabase = await createClient()

        // 1. Obtener la ruta del storage de la factura legal
        const { data: factura, error: fetchError } = await supabase
            .from('facturas_emitidas')
            .select('pdf_storage_path, barberia_id')
            .eq('id', invoiceId)
            .single()

        if (fetchError || !factura) {
            console.error("Error obteniendo factura para descarga:", fetchError)
            return { success: false, error: "No se encontró la factura." }
        }

        if (!factura.pdf_storage_path) {
            return { success: false, error: "Esta factura no tiene un PDF generado aún." }
        }

        // 2. Generar Signed URL (Válida por 5 minutos)
        const { data: signedData, error: signedError } = await supabase.storage
            .from('facturas-legales')
            .createSignedUrl(factura.pdf_storage_path, 300) // 300 segundos = 5 min

        if (signedError || !signedData) {
            console.error("Error generando Signed URL:", signedError)
            return { success: false, error: "Error al generar el enlace de descarga segura." }
        }

        return {
            success: true,
            signedUrl: signedData.signedUrl
        }

    } catch (err: any) {
        console.error("Error crítico en getInvoiceSignedUrl:", err)
        return { success: false, error: err.message || "Error desconocido" }
    }
}
