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
    colIncome: { width: '15%' },
    colExpense: { width: '15%' },
    colReason: { width: '45%' },
    colDeductible: { width: '10%' },

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
        fontSize: 9,
        color: '#4B5563',
    },
    summaryValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
    },
    balanceHighlight: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#D1D5DB',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    balanceValue: {
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

interface ReportEntry {
    date: string
    income: number
    expense: number
    reason: string
    deductible: boolean
}

interface AccountingDetailPDFProps {
    data: {
        shopName: string
        month: string
        entries: ReportEntry[]
        totalIncome: number
        totalExpenses: number
        totalDeductible: number
        timestamp: string
    }
}

export function AccountingDetailPDF({ data }: AccountingDetailPDFProps) {
    const balanceWithDeductible = data.totalIncome - data.totalExpenses
    const balanceWithoutDeductible = data.totalIncome - (data.totalExpenses - data.totalDeductible)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.shopName}>{data.shopName}</Text>
                    <Text style={styles.reportTitle}>Libro Diario de Contabilidad</Text>
                    <Text style={styles.period}>Período: {data.month}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.colDate]}>Día</Text>
                        <Text style={[styles.headerCell, styles.colIncome, styles.cellRight]}>Ingresos</Text>
                        <Text style={[styles.headerCell, styles.colExpense, styles.cellRight]}>Gastos</Text>
                        <Text style={[styles.headerCell, styles.colReason]}>Motivo / Concepto</Text>
                        <Text style={[styles.headerCell, styles.colDeductible, styles.cellCenter, { borderRightWidth: 0 }]}>Ded.</Text>
                    </View>

                    {data.entries.map((entry, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.colDate]}>{entry.date}</Text>
                            <Text style={[styles.cell, styles.colIncome, styles.cellRight]}>
                                {entry.income > 0 ? `${entry.income.toFixed(2)}€` : '-'}
                            </Text>
                            <Text style={[styles.cell, styles.colExpense, styles.cellRight]}>
                                {entry.expense > 0 ? `${entry.expense.toFixed(2)}€` : '-'}
                            </Text>
                            <Text style={[styles.cell, styles.colReason]}>{entry.reason}</Text>
                            <Text style={[styles.cell, styles.colDeductible, styles.cellCenter, { borderRightWidth: 0 }]}>
                                {entry.deductible ? 'Sí' : 'No'}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Ingresos Brutos:</Text>
                        <Text style={styles.summaryValue}>{data.totalIncome.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Gastos Operativos:</Text>
                        <Text style={styles.summaryValue}>{data.totalExpenses.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Gastos Deducibles (IVA/Empresa):</Text>
                        <Text style={styles.summaryValue}>{data.totalDeductible.toFixed(2)}€</Text>
                    </View>

                    <View style={styles.balanceHighlight}>
                        <Text style={styles.balanceLabel}>Balance Real (Caja final):</Text>
                        <Text style={styles.balanceValue}>{balanceWithDeductible.toFixed(2)}€</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Balance sin contar gastos deducibles:</Text>
                        <Text style={styles.summaryValue}>{balanceWithoutDeductible.toFixed(2)}€</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Informe generado automáticamente por Nelux el {data.timestamp}. Todos los importes están en Euros (€).
                </Text>
            </Page>
        </Document>
    )
}
