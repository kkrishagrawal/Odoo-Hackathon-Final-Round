import PayslipDetail from "@/components/payroll/PayslipDetail";

export default async function PayslipPage({
    params,
}: {
    params: Promise<{ payslipId: string }>;
}) {
    const { payslipId } = await params;
    return <PayslipDetail payslipId={payslipId} />;
}