import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ bucket: string, path: string[] }> }
) {
    const { bucket, path } = await params;
    
    if (!bucket || !path || path.length === 0) {
        return new NextResponse("Parámetros insuficientes", { status: 400 })
    }

    const fullPath = path.join('/');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl) {
         console.error("Falta NEXT_PUBLIC_SUPABASE_URL")
         return new NextResponse("Error interno del servidor", { status: 500 })
    }

    // Reconstruir la URL pública de Supabase
    const supabaseFileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fullPath}`

    try {
        const fileResponse = await fetch(supabaseFileUrl)
        
        if (!fileResponse.ok) {
            return new NextResponse("Recurso no encontrado", { status: fileResponse.status })
        }
        
        const blob = await fileResponse.blob()
        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream'
        
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (err) {
        console.error("Error proxying media:", err)
        return new NextResponse("Error interno recuperando el archivo", { status: 500 })
    }
}
