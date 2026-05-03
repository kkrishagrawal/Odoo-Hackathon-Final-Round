import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";

//  Types 

export interface PayslipPDFProps {
    companyName: string;
    companyLogoUrl?: string | null;
    month: number;
    year: number;
    employeeName: string;
    employeeCode: string | null;
    department: string | null;
    location: string | null;
    dateOfJoining: string | null;
    panNumber: string | null;
    uanNumber: string | null;
    bankAccountNumber: string | null;
    payPeriod: string;
    payDate: string;
    // Worked days
    attendanceDays: number;
    paidLeaveDays: number;
    totalPayableDays: number;
    workingDaysPerWeek: number;
    // Earnings
    basicSalary: number;
    hra: number;
    standardAllowance: number;
    bonus: number;
    lta: number;
    fixedAllowance: number;
    grossWage: number;
    // Deductions
    pfEmployee: number;
    pfEmployer: number;
    professionalTax: number;
    tdsDeduction: number;
    unpaidLeaveDeduction: number;
    totalDeductions: number;
    netWage: number;
}

//  Styles 

const PURPLE = "#714B67";
const TEAL = "#15AABF";
const LIGHT_PURPLE = "#F3EEF8";

const s = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        padding: 32,
        color: "#222",
        backgroundColor: "#fff",
    },
    // Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    logo: { width: 60, height: 30, objectFit: "contain" },
    companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: PURPLE },
    title: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: PURPLE,
        marginBottom: 10,
    },
    // Info box
    infoBox: {
        border: "1pt solid #C9B8E8",
        borderRadius: 4,
        padding: 10,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    infoCol: { flex: 1 },
    infoRow: { flexDirection: "row", marginBottom: 4 },
    infoLabel: { width: 90, color: PURPLE, fontFamily: "Helvetica-Bold" },
    infoColon: { width: 10, color: PURPLE },
    infoValue: { flex: 1 },
    // Section headers
    sectionHeader: {
        backgroundColor: PURPLE,
        color: "#fff",
        fontFamily: "Helvetica-Bold",
        padding: "5 8",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 0,
    },
    sectionHeaderText: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9 },
    // Worked days table
    workedRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "4 8",
        borderBottom: "0.5pt solid #E0D6F0",
    },
    workedLabel: { color: PURPLE, fontSize: 8 },
    workedValue: { color: PURPLE, fontSize: 8 },
    // Earnings/Deductions split table
    splitTable: {
        flexDirection: "row",
        marginBottom: 12,
    },
    splitCol: { flex: 1 },
    splitHeaderCell: {
        backgroundColor: PURPLE,
        color: "#fff",
        fontFamily: "Helvetica-Bold",
        padding: "5 8",
        fontSize: 9,
    },
    splitRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "4 8",
        borderBottom: "0.5pt solid #E0D6F0",
    },
    splitLabel: { flex: 1 },
    splitAmount: { width: 70, textAlign: "right" },
    splitDivider: { width: 1, backgroundColor: "#C9B8E8" },
    // Total row
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "5 8",
        backgroundColor: LIGHT_PURPLE,
        borderTop: "1pt solid #C9B8E8",
    },
    totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
    totalAmount: { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "right", width: 70 },
    // Net payable footer
    netBar: {
        flexDirection: "row",
        marginTop: 12,
        borderRadius: 4,
        overflow: "hidden",
        border: "1pt solid #C9B8E8",
    },
    netLeft: {
        backgroundColor: PURPLE,
        padding: "8 12",
        flex: 1,
    },
    netLeftText: {
        color: "#fff",
        fontFamily: "Helvetica-Bold",
        fontSize: 11,
    },
    netLeftSub: {
        color: "#D8C8EE",
        fontSize: 7,
        marginTop: 2,
    },
    netRight: {
        backgroundColor: TEAL,
        padding: "8 12",
        width: 130,
        alignItems: "center",
        justifyContent: "center",
    },
    netAmount: {
        color: "#fff",
        fontFamily: "Helvetica-Bold",
        fontSize: 13,
    },
    netWords: {
        color: "#fff",
        fontSize: 7,
        marginTop: 2,
        textAlign: "center",
    },
});

//  Helpers 

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtINR(n: number): string {
    return `Rs ${Number(n || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

// Convert number to words (Indian system, up to crores)
function numberToWords(num: number): string {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (num === 0) return "Zero";

    function convert(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    }

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = convert(rupees) + " Rupees";
    if (paise > 0) result += " and " + convert(paise) + " Paise";
    return result + " Only";
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoColon}>:</Text>
            <Text style={s.infoValue}>{value || "—"}</Text>
        </View>
    );
}

function EarningRow({ label, amount }: { label: string; amount: number }) {
    return (
        <View style={s.splitRow}>
            <Text style={s.splitLabel}>{label}</Text>
            <Text style={s.splitAmount}>{fmtINR(amount)}</Text>
        </View>
    );
}

function DeductionRow({ label, amount }: { label: string; amount: number }) {
    return (
        <View style={s.splitRow}>
            <Text style={s.splitLabel}>{label}</Text>
            <Text style={[s.splitAmount, { color: amount > 0 ? "#C0392B" : "#222" }]}>
                {amount > 0 ? `- ${fmtINR(amount)}` : fmtINR(0)}
            </Text>
        </View>
    );
}

//  Document 

export function PayslipPDF(p: PayslipPDFProps) {
    const monthName = MONTHS[p.month - 1];
    const lastDay = new Date(p.year, p.month, 0).getDate();

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* Header */}
                <View style={s.headerRow}>
                    {p.companyLogoUrl ? (
                        <Image src={p.companyLogoUrl} style={s.logo} />
                    ) : (
                        <Text style={s.companyName}>{p.companyName}</Text>
                    )}
                </View>

                {/* Title */}
                <Text style={s.title}>
                    Salary slip for month of {monthName} {p.year}
                </Text>

                {/* Employee Info Box */}
                <View style={s.infoBox}>
                    <View style={s.infoCol}>
                        <InfoRow label="Employee name" value={p.employeeName} />
                        <InfoRow label="Employee Code" value={p.employeeCode ?? ""} />
                        <InfoRow label="Department" value={p.department ?? ""} />
                        <InfoRow label="Location" value={p.location ?? ""} />
                        <InfoRow label="Date of joining" value={p.dateOfJoining ?? ""} />
                    </View>
                    <View style={s.infoCol}>
                        <InfoRow label="PAN" value={p.panNumber ?? ""} />
                        <InfoRow label="UAN" value={p.uanNumber ?? ""} />
                        <InfoRow label="Bank A/c No." value={p.bankAccountNumber ?? ""} />
                        <InfoRow label="Pay period" value={p.payPeriod} />
                        <InfoRow label="Pay date" value={p.payDate} />
                    </View>
                </View>

                {/* Worked Days */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionHeaderText}>Worked Days</Text>
                    <Text style={s.sectionHeaderText}>Number of Days</Text>
                </View>
                <View style={s.workedRow}>
                    <Text style={s.workedLabel}>Attendance</Text>
                    <Text style={s.workedValue}>{p.attendanceDays} Days</Text>
                </View>
                {p.paidLeaveDays > 0 && (
                    <View style={s.workedRow}>
                        <Text style={s.workedLabel}>Paid Time Off</Text>
                        <Text style={s.workedValue}>{p.paidLeaveDays} Days</Text>
                    </View>
                )}
                <View style={[s.workedRow, { backgroundColor: LIGHT_PURPLE }]}>
                    <Text style={[s.workedLabel, { fontFamily: "Helvetica-Bold" }]}>Total</Text>
                    <Text style={[s.workedValue, { fontFamily: "Helvetica-Bold" }]}>{p.totalPayableDays} Days</Text>
                </View>

                {/* Earnings + Deductions split table */}
                <View style={[s.splitTable, { marginTop: 10 }]}>
                    {/* Earnings */}
                    <View style={s.splitCol}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionHeaderText}>Earnings</Text>
                            <Text style={s.sectionHeaderText}>Amounts</Text>
                        </View>
                        <EarningRow label="Basic Salary" amount={p.basicSalary} />
                        <EarningRow label="House Rent Allowance" amount={p.hra} />
                        <EarningRow label="Standard Allowance" amount={p.standardAllowance} />
                        <EarningRow label="Performance Bonus" amount={p.bonus} />
                        <EarningRow label="Leave Travel Allowance" amount={p.lta} />
                        <EarningRow label="Fixed Allowance" amount={p.fixedAllowance} />
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Gross</Text>
                            <Text style={s.totalAmount}>{fmtINR(p.grossWage)}</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={s.splitDivider} />

                    {/* Deductions */}
                    <View style={s.splitCol}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionHeaderText}>Deductions</Text>
                            <Text style={s.sectionHeaderText}>Amounts</Text>
                        </View>
                        <DeductionRow label="PF Employee" amount={p.pfEmployee} />
                        <DeductionRow label="PF Employer" amount={p.pfEmployer} />
                        <DeductionRow label="Professional Tax" amount={p.professionalTax} />
                        <DeductionRow label="TDS Deduction" amount={p.tdsDeduction} />
                        {p.unpaidLeaveDeduction > 0 && (
                            <DeductionRow label="Unpaid Leave" amount={p.unpaidLeaveDeduction} />
                        )}
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Total Deductions</Text>
                            <Text style={[s.totalAmount, { color: "#C0392B" }]}>- {fmtINR(p.totalDeductions)}</Text>
                        </View>
                    </View>
                </View>

                {/* Net Payable */}
                <View style={s.netBar}>
                    <View style={s.netLeft}>
                        <Text style={s.netLeftText}>Total Net Payable (Gross Earning - Total Deductions)</Text>
                        <Text style={s.netLeftSub}>{numberToWords(p.netWage)}</Text>
                    </View>
                    <View style={s.netRight}>
                        <Text style={s.netAmount}>{fmtINR(p.netWage)}</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
}