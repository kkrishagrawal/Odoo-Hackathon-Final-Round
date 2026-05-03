"use client";
import PayrollNavbar from "@/components/payroll/PayrollNavbar";
import Sidebar from "@/components/Sidebar";
import EmVoice from "@/components/EmVoice";
import { RoleGuard } from "@/components/auth/AuthContext";
import TopBar from "@/components/TopBar";

export default function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (

        <RoleGuard segment="payroll">
            <div className="flex h-screen overflow-hidden">
                <Sidebar role="payroll" />
                <main className="flex-1 flex flex-col w-fill overflow-hidden">
                    <TopBar />
                    <PayrollNavbar />
                    <div className="flex-1 overflow-y-auto relative p-6">
                        {children}
                        <EmVoice />
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}    