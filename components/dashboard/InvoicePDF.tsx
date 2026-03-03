import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 50,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: 2,
        borderBottomColor: '#18181B',
        paddingBottom: 20,
        marginBottom: 30,
    },
    shopInfo: {
        width: '60%',
    },
    shopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#18181B',
    },
    shopDetails: {
        fontSize: 10,
        color: '#71717A',
        marginTop: 4,
    },
    invoiceMeta: {
        width: '35%',
        textAlign: 'right',
    },
    invoiceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F59E0B',
        textTransform: 'uppercase',
    },
    metaLabel: {
        fontSize: 8,
        color: '#A1A1AA',
        marginTop: 10,
        textTransform: 'uppercase',
    },
    metaValue: {
        fontSize: 10,
        color: '#18181B',
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#71717A',
        textTransform: 'uppercase',
        borderBottom: 1,
        borderBottomColor: '#E4E4E7',
        paddingBottom: 5,
        marginBottom: 10,
    },
    clientInfo: {
        fontSize: 12,
        color: '#18181B',
        lineHeight: 1.5,
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
        borderBottom: 1,
        borderBottomColor: '#E4E4E7',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#F4F4F5',
        padding: 8,
    },
    thDesc: { width: '70%', fontSize: 9, fontWeight: 'bold' },
    thPrice: { width: '30%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
    tdDesc: { width: '70%', fontSize: 10 },
    tdPrice: { width: '30%', fontSize: 10, textAlign: 'right' },

    totalSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalBox: {
        width: '100%',
        backgroundColor: '#18181B',
        padding: 15,
        borderRadius: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#A1A1AA',
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 50,
        right: 50,
        textAlign: 'center',
        borderTop: 1,
        paddingTop: 10,
        fontSize: 8,
        color: '#A1A1AA',
    },
    qrSection: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        borderTop: 1,
        borderTopColor: '#E4E4E7',
        paddingTop: 15,
    },
    qrImage: {
        width: 80,
        height: 80,
    },
    hashText: {
        fontSize: 6,
        color: '#71717A',
        fontFamily: 'Courier',
        width: '70%',
    },
    legalText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#18181B',
        textAlign: 'center',
        marginTop: 10,
    },
    avisoLegal: {
        fontSize: 6,
        color: '#71717A',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 1.6,
        paddingHorizontal: 10,
    }
})

interface InvoicePDFProps {
    data: {
        shopName: string
        shopAddress?: string
        shopPhone?: string
        shopEmail?: string
        shopCIF?: string
        invoiceNumber: string
        date: string
        clientName: string
        clientPhone: string
        clientEmail?: string
        clientCIF?: string
        serviceName: string
        price: number
        timestamp: string
        creationTime: string
        qrCodeUrl?: string
        huellaHash?: string
        hashAnterior?: string
    }
}

export function InvoicePDF({ data }: InvoicePDFProps) {
    const ivaRate = 0.21;
    const baseImponible = data.price / (1 + ivaRate);
    const ivaImporte = data.price - baseImponible;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{data.shopName}</Text>
                        <View style={{ marginTop: 8 }}>
                            {data.shopAddress && <Text style={styles.shopDetails}>{data.shopAddress}</Text>}
                            {data.shopCIF && <Text style={styles.shopDetails}>CIF/NIF: {data.shopCIF}</Text>}
                            {data.shopPhone && <Text style={styles.shopDetails}>Teléfono: {data.shopPhone}</Text>}
                            {data.shopEmail && <Text style={styles.shopDetails}>Email: {data.shopEmail}</Text>}
                        </View>
                    </View>
                    <View style={styles.invoiceMeta}>
                        <Text style={styles.invoiceTitle}>Factura</Text>
                        <Text style={styles.metaLabel}>Nº Factura</Text>
                        <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
                        <Text style={styles.metaLabel}>Fecha</Text>
                        <Text style={styles.metaValue}>{data.date}</Text>
                        <Text style={styles.metaLabel}>Hora de Creación</Text>
                        <Text style={styles.metaValue}>{data.creationTime}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Cliente</Text>
                    <Text style={[styles.clientInfo, { fontWeight: 'bold' }]}>{data.clientName}</Text>
                    {data.clientCIF && <Text style={styles.clientInfo}>CIF/NIF: {data.clientCIF}</Text>}
                    {data.clientPhone && <Text style={styles.clientInfo}>Tel: {data.clientPhone}</Text>}
                    {data.clientEmail && <Text style={styles.clientInfo}>{data.clientEmail}</Text>}
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.thDesc}>Descripción del Servicio</Text>
                        <Text style={styles.thPrice}>Importe</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tdDesc}>{data.serviceName}</Text>
                        <Text style={styles.tdPrice}>{data.price.toFixed(2)}€</Text>
                    </View>
                </View>

                <View style={[styles.totalSection, { marginTop: 40 }]}>
                    <View style={{ width: '45%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ fontSize: 9, color: '#71717A' }}>Base Imponible:</Text>
                            <Text style={{ fontSize: 9, color: '#18181B' }}>{baseImponible.toFixed(2)}€</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{ fontSize: 9, color: '#71717A' }}>IVA (21%):</Text>
                            <Text style={{ fontSize: 9, color: '#18181B' }}>{ivaImporte.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.totalBox}>
                            <Text style={styles.totalLabel}>Total Factura</Text>
                            <Text style={styles.totalValue}>{data.price.toFixed(2)}€</Text>
                        </View>
                    </View>
                </View>

                {data.qrCodeUrl && data.huellaHash && (
                    <>
                        <View style={styles.qrSection}>
                            <Image src={data.qrCodeUrl} style={styles.qrImage} />
                            <View>
                                <Text style={styles.hashText}>Huella Hash: {data.huellaHash}</Text>
                                {data.hashAnterior && <Text style={styles.hashText}>Hash Anterior: {data.hashAnterior}</Text>}
                                <Text style={styles.legalText}>Factura generada por software de facturación que cumple con la normativa VERI*FACTU</Text>
                            </View>
                        </View>
                        <Text style={styles.avisoLegal}>
                            Aviso Legal: Este código QR contiene la huella digital de la factura conforme a la Ley 11/2021. La verificación en la sede de la AEAT será efectiva una vez el dueño de la barbería realice la remisión de la factura mediante su certificado digital personal o a través de su gestoría autorizada. Hasta ese momento el QR no mostrará la información, sin embargo, esto no quiere decir que sea una factura inválida o esté fuera de la ley, el código QR es solo un indicativo.
                        </Text>
                    </>
                )}

                <View style={styles.footer}>
                    <Text>Gracias por confiar en {data.shopName}.</Text>
                    <Text style={{ marginTop: 2 }}>Documento generado electrónicamente el {data.timestamp}</Text>
                </View>
            </Page>
        </Document>
    )
}
