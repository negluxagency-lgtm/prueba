import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Estilos corporativos para el PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
        borderBottom: 2,
        borderBottomColor: '#F59E0B',
        paddingBottom: 10,
    },
    shopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#18181B',
        textTransform: 'uppercase',
    },
    documentTitle: {
        fontSize: 10,
        color: '#71717A',
        marginTop: 4,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    infoBlock: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 8,
        color: '#A1A1AA',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#18181B',
    },
    table: {
        width: 'auto',
        marginBottom: 40,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#18181B',
        padding: 8,
        borderRadius: 4,
    },
    tableHeaderCell: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F4F5',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tableCellLabel: {
        flex: 2,
        fontSize: 10,
        color: '#3F3F46',
    },
    tableCellValue: {
        flex: 1,
        fontSize: 10,
        textAlign: 'right',
        fontWeight: 'bold',
        color: '#18181B',
    },
    totalSection: {
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#18181B',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    footer: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBlock: {
        width: 180,
        borderTopWidth: 1,
        borderTopColor: '#D4D4D8',
        paddingTop: 8,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#71717A',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    timestamp: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 7,
        color: '#D4D4D8',
        textAlign: 'center',
    }
})

interface SalaryReportPDFProps {
    data: {
        shopName: string
        month: string
        barberName: string
        baseSalary: number
        commissionAmount: number
        extraHoursCount: number
        extraHoursAmount: number
        bonusAmount: number
        totalNeto: number
        totalRevenue: number
        totalCuts: number
        timestamp: string
    }
}

export function SalaryReportPDF({ data }: SalaryReportPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Cabecera */}
                <View style={styles.header}>
                    <Text style={styles.shopName}>{data.shopName}</Text>
                    <Text style={styles.documentTitle}>Recibo de Liquidación Salarial</Text>
                </View>

                {/* Info General */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Empleado</Text>
                        <Text style={styles.value}>{data.barberName}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Período</Text>
                        <Text style={styles.value}>{data.month}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Nº Servicios</Text>
                        <Text style={styles.value}>{data.totalCuts}</Text>
                    </View>
                </View>

                {/* Tabla de Conceptos */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Concepto</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Información / Importe</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCellLabel}>Sueldo Base Mensual</Text>
                        <Text style={styles.tableCellValue}>{data.baseSalary.toFixed(2)}€</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCellLabel}>Comisiones por Facturación ({((data.commissionAmount / data.totalRevenue) * 100 || 0).toFixed(0)}%)</Text>
                        <Text style={styles.tableCellValue}>{data.commissionAmount.toFixed(2)}€</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCellLabel}>Horas Extra Realizadas (Informativo)</Text>
                        <Text style={styles.tableCellValue}>{data.extraHoursCount.toFixed(1)} Horas</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCellLabel}>Horas Extra / Bonus</Text>
                        <Text style={styles.tableCellValue}>{(data.bonusAmount + data.extraHoursAmount).toFixed(2)}€</Text>
                    </View>
                </View>

                {/* Total Neto */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>TOTAL NETO A PERCIBIR</Text>
                    <Text style={styles.totalAmount}>{data.totalNeto.toFixed(2)}€</Text>
                </View>

                {/* Firmas */}
                <View style={styles.footer}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Firma de la Empresa</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Firma del Empleado (Recibí)</Text>
                    </View>
                </View>

                {/* Marca de agua / Timestamp */}
                <Text style={styles.timestamp}>
                    Documento generado el {data.timestamp} - Sistema de Gestión Nelux. Nota: Las horas extra no tienen impacto económico automático.
                </Text>
            </Page>
        </Document>
    )
}
