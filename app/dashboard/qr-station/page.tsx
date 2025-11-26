"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download, Camera, Smartphone, Ticket } from "lucide-react";

export default function QRStationPage() {
    const printRef = useRef<HTMLDivElement>(null);

    // Dynamic data - in production, these would come from your backend/context
    const doctorName = "Dr. Amine Ben Ali";
    const queueUrl = "https://saffi.tn/join/123";

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('Affiche-Saffi.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-8 flex gap-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex-1 bg-[#2C2B57] text-white font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 text-xl"
                >
                    <Printer className="h-6 w-6" />
                    IMPRIMER
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-pink-400 text-black font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 text-xl"
                >
                    <Download className="h-6 w-6" />
                    TÉLÉCHARGER PDF
                </button>
            </div>

            {/* A4 Paper Container */}
            <div className="max-w-4xl mx-auto">
                <div
                    ref={printRef}
                    className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_#000] print:shadow-none print:border-0"
                    style={{
                        aspectRatio: '210 / 297',
                        width: '100%',
                        maxWidth: '794px', // A4 width in pixels at 96 DPI
                    }}
                >
                    <div className="h-full flex flex-col items-center justify-between p-12 print:p-16">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h1 className="font-display font-black text-8xl tracking-tighter uppercase print:text-9xl">
                                BIENVENUE
                            </h1>
                            <h2 className="font-bold text-3xl print:text-4xl">
                                Cabinet du {doctorName}
                            </h2>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-8 border-8 border-black bg-white">
                                <QRCodeSVG
                                    value={queueUrl}
                                    size={400}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-6 w-full max-w-2xl">
                            <div className="flex items-center gap-4 bg-gray-100 p-6 border-4 border-black print:bg-white print:border-2">
                                <div className="shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
                                    1
                                </div>
                                <div className="flex items-center gap-3">
                                    <Camera className="h-8 w-8 shrink-0" />
                                    <p className="font-bold text-xl">Ouvrez votre appareil photo</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-100 p-6 border-4 border-black print:bg-white print:border-2">
                                <div className="shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
                                    2
                                </div>
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-8 w-8 shrink-0" />
                                    <p className="font-bold text-xl">Scannez le code</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-100 p-6 border-4 border-black print:bg-white print:border-2">
                                <div className="shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
                                    3
                                </div>
                                <div className="flex items-center gap-3">
                                    <Ticket className="h-8 w-8 shrink-0" />
                                    <p className="font-bold text-xl">Prenez votre ticket virtuel</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center">
                            <p className="font-bold text-lg text-gray-600 print:text-black">
                                Powered by <span className="font-display">Saffi.tn</span> - La file d'attente intelligente
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print-specific styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    
                    .print\\:border-0 {
                        border: 0 !important;
                    }
                    
                    .print\\:bg-white {
                        background-color: white !important;
                    }
                    
                    .print\\:border-2 {
                        border-width: 2px !important;
                    }
                    
                    .print\\:text-black {
                        color: black !important;
                    }
                    
                    .print\\:text-9xl {
                        font-size: 8rem !important;
                        line-height: 1 !important;
                    }
                    
                    .print\\:text-4xl {
                        font-size: 2.25rem !important;
                        line-height: 2.5rem !important;
                    }
                    
                    .print\\:p-16 {
                        padding: 4rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
