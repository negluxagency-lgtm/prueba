'use server'

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoicePDF } from '@/components/dashboard/InvoicePDF'
import QRCode from 'qrcode'

export interface FacturaVerifactuData {
    barberia_id: string
    titulo: string
    tipo: string
    fecha_documento: string
    importe_total: number
    es_rectificativa?: boolean
    factura_original_id?: string
    // Datos opcionales para el PDF y registro
    cliente_nombre?: string
    cliente_telefono?: string
    cliente_email?: string
    cliente_cif?: string
    nombre_servicio?: string
}

export async function emitirFacturaVerifactu(data: FacturaVerifactuData) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener la última factura GLOBAL para el encadenamiento
        const { data: lastInvoice, error: lastInvoiceError } = await supabase
            .from('facturas_emitidas')
            .select('huella_hash, id')
            .order('id', { ascending: false })
            .limit(1)
            .single()

        // Ignoramos error si no hay filas, significa que es la primera factura
        if (lastInvoiceError && lastInvoiceError.code !== 'PGRST116') {
            console.error("Error obteniendo última factura:", lastInvoiceError)
            return { success: false, error: `Lectura BD: ${lastInvoiceError.message} (${lastInvoiceError.code})` }
        }

        const hashAnterior = lastInvoice?.huella_hash || ''

        // 2. Generar Número de Factura (Secuencial o temporal)
        const numeroFactura = `INV-${Date.now().toString().slice(-6)}`
        const tituloFactura = data.es_rectificativa ? `[Anulada] ${data.titulo}` : data.titulo;

        // 3. Crear el string a hashear
        // NIF_Barbero + Numero_Factura + Fecha_Expedicion + Importe_Total + hash_anterior
        // Como no tenemos el NIF directamente en la data de entrada, deberíamos obtenerlo o mandar el ID de barbería

        // Obtenemos los datos de la barbería para el PDF y el Hash
        const { data: profile } = await supabase
            .from('perfiles')
            .select('"CIF/NIF", nombre_barberia, "Direccion", telefono, correo')
            .eq('id', data.barberia_id)
            .single()

        const nifBarbero = profile?.['CIF/NIF'] || 'SIN_NIF'

        const cadenaParaHash = `${nifBarbero}|${numeroFactura}|${data.fecha_documento}|${data.importe_total}|${hashAnterior}`

        // 4. Generar SHA-256
        const huellaHash = crypto.createHash('sha256').update(cadenaParaHash).digest('hex')

        // 4.5. Calcular ruta del storage determinísticamente
        const fYear = new Date(data.fecha_documento).getFullYear();
        const storagePath = `${data.barberia_id}/${fYear}/${numeroFactura}.pdf`;

        // 5. Insertar en log inmutable central (facturas_emitidas) con toda la metadata
        const insertHashData = {
            barberia_id: data.barberia_id,
            numero_factura: numeroFactura,
            fecha_documento: data.fecha_documento,
            importe_total: data.importe_total,
            titulo: tituloFactura,
            tipo: data.tipo,
            hash_anterior: hashAnterior,
            huella_hash: huellaHash,
            registro_sistema: new Date().toISOString(),
            pdf_storage_path: storagePath,
            cliente_nombre: data.cliente_nombre || null,
            cliente_telefono: data.cliente_telefono || null,
            cliente_email: data.cliente_email || null,
            cliente_cif: data.cliente_cif || null
        }

        const { data: nuevaFacturaEmitida, error: insertHashError } = await supabase
            .from('facturas_emitidas')
            .insert(insertHashData)
            .select('*')
            .single()

        if (insertHashError) {
            console.error("Error insertando hash en log:", insertHashError)
            return { success: false, error: insertHashError.message }
        }

        // 6. Generación y Subida de PDF al Storage (Async, no bloquea la respuesta legal si falla la subida)
        try {
            // Generar URL del QR para el PDF (Igual que en el frontend)
            const [pYear, pMonth, pDay] = data.fecha_documento.split('-');
            const formattedDate = `${pDay}-${pMonth}-${pYear}`;
            const totalStr = Number(data.importe_total).toFixed(2);
            const qrString = `https://www2.agenciatributaria.gob.es/wlpl/VERI-FACTU/ConsultaPublica?nif=${nifBarbero}&numSerie=${numeroFactura}&fecha=${formattedDate}&importe=${totalStr}&huella=${huellaHash}`;

            const qrCodeUrl = await QRCode.toDataURL(qrString, {
                margin: 4,
                scale: 6,
                errorCorrectionLevel: 'M',
                type: 'image/png'
            });

            // Preparar datos para el PDF
            const pdfData = {
                shopName: profile?.nombre_barberia || 'Barbería',
                shopAddress: profile?.['Direccion'] || '',
                shopPhone: profile?.telefono || '',
                shopEmail: profile?.correo || '',
                shopCIF: nifBarbero,
                invoiceNumber: numeroFactura,
                date: data.fecha_documento.split('-').reverse().join('/'),
                clientName: data.cliente_nombre || 'Cliente General',
                clientPhone: data.cliente_telefono || '',
                clientEmail: data.cliente_email || '',
                clientCIF: data.cliente_cif || '',
                serviceName: data.nombre_servicio || data.titulo.replace(/\[.*?\]\s*/g, '').trim(),
                price: data.importe_total,
                timestamp: new Date().toLocaleString('es-ES'),
                creationTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                qrCodeUrl: qrCodeUrl,
                huellaHash: huellaHash,
                hashAnterior: hashAnterior
            }

            // Renderizar PDF a Buffer
            // @ts-ignore
            const buffer = await renderToBuffer(React.createElement(InvoicePDF, { data: pdfData }));

            // Subir al bucket 'facturas-legales'
            const { error: uploadError } = await supabase.storage
                .from('facturas-legales')
                .upload(storagePath, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error("Error subiendo PDF al Storage:", uploadError);
                // No retornamos error aquí para no romper el flujo legal
            }
        } catch (pdfErr) {
            console.error("Error crítico en proceso de PDF:", pdfErr);
        }

        return {
            success: true,
            factura: {
                ...nuevaFacturaEmitida,
                huella_hash: huellaHash,
                hash_anterior: hashAnterior,
                numero_factura: numeroFactura
            }
        }

    } catch (err: any) {
        console.error("Error crítico VERI*FACTU:", err)
        return { success: false, error: err.message || 'Error desconocido' }
    }
}
