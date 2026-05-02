import PayrollNavbar from "@/components/payroll/PayrollNavbar";

export default function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col w-full">
            <PayrollNavbar />
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}