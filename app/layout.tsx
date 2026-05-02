import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { CompanyLogoProvider } from "@/components/company-logo-provider";
import "./globals.css";

import { AttendanceProvider } from "@/components/attendance/AttendanceContext";
import { TimeOffProvider } from "@/components/timeoff/TimeOffContext";
import { AuthProvider } from "@/components/auth/AuthContext";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmPay HRMS",
  description: "EmPay Human Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <CompanyLogoProvider>
          <AuthProvider>
              <AttendanceProvider>
                <TimeOffProvider>
                  {children}
                </TimeOffProvider>
              </AttendanceProvider>
          </AuthProvider>
          </CompanyLogoProvider>
        </QueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
