"use client";
import PayrollNavbar from "@/components/payroll/PayrollNavbar";


export default function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <main className="flex-1 flex flex-col w-fill overflow-hidden">
                <PayrollNavbar />
                <div className="flex-1 overflow-y-auto relative p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}    