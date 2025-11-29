"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download } from "lucide-react";

export default function QRStationPage() {
    const posterRef = useRef<HTMLDivElement>(null);
    const clinicName = "Cabinet Dr. Malek"; // This could be dynamic later
    const qrUrl = "https://saffi.app/checkin/123"; // Example URL

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!posterRef.current) return;

        try {
            const canvas = await html2canvas(posterRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("saffi-qr-poster.pdf");
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Actions Bar */}
            <div className="flex w-full max-w-[210mm] items-center justify-between print:hidden">
                <h2 className="text-2xl font-bold">Borne QR</h2>
                <div className="flex gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-50"
                    >
                        <Printer className="h-5 w-5" />
                        Imprimer
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                    >
                        <Download className="h-5 w-5" />
                        Télécharger PDF
                    </button>
                </div>
            </div>

            {/* A4 Poster Preview */}
            <div className="overflow-auto p-4 print:p-0 print:overflow-visible">
                <div
                    ref={posterRef}
                    className="relative flex h-[297mm] w-[210mm] flex-col items-center justify-between border-2 border-black bg-white p-16 text-center shadow-2xl print:border-none print:shadow-none"
                >
                    {/* Header */}
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter">{clinicName}</h1>
                        <p className="text-2xl font-medium text-gray-600">
                            Bienvenue / Welcome
                        </p>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center gap-8">
                        <div className="rounded-3xl border-4 border-black p-8">
                            <QRCodeSVG value={qrUrl} size={300} level="H" />
                        </div>
                        <p className="max-w-md text-3xl font-bold leading-tight">
                            Scannez ce code pour prendre votre ticket
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="w-full space-y-6 rounded-xl border-2 border-black bg-gray-50 p-8 text-left">
                        <h3 className="text-2xl font-bold uppercase tracking-wider text-gray-400">
                            Instructions
                        </h3>
                        <ol className="space-y-4 text-xl font-medium">
                            <li className="flex items-center gap-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-black text-white font-bold">
                                    1
                                </span>
                                Ouvrez l'appareil photo de votre téléphone
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-black text-white font-bold">
                                    2
                                </span>
                                Visez le QR Code ci-dessus
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-black text-white font-bold">
                                    3
                                </span>
                                Suivez les instructions sur votre écran
                            </li>
                        </ol>
                    </div>

                    {/* Footer */}
                    <div className="text-sm font-bold text-gray-400">
                        Powered by Saffi.
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
          }
          /* Hide everything except the poster */
          body > *:not(.print-content) {
            display: none !important;
          }
          /* We need to target the layout wrapper to hide sidebar/header */
          aside, header {
            display: none !important;
          }
          /* Ensure the poster is visible and takes full page */
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            height: 100vh !important;
          }
        }
      `}</style>
        </div>
    );
}
