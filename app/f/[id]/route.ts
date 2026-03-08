import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
        return new NextResponse("ID no proporcionado", { status: 400 })
    }

    const decodedId = decodeURIComponent(id)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl) {
         console.error("Falta NEXT_PUBLIC_SUPABASE_URL")
         return new NextResponse("Error interno del servidor", { status: 500 })
    }

    // Reconstruct the full public URL for the storage file.
    // The bucket is 'facturas'. The decodedId is 'uuid/file.pdf'
    const fullArchivoUrl = `${supabaseUrl}/storage/v1/object/public/facturas/${decodedId}`

    try {
        const fileResponse = await fetch(fullArchivoUrl)
        
        if (!fileResponse.ok) {
            return new NextResponse("Error obteniendo la factura o no encontrada", { status: fileResponse.status })
        }
        
        const blob = await fileResponse.blob()
        
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="documento.pdf"`,
            },
        })
    } catch (err) {
        console.error("Error proxying PDF:", err)
        return new NextResponse("Error interno recuperando el archivo", { status: 500 })
    }
}
