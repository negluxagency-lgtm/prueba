'use server'

import { getRequiredSession } from '@/lib/auth-utils';

/**
 * =====================================================================
 *  MÓDULO: Generador de XML VERI*FACTU (Ley Antifraude 11/2021)
 * =====================================================================
 *
 *  Este módulo genera el mensaje XML para el Web Service de la AEAT
 *  siguiendo la especificación técnica de VERI*FACTU.
 *
 *  Documentación de referencia:
 *  https://www.agenciatributaria.es/AEAT.internet/Inicio/_Segmentos_/Empresas_y_profesionales/Empresas/IVA/Suministro_Inmediato_de_Informacion/Informacion_tecnica.shtml
 *
 *  Endpoint de PRUEBAS:
 *  https://prewww10.aeat.es/wlpl/RPRE-JDIT/ws/VFactuWSV1IMPL
 *
 *  Endpoint de PRODUCCIÓN (requiere certificado digital):
 *  https://www7.aeat.es/wlpl/RPRE-JDIT/ws/VFactuWSV1IMPL
 *
 *  AVISO: La firma digital del mensaje SOAP (XMLDSig) requiere un
 *  certificado digital de representante (FNMT o equivalente) que
 *  se integrará en una fase posterior.
 * =====================================================================
 */

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

export interface FacturaVerifactuXMLData {
    // Datos del Emisor (Obligatorio)
    nif: string
    nombre: string
    // Cabecera de Identificación
    idSistema: string         // Nombre del software (ej: "NeluxSaaS")
    versionSistema: string    // Versión del software
    numInstalacion: string    // Identificador de instalación (ej: "NELUX-001")
    // Datos de la Factura
    numSerie: string          // Número/Serie: ej. "INV-123456"
    fechaExpedicion: string   // YYYY-MM-DD
    horaExpedicion: string    // HH:MM:SS
    // Destinatario
    clienteNombre?: string
    clienteNIF?: string       // Opcional si es B2C
    // Datos Económicos
    baseImponible: number     // Base antes de IVA
    tipoIVA: number           // Tipo impositivo: 21, 10, 4
    cuotaIVA: number          // Importe del IVA
    importeTotal: number      // Total factura
    // Descripción del Servicio
    descripcion: string
    // Hash encadenado
    huellaAnterior: string    // SHA-256 de la factura anterior (o '' si es la primera)
    huellaActual: string      // SHA-256 de esta factura
    // Tipo de Factura
    esRectificativa?: boolean
    numSerieFacturaRectificada?: string
    fechaFacturaRectificada?: string
}

// ---------------------------------------------------------------------------
// HELPER: Escapar caracteres XML
// ---------------------------------------------------------------------------
function escapeXml(val: string | number | undefined): string {
    if (val === undefined || val === null) return ''
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

// ---------------------------------------------------------------------------
// HELPER: Formatear fecha de YYYY-MM-DD a DD-MM-YYYY (formato AEAT)
// ---------------------------------------------------------------------------
function formatDateAEAT(isoDate: string): string {
    const [y, m, d] = isoDate.split('-')
    return `${d}-${m}-${y}`
}

// ---------------------------------------------------------------------------
// CORE: Generador del XML de Registro de Factura
// ---------------------------------------------------------------------------
function buildRegistroFactura(data: FacturaVerifactuXMLData): string {
    const tipoFactura = data.esRectificativa ? 'R1' : 'F1'
    const fechaFmt = formatDateAEAT(data.fechaExpedicion)
    const baseStr = data.baseImponible.toFixed(2)
    const tipoIVAStr = data.tipoIVA.toFixed(2)
    const cuotaStr = data.cuotaIVA.toFixed(2)
    const totalStr = data.importeTotal.toFixed(2)

    const bloqueRectificativa = data.esRectificativa && data.numSerieFacturaRectificada
        ? `
        <siiLR:FacturasRectificadas>
            <sii:IDFacturaRectificada>
                <sii:NumSerieFacturaEmisor>${escapeXml(data.numSerieFacturaRectificada)}</sii:NumSerieFacturaEmisor>
                <sii:FechaExpedicionFacturaEmisor>${formatDateAEAT(data.fechaFacturaRectificada || data.fechaExpedicion)}</sii:FechaExpedicionFacturaEmisor>
            </sii:IDFacturaRectificada>
        </siiLR:FacturasRectificadas>
        <siiLR:ImporteRectificacion>
            <sii:BaseRectificada>${baseStr}</sii:BaseRectificada>
            <sii:CuotaRectificada>${cuotaStr}</sii:CuotaRectificada>
        </siiLR:ImporteRectificacion>`
        : ''

    const bloqueDestinatario = data.clienteNIF
        ? `
        <siiLR:Contraparte>
            <sii:NombreRazon>${escapeXml(data.clienteNombre)}</sii:NombreRazon>
            <sii:NIF>${escapeXml(data.clienteNIF)}</sii:NIF>
        </siiLR:Contraparte>`
        : ''

    return `
        <siiLR:RegistroFactura>
            <siiLR:IDVersion>1.0</siiLR:IDVersion>
            <siiLR:IDFactura>
                <sii:IDEmisorFactura>
                    <sii:NIF>${escapeXml(data.nif)}</sii:NIF>
                </sii:IDEmisorFactura>
                <sii:NumSerieFactura>${escapeXml(data.numSerie)}</sii:NumSerieFactura>
                <sii:FechaExpedicionFactura>${fechaFmt}</sii:FechaExpedicionFactura>
            </siiLR:IDFactura>

            <siiLR:FacturaExpedida>
                <sii:TipoFactura>${tipoFactura}</sii:TipoFactura>
                <sii:ClaveRegimenEspecialOTrascendencia>01</sii:ClaveRegimenEspecialOTrascendencia>
                <sii:DescripcionOperacion>${escapeXml(data.descripcion)}</sii:DescripcionOperacion>
                ${bloqueDestinatario}
                ${bloqueRectificativa}
                <sii:TipoDesglose>
                    <sii:DesgloseFactura>
                        <sii:Sujeta>
                            <sii:NoExenta>
                                <sii:DetalleNoExenta>
                                    <sii:TipoNoExenta>S1</sii:TipoNoExenta>
                                    <sii:DesgloseIVA>
                                        <sii:DetalleIVA>
                                            <sii:TipoImpositivo>${tipoIVAStr}</sii:TipoImpositivo>
                                            <sii:BaseImponible>${baseStr}</sii:BaseImponible>
                                            <sii:CuotaRepercutida>${cuotaStr}</sii:CuotaRepercutida>
                                        </sii:DetalleIVA>
                                    </sii:DesgloseIVA>
                                </sii:DetalleNoExenta>
                            </sii:NoExenta>
                        </sii:Sujeta>
                    </sii:DesgloseFactura>
                </sii:TipoDesglose>
                <sii:ImporteTotal>${totalStr}</sii:ImporteTotal>
            </siiLR:FacturaExpedida>

            <siiLR:DatosSistemaInformatico>
                <sii:NombreRazon>${escapeXml(data.nombre)}</sii:NombreRazon>
                <sii:NIF>${escapeXml(data.nif)}</sii:NIF>
                <sii:NombreSistemaInformatico>${escapeXml(data.idSistema)}</sii:NombreSistemaInformatico>
                <sii:IdSistemaInformatico>${escapeXml(data.idSistema)}</sii:IdSistemaInformatico>
                <sii:Version>${escapeXml(data.versionSistema)}</sii:Version>
                <sii:NumeroInstalacion>${escapeXml(data.numInstalacion)}</sii:NumeroInstalacion>
                <sii:TipoUsoPosibleSoloVerifactu>S</sii:TipoUsoPosibleSoloVerifactu>
                <sii:TipoUsoPosibleMultiOT>N</sii:TipoUsoPosibleMultiOT>
                <sii:IndicadorMultiplesOT>N</sii:IndicadorMultiplesOT>
            </siiLR:DatosSistemaInformatico>

            <siiLR:Huella>${escapeXml(data.huellaActual)}</siiLR:Huella>
            <siiLR:FechaHoraHusoGenRegistro>${data.fechaExpedicion}T${data.horaExpedicion}+01:00</siiLR:FechaHoraHusoGenRegistro>
        </siiLR:RegistroFactura>`
}

// ---------------------------------------------------------------------------
// CORE: Envuelve en el mensaje SOAP completo para el WS de la AEAT
// ---------------------------------------------------------------------------
function buildSOAPEnvelope(xmlBody: string, nif: string, nombre: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd"
    xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd">
    <soapenv:Header/>
    <soapenv:Body>
        <siiLR:SuministroLRFacturasEmitidas>
            <siiLR:Cabecera>
                <sii:IDVersionSii>1.1</sii:IDVersionSii>
                <sii:Titular>
                    <sii:NombreRazon>${escapeXml(nombre)}</sii:NombreRazon>
                    <sii:NIF>${escapeXml(nif)}</sii:NIF>
                </sii:Titular>
                <sii:TipoComunicacion>A0</sii:TipoComunicacion>
            </siiLR:Cabecera>
            <siiLR:RegistroLRFacturasEmitidas>
                ${xmlBody}
            </siiLR:RegistroLRFacturasEmitidas>
        </siiLR:SuministroLRFacturasEmitidas>
    </soapenv:Body>
</soapenv:Envelope>`
}

// ---------------------------------------------------------------------------
// EXPORT PRINCIPAL: Genera el XML SOAP para una o varias facturas
// ---------------------------------------------------------------------------
export async function generarXMLVerifactu(
    facturas: FacturaVerifactuXMLData[]
): Promise<{ success: true; xml: string } | { success: false; error: string }> {
    await getRequiredSession();
    try {
        if (!facturas || facturas.length === 0) {
            return { success: false, error: 'No se han proporcionado facturas para generar el XML.' }
        }

        const emisor = facturas[0]

        const bloques = facturas.map(buildRegistroFactura).join('\n')
        const xml = buildSOAPEnvelope(bloques, emisor.nif, emisor.nombre)

        return { success: true, xml }
    } catch (err: any) {
        console.error('[VERIFACTU-XML] Error generando XML:', err)
        return { success: false, error: err.message || 'Error desconocido al generar el XML.' }
    }
}

// ---------------------------------------------------------------------------
// EXPORT AUXILIAR: Construye el payload tipado a partir de una factura guardada
// en la tabla 'facturas' (resultado de emitirFacturaVerifactu)
// ---------------------------------------------------------------------------
export async function buildVerifactuPayload(
    factura: {
        titulo: string
        fecha_documento: string        // YYYY-MM-DD
        // El número de factura está codificado en el título como [INV-XXXXXX]
    },
    shop: {
        nif: string
        nombre: string
    },
    huellaActual: string,
    huellaAnterior: string,
    precio: number,
    clienteNombre?: string,
    clienteNIF?: string
): Promise<FacturaVerifactuXMLData> {
    const IVA_PERC = 21
    const base = parseFloat((precio / (1 + IVA_PERC / 100)).toFixed(2))
    const cuota = parseFloat((precio - base).toFixed(2))
    const ahora = new Date()

    // Extraer número de factura del título [INV-XXXXXX]
    const matchNum = factura.titulo.match(/\[(INV-[0-9]+)\]/)
    const numSerie = matchNum ? matchNum[1] : `INV-${Date.now().toString().slice(-6)}`

    const esRectificativa = factura.titulo.includes('[Anulada]')

    return {
        nif: shop.nif,
        nombre: shop.nombre,
        idSistema: 'NeluxSaaS',
        versionSistema: '1.0.0',
        numInstalacion: `NELUX-${shop.nif}`,
        numSerie,
        fechaExpedicion: factura.fecha_documento,
        horaExpedicion: ahora.toTimeString().substring(0, 8),
        clienteNombre,
        clienteNIF,
        baseImponible: base,
        tipoIVA: IVA_PERC,
        cuotaIVA: cuota,
        importeTotal: precio,
        descripcion: factura.titulo.replace(/\[.*?\]\s*/g, '').trim(),
        huellaActual,
        huellaAnterior,
        esRectificativa,
    }
}
