"use client";

import { useRef } from "react";
import { Printer, Download, Camera, Smartphone, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useDashboard } from "../layout";

export default function QRStationPage() {
    const { clinicName, clinicId } = useDashboard();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            pdf.save(`Affiche-${clinicName.replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
            console.error("PDF Error", error);
            alert("Erreur lors de la génération du PDF");
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-8 p-8">
            {/* Left Column: Live Preview / Print Area */}
            <div className="flex-1 bg-gray-100 border-2 border-black p-8 overflow-hidden flex items-center justify-center print:border-0 print:bg-white print:p-0 rounded-xl">
                <div
                    ref={printRef}
                    className="print-content bg-white w-[210mm] h-[297mm] shadow-2xl flex flex-col items-center justify-between p-8 text-center scale-[0.45] origin-center print:scale-100 print:shadow-none"
                >
                    <div className="space-y-1">
                        <h2 className="font-display font-black text-4xl uppercase tracking-tighter">Prenez votre ticket</h2>
                        <p className="text-lg font-medium text-gray-500">Scannez pour rejoindre la file d'attente</p>
                    </div>

                    <div className="p-4 border-4 border-black bg-white">
                        <QRCodeSVG
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/client-portal/${clinicId || 'new'}`}
                            size={250}
                            level="H"
                            includeMargin={false}
                        />
                    </div>

                    <div className="w-full max-w-xl space-y-3">
                        <Step number="1" icon={Camera} text="Ouvrez votre appareil photo" />
                        <Step number="2" icon={Smartphone} text="Scannez le code" />
                        <Step number="3" icon={Ticket} text="Prenez votre ticket virtuel" />
                    </div>

                    <div className="text-center">
                        <h3 className="font-display font-black text-2xl uppercase mb-1">{clinicName}</h3>
                        <p className="font-bold text-gray-500 text-xs">Powered by <span className="text-black">Saffi.</span></p>
                    </div>
                </div>
            </div>

            {/* Right Column: Actions */}
            <div className="w-80 flex flex-col gap-8 print:hidden">
                <div>
                    <h1 className="font-display font-black text-4xl uppercase tracking-tight mb-2">Borne QR</h1>
                    <p className="text-gray-500 font-medium">Gérez l'affichage de votre QR code pour la salle d'attente.</p>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handlePrint}
                        className="bg-[#2C2B57] text-white px-8 py-4 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 text-lg rounded-lg"
                    >
                        <Printer className="h-6 w-6" /> Imprimer
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 text-lg rounded-lg"
                    >
                        <Download className="h-6 w-6" /> Télécharger PDF
                    </button>
                </div>

                <div className="mt-auto bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Ticket className="h-5 w-5" /> Astuce
                    </h3>
                    <p className="text-blue-600 text-sm">
                        Imprimez cette affiche et placez-la à l'entrée de votre cabinet pour que les patients puissent prendre leur ticket sans contact.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0mm;
                    }
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    
                    /* Hide everything using visibility to preserve layout flow but hide content */
                    body * {
                        visibility: hidden;
                    }

                    /* Show only the print content and its children */
                    .print-content, .print-content * {
                        visibility: visible;
                    }

                    /* Position the print content to fill the page */
                    .print-content {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 210mm;
                        height: 296mm; /* Slightly less than 297mm to prevent spillover */
                        margin: 0;
                        padding: 2rem !important;
                        transform: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: hidden !important;
                        z-index: 9999;
                        background: white;
                        page-break-after: avoid;
                        page-break-inside: avoid;
                    }

                    /* Completely hide potential overlays */
                    .next-error-overlay, #next-route-announcer {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

function Step({ number, icon: Icon, text }: { number: string, icon: any, text: string }) {
    return (
        <div className="flex items-center gap-4 bg-gray-50 p-4 border-4 border-black">
            <div className="h-10 w-10 bg-black text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
                {number}
            </div>
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6" />
                <p className="font-bold text-xl">{text}</p>
            </div>
        </div>
    );
}
