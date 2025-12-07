'use client';

import React from 'react';
import Image from 'next/image';
import InstallButton from '@/components/pwa/InstallButton';
import { Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
    clinicName?: string;
    wifiCode?: string;
}

export default function Navbar({ clinicName, wifiCode }: NavbarProps) {
    // Debug: Log the wifiCode value
    console.log('Navbar wifiCode:', wifiCode);
    
    const handleCopyWifiCode = async () => {
        if (!wifiCode) {
            toast.error("Le code WiFi n'est pas disponible");
            return;
        }
        
        try {
            await navigator.clipboard.writeText(wifiCode);
            toast.success("Code WiFi copié !");
        } catch (error) {
            toast.error("Erreur lors de la copie");
        }
    };

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b-2 border-black sticky top-0 z-50">
            <div className="flex flex-col">
                <Image
                    src="/media/black_logo.png"
                    alt="Saffi Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                />
                {clinicName && (
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wide truncate max-w-[200px] mt-1">
                        {clinicName}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {wifiCode && (
                    <button
                        onClick={handleCopyWifiCode}
                        className="h-10 px-3 bg-white border-2 border-black flex items-center gap-2 font-bold hover:bg-blue-400 transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        title="Copier le code WiFi"
                    >
                        <Wifi className="h-4 w-4" />
                    </button>
                )}
                <InstallButton />
            </div>
        </header>
    );
}
