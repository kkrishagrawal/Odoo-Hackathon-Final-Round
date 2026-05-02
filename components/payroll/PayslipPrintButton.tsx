"use client";

import dynamic from "next/dynamic";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PayslipPDF, PayslipPDFProps } from "./PayslipPDF";
import { Button } from "@/components/ui/button";

const PDFDownloadLinkDynamic = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button size="sm" variant="outline" disabled>Print</Button> }
);

interface Props {
    data: PayslipPDFProps;
    disabled?: boolean;
}

export function PayslipPrintButton({ data, disabled }: Props) {
    const fileName = `payslip_${data.employeeName.replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf`;

    return (
        <PDFDownloadLinkDynamic
            document={<PayslipPDF {...data} />}
            fileName={fileName}
        >
            {({ loading }) => (
                <Button size="sm" variant="outline" disabled={disabled || loading}>
                    {loading ? "Preparing…" : "Print"}
                </Button>
            )}
        </PDFDownloadLinkDynamic>
    );
}