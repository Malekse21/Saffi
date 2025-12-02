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
    const [specialty, setSpecialty] = useState("");
    const [queueUrl, setQueueUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchProfile = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Error fetching user:", userError);
                    setLoading(false);
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, clinic_name, specialty, slug, clinic_id')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error("Error fetching profile:", profileError);
                }

                if (profile) {
                    setDoctorName(profile.full_name || "Docteur");
                    setClinicName(profile.clinic_name || "Cabinet Médical");
                    setSpecialty(profile.specialty || "");

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

        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('profile-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    },
                    (payload) => {
                        const newProfile = payload.new as any;
                        setDoctorName(newProfile.full_name || "Docteur");
                        setClinicName(newProfile.clinic_name || "Cabinet Médical");
                        setSpecialty(newProfile.specialty || "");
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtimeSubscription();
    }, []);

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            pdf.save('page qr code.pdf');
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
        <>
            <style dangerouslySetInnerHTML={{ __html: `@media print {@page {size: A4;margin: 0;}body {margin: 0;padding: 0;-webkit-print-color-adjust: exact;print-color-adjust: exact;}#qr-poster {width: 210mm !important;height: 297mm !important;max-height: none !important;border: none !important;box-shadow: none !important;page-break-after: avoid;-webkit-print-color-adjust: exact;print-color-adjust: exact;}}` }} />
            <div className="h-[calc(100vh-4rem)] bg-white p-6 overflow-hidden print:p-0 print:h-auto print:overflow-visible">
                {!queueUrl && (
                    <div className="mb-4 bg-yellow-100 border-4 border-yellow-600 p-3 print:hidden">
                        <h3 className="font-black text-base mb-1">⚠️ QR Code non disponible</h3>
                        <p className="font-bold text-xs">Exécutez <code className="bg-yellow-200 px-2 py-1">008_create_profiles_trigger.sql</code></p>
                    </div>
                )}

                <div className="flex gap-8 h-full items-center print:block print:h-auto -mt-12 print:mt-0">
                    {/* Left side - A4 Preview */}
                    <div className="print:w-full">
                        <div id="qr-poster" ref={printRef} className="bg-white border-4 border-black shadow-xl relative overflow-hidden print:shadow-none print:border-0" style={{ width: '380px', height: '550px', backgroundColor: '#ffffff', borderColor: '#000000' }}>
                            {/* Corner illustrations - smaller and tidier */}
                            <div className="absolute top-3 right-3 w-10 h-10 border-3 border-black rounded-lg print:top-8 print:right-8 print:w-16 print:h-16" style={{ backgroundColor: '#f472b6', borderColor: '#000000' }}></div>
                            <div className="absolute top-3 left-3 w-10 h-10 border-3 border-black rounded-full print:top-8 print:left-8 print:w-16 print:h-16" style={{ backgroundColor: '#2dd4bf', borderColor: '#000000' }}></div>
                            <div className="absolute bottom-3 left-3 w-10 h-10 border-3 border-black rounded-lg rotate-45 print:bottom-8 print:left-8 print:w-16 print:h-16" style={{ backgroundColor: '#fde047', borderColor: '#000000' }}></div>
                            <div className="absolute bottom-3 right-3 w-10 h-10 border-3 border-black rounded-full print:bottom-8 print:right-8 print:w-16 print:h-16" style={{ backgroundColor: '#c084fc', borderColor: '#000000' }}></div>

                            <div className="h-full flex flex-col items-center justify-center p-5 print:p-16 relative z-10 gap-4 print:gap-8">
                                {/* Header */}
                                <div className="text-center space-y-0.5 print:space-y-2">
                                    <h1 className="font-display font-black text-3xl print:text-7xl tracking-tight uppercase" style={{ color: '#000000' }}>BIENVENUE</h1>
                                    <h2 className="font-bold text-base print:text-3xl" style={{ color: '#000000' }}>{clinicName}</h2>
                                    {specialty && (
                                        <p className="font-semibold text-xs print:text-xl italic" style={{ color: '#4b5563' }}>{specialty}</p>
                                    )}
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center gap-1.5 print:gap-4">
                                    <div className="p-3 print:p-8 border-4 print:border-6 border-black bg-white shadow-[4px_4px_0px_0px_#000]" style={{ backgroundColor: '#ffffff', borderColor: '#000000', boxShadow: '4px 4px 0px 0px #000000' }}>
                                        <QRCodeSVG value={queueUrl || "https://saffi.tn"} size={180} level="H" includeMargin={false} className="print:w-[350px] print:h-[350px]" />
                                    </div>
                                    <p className="font-bold text-xs print:text-xl" style={{ color: '#374151' }}>Scannez pour rejoindre la file</p>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-1.5 print:space-y-4 w-full px-2 print:px-8 print:max-w-2xl">
                                    {[
                                        { num: 1, icon: Camera, text: "Ouvrez l'appareil photo", color: "#fce7f3" },
                                        { num: 2, icon: Smartphone, text: "Scannez le code QR", color: "#fef9c3" },
                                        { num: 3, icon: Ticket, text: "Prenez votre ticket", color: "#cffafe" }
                                    ].map(({ num, icon: Icon, text, color }) => (
                                        <div key={num} className="flex items-center gap-1.5 print:gap-4 p-1.5 print:p-4 border-3 print:border-4 border-black shadow-[2px_2px_0px_0px_#000]" style={{ backgroundColor: color, borderColor: '#000000', boxShadow: '2px 2px 0px 0px #000000' }}>
                                            <div className="shrink-0 w-5 h-5 print:w-10 print:h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-[10px] print:text-lg" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{num}</div>
                                            <div className="flex items-center gap-1.5 print:gap-3">
                                                <Icon className="h-3.5 w-3.5 print:h-7 print:w-7 shrink-0" style={{ color: '#000000' }} />
                                                <p className="font-bold text-[11px] print:text-lg" style={{ color: '#000000' }}>{text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="text-center mt-auto">
                                    <p className="font-semibold text-[10px] print:text-base" style={{ color: '#6b7280' }}>
                                        Powered by <span className="font-display" style={{ color: '#2C2B57' }}>Saffi.tn</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Action buttons */}
                    <div className="flex flex-col gap-4 print:hidden">
                        <button onClick={handlePrint} className="bg-[#2C2B57] text-white font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 text-lg">
                            <Printer className="h-6 w-6" />
                            IMPRIMER
                        </button>
                        <button onClick={handleDownloadPDF} className="bg-pink-400 text-black font-bold py-4 px-8 rounded-lg border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 text-lg">
                            <Download className="h-6 w-6" />
                            TÉLÉCHARGER PDF
                        </button>

                        {/* Instructions */}
                        <div className="mt-4 space-y-3">
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
                                <h3 className="font-black text-base mb-2 flex items-center gap-2">
                                    <Printer className="h-4 w-4" />
                                    Impression
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-700">
                                    Imprimez l'affiche en format A4 et placez-la à l'entrée de votre cabinet pour que vos patients puissent scanner le QR code.
                                </p>
                            </div>
                            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
                                <h3 className="font-black text-base mb-2 flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    Utilisation
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-700">
                                    Les patients scannent le code QR avec leur smartphone pour rejoindre la file d'attente virtuelle et recevoir leur numéro de ticket.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
