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
    table: {
        marginTop: 30,
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
        padding: 8,
        fontSize: 8,
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
        padding: 8,
        fontSize: 9,
        color: '#3F3F46',
        borderRightWidth: 1,
        borderRightColor: '#E4E4E7',
        textAlign: 'right',
    },
    cellName: {
        textAlign: 'left',
        flex: 2,
    },
    cellAmount: {
        flex: 1,
    },
    summarySection: {
        marginTop: 40,
        padding: 20,
        backgroundColor: '#18181B',
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    summaryAmount: {
        fontSize: 18,
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 50,
        fontSize: 8,
        color: '#A1A1AA',
        textAlign: 'center',
        fontStyle: 'italic',
    }
})

interface AccountantReportPDFProps {
    data: {
        shopName: string
        month: string
        barbers: Array<{
            nombre: string
            baseSalary: number
            commission: number
            extraHours: number
            bonus: number
            total: number
        }>
        totalPayroll: number
        timestamp: string
    }
}

export function AccountantReportPDF({ data }: AccountantReportPDFProps) {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.shopName}>{data.shopName}</Text>
                    <Text style={styles.reportTitle}>Informe Consolidado de Liquidación (Contabilidad)</Text>
                    <Text style={styles.period}>Período: {data.month}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.cellName]}>Barbero / Empleado</Text>
                        <Text style={[styles.headerCell, styles.cellAmount]}>Sueldo Base</Text>
                        <Text style={[styles.headerCell, styles.cellAmount]}>Comisiones</Text>
                        <Text style={[styles.headerCell, styles.cellAmount]}>Horas Extra</Text>
                        <Text style={[styles.headerCell, styles.cellAmount]}>Bonus/Inc.</Text>
                        <Text style={[styles.headerCell, styles.cellAmount, { borderRightWidth: 0 }]}>Total Neto</Text>
                    </View>

                    {data.barbers.map((b, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.cellName]}>{b.nombre}</Text>
                            <Text style={[styles.cell, styles.cellAmount]}>{b.baseSalary.toFixed(2)}€</Text>
                            <Text style={[styles.cell, styles.cellAmount]}>{b.commission.toFixed(2)}€</Text>
                            <Text style={[styles.cell, styles.cellAmount]}>{b.extraHours.toFixed(2)}€</Text>
                            <Text style={[styles.cell, styles.cellAmount]}>{b.bonus.toFixed(2)}€</Text>
                            <Text style={[styles.cell, styles.cellAmount, { borderRightWidth: 0, fontWeight: 'bold' }]}>{b.total.toFixed(2)}€</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summarySection}>
                    <Text style={styles.summaryLabel}>CARGA SALARIAL TOTAL DEL PERÍODO</Text>
                    <Text style={styles.summaryAmount}>{data.totalPayroll.toFixed(2)}€</Text>
                </View>

                <Text style={styles.footer}>
                    Generado automáticamente por Nelux el {data.timestamp}. Este documento resume las obligaciones de pago de la empresa.
                </Text>
            </Page>
        </Document>
    )
}
