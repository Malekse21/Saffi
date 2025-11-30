"use client";

import { useRef, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download, Camera, Smartphone, Ticket, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function QRStationPage() {
    const printRef = useRef<HTMLDivElement>(null);
    const [doctorName, setDoctorName] = useState("");
    const [clinicName, setClinicName] = useState("");
    const [queueUrl, setQueueUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Error fetching user:", userError);
                    setLoading(false);
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, clinic_name, slug, clinic_id')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error("Error fetching profile:", profileError);
                }

                console.log("Profile data:", profile);

                if (profile) {
                    setDoctorName(profile.full_name || "Docteur");
                    setClinicName(profile.clinic_name || "Cabinet Médical");

                    // Use slug if available, otherwise fall back to clinic_id
                    const identifier = profile.slug || profile.clinic_id;
                    if (identifier) {
                        setQueueUrl(`${window.location.origin}/client-portal/${identifier}`);
                    }
                }
            } catch (error) {
                console.error("Unexpected error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            const canvas = await html2canvas(printRef.current, {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
            <div className="max-w-4xl mx-auto mb-8 flex gap-4 print:hidden">
                <button onClick={handlePrint} className="flex-1 bg-[#2C2B57] text-white font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 text-xl">
                    <Printer className="h-6 w-6" />
                    IMPRIMER
                </button>
                <button onClick={handleDownloadPDF} className="flex-1 bg-pink-400 text-black font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 text-xl">
                    <Download className="h-6 w-6" />
                    TÉLÉCHARGER PDF
                </button>
            </div>

            {!queueUrl && (
                <div className="max-w-4xl mx-auto mb-8 bg-yellow-100 border-4 border-yellow-600 p-6 print:hidden">
                    <h3 className="font-black text-xl mb-2">⚠️ QR Code non disponible</h3>
                    <p className="font-bold mb-2">Votre identifiant de cabinet n'a pas encore été généré.</p>
                    <p className="text-sm"><strong>Solution:</strong> Exécutez <code className="bg-yellow-200 px-2 py-1">008_create_profiles_trigger.sql</code> dans Supabase SQL Editor.</p>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div ref={printRef} className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_#000] print:shadow-none print:border-0" style={{ aspectRatio: '210 / 297', width: '100%', maxWidth: '794px' }}>
                    <div className="h-full flex flex-col items-center justify-between p-12 print:p-16">
                        <div className="text-center space-y-4">
                            <h1 className="font-display font-black text-8xl tracking-tighter uppercase print:text-9xl">BIENVENUE</h1>
                            <h2 className="font-bold text-3xl print:text-4xl">{clinicName}</h2>
                            <p className="font-bold text-xl text-gray-600">Dr. {doctorName}</p>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <div className="p-8 border-8 border-black bg-white">
                                <QRCodeSVG value={queueUrl || "https://saffi.tn"} size={400} level="H" includeMargin={false} />
                            </div>
                        </div>

                        <div className="space-y-6 w-full max-w-2xl">
                            {[
                                { num: 1, icon: Camera, text: " Ouvrez votre appareil photo" },
                                { num: 2, icon: Smartphone, text: "Scannez le code" },
                                { num: 3, icon: Ticket, text: "Prenez votre ticket virtuel" }
                            ].map(({ num, icon: Icon, text }) => (
                                <div key={num} className="flex items-center gap-4 bg-gray-100 p-6 border-4 border-black print:bg-white print:border-2">
                                    <div className="shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">{num}</div>
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-8 w-8 shrink-0" />
                                        <p className="font-bold text-xl">{text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="font-bold text-lg text-gray-600 print:text-black">
                                Powered by <span className="font-display">Saffi.tn</span> - La file d'attente intelligente
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
