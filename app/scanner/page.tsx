'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ScanLine, Loader2 } from 'lucide-react';
import Navbar from '@/components/patient/Navbar';

export default function ScannerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check for active session
        const patientId = localStorage.getItem('saffi_patient_id'); // Assuming this key based on context, verify if possible or rely on cookies
        // If we want to be more robust, we might need to check with supabase or a cookie.
        // For this task, we'll check the typical storage key. 
        // Re-reading client-portal code confirms it uses session storage or params.
        // But if the user left the tab, they might not have session storage.
        // Let's rely on standard cookies or if we previously set a persistent ID.
        // Since we don't have a guaranteed persistent ID logic yet, we will check if there's a recent "last_visited_queue" URL in local storage
        // or just proceed to scanner.
        
        // Let's implement a simple "last_queue_url" check if we decide to save it on the client portal.
        // For now, proceed to scanner.
        setIsLoading(false);

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        function onScanSuccess(decodedText: string, decodedResult: any) {
            // Handle Scan
            console.log(`Scan result: ${decodedText}`);
            
            // Check if it's a Saffi URL
            if (decodedText.includes('saffi') || decodedText.includes('join') || decodedText.includes('localhost')) {
                 // Stop scanning
                scanner.clear().catch(error => {
                    console.error("Failed to clear scanner. ", error);
                });
                
                toast.success("Code détecté ! Redirection...");
                router.push(decodedText);
            } else {
                toast.error("Ce n'est pas un code Saffi valide.");
            }
        }

        function onScanFailure(error: any) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        if (!isLoading) {
             scanner.render(onScanSuccess, onScanFailure);
        }

        return () => {
             scanner.clear().catch(error => console.error("Failed to clear scanner on unmount", error));
        };
    }, [isLoading, router]);

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <Navbar />
            
            <div className="flex-1 flex flex-col items-center justify-center relative bg-black p-4">
                {/* Scanner Container */}
                <div className="w-full max-w-sm bg-black rounded-xl overflow-hidden relative border-4 border-white/20">
                     <div id="reader" className="bg-black text-white"></div>
                     
                     {/* Overlay Text */}
                     <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <p className="text-white font-bold uppercase tracking-widest text-sm drop-shadow-md">
                            Scannez le code du cabinet
                        </p>
                     </div>
                </div>

                <div className="mt-8 text-center px-6">
                    <p className="text-gray-400 text-xs text-center max-w-xs mx-auto">
                        Placez le QR Code dans le cadre. La détection est automatique.
                    </p>
                </div>
            </div>
        </div>
    );
}
