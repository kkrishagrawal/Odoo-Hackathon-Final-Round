"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

// 🎨 Your palette (kept)
const PURPLE = "#714B67";
const TEAL = "#15AABF";
const LIGHT_PURPLE = "#F3EEF8";

// ---- STYLES ----
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: PURPLE,
    },

    header: {
        marginBottom: 10,
    },

    company: {
        fontSize: 14,
        fontWeight: 700,
        color: PURPLE,
    },

    title: {
        fontSize: 16,
        fontWeight: 700,
        marginTop: 4,
        color: PURPLE,
    },

    card: {
        borderWidth: 1,
        borderColor: PURPLE,
        borderRadius: 6,
        padding: 10,
        marginVertical: 10,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },

    label: {
        fontWeight: 600,
    },

    sectionHeader: {
        backgroundColor: PURPLE,
        color: "white",
        padding: 6,
        flexDirection: "row",
        fontWeight: 600,
    },

    tableRow: {
        flexDirection: "row",
        padding: 6,
        borderBottomWidth: 1,
        borderColor: LIGHT_PURPLE,
    },

    alt: {
        backgroundColor: LIGHT_PURPLE,
    },

    bold: {
        fontWeight: 600,
    },

    right: {
        textAlign: "right",
    },

    netContainer: {
        marginTop: 14,
        flexDirection: "row",
        borderRadius: 6,
        overflow: "hidden",
    },

    netLabel: {
        flex: 3,
        backgroundColor: PURPLE,
        color: "white",
        padding: 10,
    },

    netAmount: {
        flex: 1,
        backgroundColor: TEAL,
        color: "white",
        padding: 10,
        textAlign: "right",
        fontWeight: 700,
        fontSize: 12,
    },

    colLabel: {
        flex: 3,
    },
    colAmount: {
        flex: 1,
        textAlign: "right",
    },
    colLabelRight: {
        flex: 3,
        paddingLeft: 16,
    },
    colAmountRight: {
        flex: 1,
        textAlign: "right",
    },
});

// ---- STATIC LABELS ----
const EARNINGS = [
    ["Basic Salary", "basic"],
    ["House Rent Allowance", "hra"],
    ["Conveyance Allowance", "conveyance"],
    ["Medical Allowance", "medical"],
    ["Bonus", "bonus"],
    ["Other Earnings", "other"],
];

const DEDUCTIONS = [
    ["Provident Fund", "pf"],
    ["ESI", "esi"],
    ["Professional Tax", "professionalTax"],
    ["TDS", "tds"],
    ["Other Deductions", "other"],
];

// ---- HELPERS ----
const money = (n?: number) => `Rs ${(n || 0).toFixed(2)}`;

// ---- COMPONENT ----
export default function SalaryStatementPDF({
    companyName,
    employeeName,
    designation,
    dateOfJoining,
    year,
    earnings = {},
    deductions = {},
    totals = {},
}: any) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.company}>{companyName}</Text>
                    <Text style={styles.title}>
                        Salary Statement - {year}
                    </Text>
                </View>

                {/* EMPLOYEE CARD */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Employee Name</Text>
                        <Text>{employeeName}</Text>
                    </View>

                    {designation && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Designation</Text>
                            <Text>{designation}</Text>
                        </View>
                    )}

                    {dateOfJoining && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Date of Joining</Text>
                            <Text>
                                {new Date(dateOfJoining).toLocaleDateString()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.row}>
                        <Text style={styles.label}>Year</Text>
                        <Text>{year}</Text>
                    </View>
                </View>

                {/* EARNINGS + DEDUCTIONS */}
                <View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.colLabel}>Earnings</Text>
                        <Text style={styles.colAmount}>Amount</Text>
                        <Text style={styles.colLabelRight}>Deductions</Text>
                        <Text style={styles.colAmountRight}>Amount</Text>
                    </View>

                    {Array.from({ length: Math.max(EARNINGS.length, DEDUCTIONS.length) }).map(
                        (_, i) => {
                            const e = EARNINGS[i];
                            const d = DEDUCTIONS[i];

                            return (
                                <View style={[
                                    styles.tableRow,
                                    ...(i % 2 === 0 ? [styles.alt] : []),
                                ]}>
                                    <Text style={styles.colLabel}>{e?.[0] || ""}</Text>
                                    <Text style={styles.colAmount}>
                                        {money(earnings[e?.[1]] || 0)}
                                    </Text>

                                    <Text style={styles.colLabelRight}>{d?.[0] || ""}</Text>
                                    <Text style={styles.colAmountRight}>
                                        {d ? `- ${money(deductions[d[1]] || 0)}` : ""}
                                    </Text>
                                </View>
                            );
                        }
                    )}

                    {/* TOTALS */}
                    <View style={[styles.tableRow, styles.alt]}>
                        <Text style={[styles.colLabel, styles.bold]}>Gross</Text>
                        <Text style={[styles.colAmount, styles.bold]}>
                            {money(totals.gross)}
                        </Text>

                        <Text style={[styles.colLabelRight, styles.bold]}>
                            Total Deductions
                        </Text>
                        <Text style={[styles.colAmountRight, styles.bold]}>
                            - {money(totals.deductions)}
                        </Text>
                    </View>
                </View>

                {/* NET */}
                <View style={styles.netContainer}>
                    <View style={styles.netLabel}>
                        <Text style={styles.bold}>
                            Total Net Payable
                        </Text>
                    </View>

                    <Text style={styles.netAmount}>
                        {money(totals.net)}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}