import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generarXMLVerifactu, buildVerifactuPayload, FacturaVerifactuXMLData } from '@/app/actions/verifactu-xml'

/**
 * POST /api/verifactu/generate-xml
 *
 * Body esperado:
 * {
 *   facturaIds: number[]   // IDs de la tabla 'facturas' a incluir en el XML
 * }
 *
 * Devuelve el XML SOAP como descarga directa (text/xml).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { facturaIds } = body as { facturaIds?: number[] }

        if (!facturaIds || facturaIds.length === 0) {
            return NextResponse.json({ error: 'Debes proporcionar al menos un ID de factura.' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Obtener las facturas emitidas (solo con archivo_url vacío → facturas VERI*FACTU)
        const { data: facturas, error: facturasError } = await supabase
            .from('facturas')
            .select('id, barberia_id, titulo, fecha_documento, tipo')
            .in('id', facturaIds)
            .or('archivo_url.is.null,archivo_url.eq.')

        if (facturasError || !facturas || facturas.length === 0) {
            return NextResponse.json({ error: 'No se encontraron facturas válidas.' }, { status: 404 })
        }

        // 2. Obtener el perfil de la barbería (NIF, nombre) — usamos barberia_id de la primera factura
        const barberia_id = facturas[0].barberia_id
        const { data: perfil, error: perfError } = await supabase
            .from('perfiles')
            .select('"CIF/NIF", nombre_barberia')
            .eq('id', barberia_id)
            .single()

        if (perfError || !perfil || !perfil['CIF/NIF']) {
            return NextResponse.json({ error: 'No se encontró el CIF/NIF de la barbería. Por favor, configúralo primero.' }, { status: 400 })
        }

        // 3. Obtener el log de hashes (facturas_emitidas) para el encadenamiento
        const { data: hashLog } = await supabase
            .from('facturas_emitidas')
            .select('huella_hash, hash_anterior, registro_sistema')
            .order('id', { ascending: true })

        const hashMap = hashLog || []

        // 4. Construir el array de FacturaVerifactuXMLData
        const payloads: FacturaVerifactuXMLData[] = []

        for (let i = 0; i < facturas.length; i++) {
            const factura = facturas[i]

            // Extraer el precio desde el título (estructura: [INV-XXXXXX] descripcion)
            // El precio real lo deberá proveer la integración futura con datos de cita.
            // Por ahora inferimos 0 si no está disponible.
            // TODO: unir con tabla 'citas' cuando se almacene el vínculo.
            const precio = 0 // placeholder — se requiere relación con citas o campo precio

            // Buscar el hash correspondiente a esta factura en el log global
            // El log tiene el mismo orden de inserción que las facturas
            const hashEntry = hashMap[i]
            const huellaActual = hashEntry?.huella_hash || ''
            const huellaAnterior = hashEntry?.hash_anterior || ''

            const payload = await buildVerifactuPayload(
                { titulo: factura.titulo, fecha_documento: factura.fecha_documento },
                { nif: perfil['CIF/NIF'] || '', nombre: perfil.nombre_barberia || '' },
                huellaActual,
                huellaAnterior,
                precio
            )

            payloads.push(payload)
        }

        // 5. Generar el XML SOAP
        const resultado = await generarXMLVerifactu(payloads)

        if (!resultado.success) {
            return NextResponse.json({ error: resultado.error }, { status: 500 })
        }

        // 6. Devolver como descarga de fichero XML
        return new NextResponse(resultado.xml, {
            status: 200,
            headers: {
                'Content-Type': 'text/xml; charset=UTF-8',
                'Content-Disposition': `attachment; filename="verifactu_${new Date().toISOString().split('T')[0]}.xml"`
            }
        })

    } catch (err: any) {
        console.error('[API] /api/verifactu/generate-xml error:', err)
        return NextResponse.json({ error: err.message || 'Error interno del servidor.' }, { status: 500 })
    }
}
