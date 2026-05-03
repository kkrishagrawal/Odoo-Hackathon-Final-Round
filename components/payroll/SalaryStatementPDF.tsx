"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

export interface SalaryStatementPDFProps {
    companyName: string;
    employeeName: string;
    designation?: string;
    dateOfJoining?: string;
    year: number;
    months: number;

    earnings: Record<string, number>;
    deductions: Record<string, number>;
    totals: {
        gross: number;
        deductions: number;
        net: number;
    };
}

// 🎨 Keep consistent with PayslipPDF style
const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 10,
        fontFamily: "Helvetica",
    },

    header: {
        marginBottom: 12,
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 6,
    },

    title: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 4,
    },

    subText: {
        fontSize: 10,
        color: "#374151",
    },

    section: {
        marginVertical: 8,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    table: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginTop: 10,
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 1,
        borderColor: "#e5e7eb",
        fontWeight: 600,
    },

    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#f3f4f6",
    },

    cell: {
        flex: 1,
        padding: 6,
    },

    right: {
        textAlign: "right",
    },

    bold: {
        fontWeight: 600,
    },

    totalRow: {
        flexDirection: "row",
        backgroundColor: "#f9fafb",
        borderTopWidth: 1,
        borderColor: "#e5e7eb",
    },
});

// Helper
const format = (n: number) => `${n.toFixed(2)}`;

export function SalaryStatementPDF(props: SalaryStatementPDFProps) {
    const {
        companyName,
        employeeName,
        designation,
        dateOfJoining,
        year,
        months,
        earnings,
        deductions,
        totals,
    } = props;

    const monthly = (yearly: number) =>
        months ? yearly / months : yearly;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.title}>Salary Statement Report</Text>
                    <Text style={styles.subText}>{companyName}</Text>
                </View>

                {/* EMPLOYEE INFO */}
                <View style={styles.section}>
                    <Text>Name: {employeeName}</Text>
                    {designation && <Text>Designation: {designation}</Text>}
                    {dateOfJoining && (
                        <Text>
                            Date of Joining:{" "}
                            {new Date(dateOfJoining).toLocaleDateString()}
                        </Text>
                    )}
                    <Text>Year: {year}</Text>
                </View>

                {/* TABLE */}
                <View style={styles.table}>
                    {/* HEADER */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.cell}>Component</Text>
                        <Text style={[styles.cell, styles.right]}>
                            Monthly
                        </Text>
                        <Text style={[styles.cell, styles.right]}>
                            Yearly
                        </Text>
                    </View>

                    {/* EARNINGS */}
                    {Object.entries(earnings).map(([key, value]) => (
                        <View key={key} style={styles.tableRow}>
                            <Text style={styles.cell}>
                                {key.replace(/([A-Z])/g, " $1")}
                            </Text>
                            <Text style={[styles.cell, styles.right]}>
                                {format(monthly(value))}
                            </Text>
                            <Text style={[styles.cell, styles.right]}>
                                {format(value)}
                            </Text>
                        </View>
                    ))}

                    {/* DEDUCTIONS */}
                    {Object.entries(deductions).map(([key, value]) => (
                        <View key={key} style={styles.tableRow}>
                            <Text style={styles.cell}>
                                {key.replace(/([A-Z])/g, " $1")}
                            </Text>
                            <Text style={[styles.cell, styles.right]}>
                                {format(monthly(value))}
                            </Text>
                            <Text style={[styles.cell, styles.right]}>
                                {format(value)}
                            </Text>
                        </View>
                    ))}

                    {/* TOTALS */}
                    <View style={styles.totalRow}>
                        <Text style={[styles.cell, styles.bold]}>
                            Gross Salary
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(monthly(totals.gross))}
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(totals.gross)}
                        </Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={[styles.cell, styles.bold]}>
                            Total Deductions
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(monthly(totals.deductions))}
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(totals.deductions)}
                        </Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={[styles.cell, styles.bold]}>
                            Net Salary
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(monthly(totals.net))}
                        </Text>
                        <Text style={[styles.cell, styles.right, styles.bold]}>
                            {format(totals.net)}
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}