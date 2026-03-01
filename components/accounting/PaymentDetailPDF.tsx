import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#18181B',
        paddingBottom: 10,
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#18181B',
    },
    reportTitle: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: 'bold',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    period: {
        fontSize: 10,
        color: '#71717A',
        marginTop: 2,
    },
    methodPill: {
        marginTop: 8,
        padding: '4 10',
        backgroundColor: '#F59E0B10',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#F59E0B30',
        alignSelf: 'flex-start',
    },
    methodText: {
        fontSize: 8,
        color: '#F59E0B',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    table: {
        marginTop: 20,
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#E4E4E7',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F4F4F5',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E4E7',
    },
    headerCell: {
        padding: 6,
        fontSize: 7,
        fontWeight: 'bold',
        color: '#18181B',
        textTransform: 'uppercase',
        borderRightWidth: 1,
        borderRightColor: '#E4E4E7',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F4F5',
    },
    cell: {
        padding: 6,
        fontSize: 8,
        color: '#3F3F46',
        borderRightWidth: 1,
        borderRightColor: '#E4E4E7',
    },
    cellRight: {
        textAlign: 'right',
    },
    cellCenter: {
        textAlign: 'center',
    },
    // Column widths
    colDate: { width: '15%' },
    colClient: { width: '25%' },
    colService: { width: '35%' },
    colAmount: { width: '25%' },

    summarySection: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    footer: {
        marginTop: 40,
        fontSize: 7,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
    }
})

interface PaymentEntry {
    date: string
    client: string
    service: string
    amount: number
}

interface PaymentDetailPDFProps {
    data: {
        shopName: string
        month: string
        paymentMethod: string
        entries: PaymentEntry[]
        totalAmount: number
        timestamp: string
    }
}

export function PaymentDetailPDF({ data }: PaymentDetailPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.shopName}>{data.shopName}</Text>
                    <Text style={styles.reportTitle}>Informe Mensual Por Pagos</Text>
                    <Text style={styles.period}>Período: {data.month}</Text>
                    <View style={styles.methodPill}>
                        <Text style={styles.methodText}>Método: {data.paymentMethod}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.colDate]}>Fecha</Text>
                        <Text style={[styles.headerCell, styles.colClient]}>Cliente</Text>
                        <Text style={[styles.headerCell, styles.colService]}>Servicio</Text>
                        <Text style={[styles.headerCell, styles.colAmount, styles.cellRight, { borderRightWidth: 0 }]}>Importe</Text>
                    </View>

                    {data.entries.length > 0 ? (
                        data.entries.map((entry, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.cell, styles.colDate]}>{entry.date}</Text>
                                <Text style={[styles.cell, styles.colClient]}>{entry.client}</Text>
                                <Text style={[styles.cell, styles.colService]}>{entry.service}</Text>
                                <Text style={[styles.cell, styles.colAmount, styles.cellRight, { borderRightWidth: 0 }]}>
                                    {entry.amount.toFixed(2)}€
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={[styles.cell, { width: '100%', textAlign: 'center', borderRightWidth: 0 }]}>
                                No hay cobros registrados con este método en el período seleccionado.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Cobrado ({data.paymentMethod}):</Text>
                        <Text style={styles.summaryValue}>{data.totalAmount.toFixed(2)}€</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Informe generado automáticamente por Nelux el {data.timestamp}. Todos los importes están en Euros (€).
                </Text>
            </Page>
        </Document>
    )
}
